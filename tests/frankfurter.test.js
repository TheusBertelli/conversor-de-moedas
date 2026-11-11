import { getCurrencies, getRate } from '../src/models/frankfurter';

const rate = { base: 'USD', quote: 'BRL', rate: 5.4367, date: '2026-11-10' };
const currencies = [
  { iso_code: 'USD', name: 'United States Dollar' },
  { iso_code: 'BRL', name: 'Brazilian Real' },
];

function respond(data, status = 200) {
  global.fetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('carrega e normaliza os códigos e nomes do catálogo v2', async () => {
  respond(currencies);
  await expect(getCurrencies()).resolves.toEqual([
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'USD', name: 'United States Dollar' },
  ]);
  expect(fetch).toHaveBeenCalledWith(
    'https://api.frankfurter.dev/v2/currencies',
    expect.objectContaining({
      headers: { Accept: 'application/json' },
      signal: expect.anything(),
    }),
  );
});

test('preserva códigos de ativos presentes na API com mais de três letras', async () => {
  respond([{ iso_code: 'USDT', name: 'Tether' }]);
  await expect(getCurrencies()).resolves.toEqual([{ code: 'USDT', name: 'Tether' }]);
});

test.each([
  [],
  {},
  null,
  [{ iso_code: 'USD' }],
  [{ iso_code: '../', name: 'Inválida' }],
  [currencies[0], currencies[0]],
])('rejeita catálogo vazio ou incompatível: %j', async (data) => {
  respond(data);
  await expect(getCurrencies()).rejects.toMatchObject({ code: 'schema' });
});

test('solicita o par na ordem escolhida e mantém precisão e data', async () => {
  respond(rate);
  await expect(getRate('USD', 'BRL')).resolves.toEqual(rate);
  expect(fetch).toHaveBeenCalledWith(
    'https://api.frankfurter.dev/v2/rate/USD/BRL',
    expect.anything(),
  );
});

test.each([
  null,
  [],
  {},
  { ...rate, base: 'BRL', quote: 'USD' },
  { ...rate, rate: '5.4367' },
  { ...rate, rate: 0 },
  { ...rate, rate: -1 },
  { ...rate, rate: Infinity },
  { ...rate, date: '2026-02-30' },
  { ...rate, date: '10/11/2026' },
])('rejeita taxa incompleta, invertida ou inválida: %j', async (data) => {
  respond(data);
  await expect(getRate('USD', 'BRL')).rejects.toMatchObject({ code: 'schema' });
});

test.each([
  ['USD', 'USD'],
  ['', 'BRL'],
  ['usd', 'BRL'],
  ['USD', '../BRL'],
])('bloqueia códigos inválidos e moedas iguais antes da rede: %s/%s', async (base, quote) => {
  await expect(getRate(base, quote)).rejects.toMatchObject({ code: 'validation' });
  expect(fetch).not.toHaveBeenCalled();
});

test.each([404, 422, 429, 500])('distingue erro HTTP %s', async (status) => {
  respond({ message: 'not found' }, status);
  await expect(getRate('USD', 'BRL')).rejects.toMatchObject({ code: 'http' });
});

test('explica uma falha no catálogo sem pedir para trocar o par de moedas', async () => {
  respond({ message: 'not found' }, 404);
  await expect(getCurrencies()).rejects.toMatchObject({
    code: 'http',
    message: 'Não foi possível carregar a lista de moedas (HTTP 404). Tente novamente.',
  });
});

test('distingue erro de comunicação', async () => {
  fetch.mockRejectedValue(new TypeError('Network request failed'));
  await expect(getCurrencies()).rejects.toMatchObject({ code: 'network' });
});

test('distingue JSON inválido', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  });
  await expect(getCurrencies()).rejects.toMatchObject({ code: 'json' });
});

test('encerra uma requisição que excede 15 segundos', async () => {
  jest.useFakeTimers();
  fetch.mockImplementation(
    (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
  );
  const promise = expect(getCurrencies()).rejects.toMatchObject({ code: 'timeout' });
  await jest.advanceTimersByTimeAsync(15000);
  await promise;
});

test('propaga cancelamento externo sem confundir com falha de conexão', async () => {
  const controller = new AbortController();
  fetch.mockImplementation(
    (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
  );
  const promise = expect(
    getRate('USD', 'BRL', { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  await promise;
});

test('não faz requisição quando o sinal já está cancelado', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(getCurrencies({ signal: controller.signal })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(fetch).not.toHaveBeenCalled();
});

test('não devolve JSON que terminou de carregar após o cancelamento', async () => {
  const controller = new AbortController();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => {
      controller.abort();
      return rate;
    },
  });
  await expect(getRate('USD', 'BRL', { signal: controller.signal })).rejects.toMatchObject({
    name: 'AbortError',
  });
});
