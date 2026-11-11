import { expect, test } from '@playwright/test';

// Respostas controladas só nos testes. O app continua consultando a API real.
const currencies = [
  { iso_code: 'BRL', name: 'Brazilian Real' },
  { iso_code: 'EUR', name: 'Euro' },
  { iso_code: 'JPY', name: 'Japanese Yen' },
  { iso_code: 'USD', name: 'United States Dollar' },
  { iso_code: 'USDT', name: 'Tether' },
];

function responseFor(url) {
  const [, , , base, quote] = new URL(url).pathname.split('/');
  return { base, quote, rate: 5.3214, date: '2026-11-10' };
}

async function mockApi(page, { onCurrencies, onRate } = {}) {
  const requests = { currencies: 0, rates: [] };
  await page.route('https://api.frankfurter.dev/v2/**', async (route) => {
    const url = route.request().url();
    if (new URL(url).pathname === '/v2/currencies') {
      requests.currencies += 1;
      if (onCurrencies) return onCurrencies(route, requests.currencies);
      return route.fulfill({ json: currencies });
    }
    requests.rates.push(url);
    if (onRate) return onRate(route, requests.rates.length);
    return route.fulfill({ json: responseFor(url) });
  });
  return requests;
}

async function openReady(page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'De: USD', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Para: BRL', exact: true })).toBeEnabled();
}

async function selectCurrency(page, side, code, name) {
  await page.getByRole('button', { name: new RegExp(`^${side}:`) }).click();
  await page.getByRole('textbox', { name: 'Buscar moeda', exact: true }).fill(code);
  await page.getByRole('button', { name: `${code}, ${name}`, exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Buscar moeda', exact: true })).not.toBeVisible();
}

test('converte decimal, mostra taxa e data e registra capturas da interface', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const requests = await mockApi(page);
  await openReady(page);
  await page.getByRole('textbox', { name: 'Valor para converter', exact: true }).fill('10,50');
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByText('$10.50 equivalem a', { exact: true })).toBeVisible();
  await expect(page.getByText(/^R\$\s55,87$/).first()).toBeVisible();
  await expect(page.getByText('1 USD = 5,3214 BRL', { exact: true })).toBeVisible();
  await expect(page.getByText('10/11/2026', { exact: true })).toBeVisible();
  expect(requests.rates).toHaveLength(1);
  expect(requests.rates[0]).toBe('https://api.frankfurter.dev/v2/rate/USD/BRL');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByText('Data de referência', { exact: true }).scrollIntoViewIfNeeded();
  const filename = `conversao-${testInfo.project.name}.png`;
  const path =
    process.env.UPDATE_SCREENSHOTS === '1'
      ? `docs/screenshots/${filename}`
      : testInfo.outputPath(filename);
  await page.screenshot({ path, fullPage: true });
  expect(errors).toEqual([]);
});

test('bloqueia valores inválidos e moedas iguais sem consultar a taxa', async ({ page }) => {
  const requests = await mockApi(page);
  await openReady(page);
  const amount = page.getByRole('textbox', { name: 'Valor para converter', exact: true });
  const convert = page.getByRole('button', { name: 'Converter valor', exact: true });
  for (const [value, message] of [
    ['', 'Digite o valor que deseja converter.'],
    ['0', 'O valor precisa ser maior que zero.'],
    ['-1', 'O valor precisa ser maior que zero.'],
    ['abc', 'Digite um número válido, sem separador de milhares. Exemplo: 10,50.'],
    ['1.000,50', 'Digite um número válido, sem separador de milhares. Exemplo: 10,50.'],
  ]) {
    await amount.fill(value);
    await convert.click();
    await expect(page.getByRole('alert')).toHaveText(message);
  }
  await amount.fill('10.50');
  await selectCurrency(page, 'Para', 'USD', 'United States Dollar');
  await convert.click();
  await expect(page.getByRole('alert')).toHaveText(
    'Escolha moedas diferentes para fazer a conversão.',
  );
  expect(requests.rates).toHaveLength(0);
});

test('busca moedas, indica busca sem resultados e permite fechar a lista', async ({ page }) => {
  await mockApi(page);
  await openReady(page);
  await page.getByRole('button', { name: 'De: USD', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Buscar moeda', exact: true });
  await search.fill('inexistente');
  await expect(page.getByText('Nenhuma moeda encontrada.', { exact: true })).toBeVisible();
  await search.fill('Japanese');
  await page.getByRole('button', { name: 'JPY, Japanese Yen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'De: JPY', exact: true })).toBeVisible();
  await expect(search).not.toBeVisible();
  await page.getByRole('button', { name: 'Para: BRL', exact: true }).click();
  await expect(search).toHaveValue('');
  await page.getByRole('button', { name: 'Fechar lista de moedas', exact: true }).click();
  await expect(search).not.toBeVisible();
});

test('inverte o par e seleciona e remove favoritos', async ({ page }) => {
  const requests = await mockApi(page);
  await openReady(page);
  await page.getByRole('button', { name: 'Salvar par nos favoritos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Usar favorito USD para BRL', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Inverter moedas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'De: BRL', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Para: USD', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByText('1 BRL = 5,3214 USD', { exact: true })).toBeVisible();
  expect(requests.rates[0]).toBe('https://api.frankfurter.dev/v2/rate/BRL/USD');
  await page.getByRole('button', { name: 'Usar favorito USD para BRL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'De: USD', exact: true })).toBeVisible();
  await expect(page.getByText('1 BRL = 5,3214 USD', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Remover par dos favoritos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Usar favorito USD para BRL', exact: true }),
  ).toHaveCount(0);
});

test('mantém histórico separado do resultado e permite limpá-lo', async ({ page }) => {
  await mockApi(page);
  await openReady(page);
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByText(/^R\$\s532,14$/)).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Valor para converter', exact: true }).fill('20');
  await expect(page.getByText(/^R\$\s532,14$/)).toHaveCount(1);
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByText(/^R\$\s106,43$/)).toHaveCount(2);
  await page.getByRole('button', { name: 'Limpar histórico', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Limpar histórico', exact: true })).toHaveCount(0);
  await expect(page.getByText(/^R\$\s532,14$/)).toHaveCount(0);
  await expect(page.getByText(/^R\$\s106,43$/)).toHaveCount(1);
});

test('recupera falha de conexão na lista de moedas', async ({ page }) => {
  const requests = await mockApi(page, {
    onCurrencies: (route, count) =>
      count === 1 ? route.abort('failed') : route.fulfill({ json: currencies }),
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à Frankfurter.');
  await expect(page.getByRole('button', { name: 'Converter valor', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Tentar carregar moedas novamente', exact: true }).click();
  await expect(page.getByRole('button', { name: 'De: USD', exact: true })).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(requests.currencies).toBe(2);
});

test('limpa resultado após erro HTTP e permite nova conversão', async ({ page }) => {
  const requests = await mockApi(page, {
    onRate: (route, count) =>
      count === 2
        ? route.fulfill({ status: 503, json: { message: 'Service unavailable' } })
        : route.fulfill({ json: responseFor(route.request().url()) }),
  });
  await openReady(page);
  const convert = page.getByRole('button', { name: 'Converter valor', exact: true });
  await convert.click();
  await expect(page.getByText('1 USD = 5,3214 BRL', { exact: true })).toBeVisible();
  await convert.click();
  await expect(page.getByRole('alert')).toContainText('HTTP 503');
  await expect(page.getByText('1 USD = 5,3214 BRL', { exact: true })).toHaveCount(0);
  await expect(convert).toBeEnabled();
  await convert.click();
  await expect(page.getByText('1 USD = 5,3214 BRL', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(requests.rates).toHaveLength(3);
});

test('mostra carregamento, bloqueia clique duplicado e descarta consulta cancelada', async ({
  page,
}) => {
  let releaseOldRequest;
  const oldRequest = new Promise((resolve) => {
    releaseOldRequest = resolve;
  });
  const requests = await mockApi(page, {
    onRate: async (route, count) => {
      if (count === 1) await oldRequest;
      return route.fulfill({
        json: { ...responseFor(route.request().url()), rate: count === 1 ? 99 : 5.3214 },
      });
    },
  });
  await openReady(page);
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Convertendo', exact: true })).toBeDisabled();
  await expect(page.getByText('Consultando a taxa…', { exact: true })).toBeVisible();
  expect(requests.rates).toHaveLength(1);
  await page.getByRole('textbox', { name: 'Valor para converter', exact: true }).fill('20');
  await page.getByRole('button', { name: 'Converter valor', exact: true }).click();
  await expect(page.getByText('1 USD = 5,3214 BRL', { exact: true })).toBeVisible();
  releaseOldRequest();
  await expect(page.getByText(/^R\$\s106,43$/).first()).toBeVisible();
  await expect(page.getByText('1 USD = 99 BRL', { exact: true })).toHaveCount(0);
  expect(requests.rates).toHaveLength(2);
});
