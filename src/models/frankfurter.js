const API_URL = 'https://api.frankfurter.dev/v2';
const REQUEST_TIMEOUT = 15000;
const CURRENCY_CODE = /^[A-Z]{3,5}$/;

export class FrankfurterError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FrankfurterError';
    this.code = code;
  }
}

function abortError() {
  const error = new Error('Consulta cancelada.');
  error.name = 'AbortError';
  return error;
}

async function request(path, signal) {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();

  if (signal?.aborted) throw abortError();
  signal?.addEventListener('abort', cancel);
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `A Frankfurter não conseguiu atender à consulta (HTTP ${response.status}). Tente novamente.`;

      if (response.status === 404) {
        message =
          path === '/currencies'
            ? 'Não foi possível carregar a lista de moedas (HTTP 404). Tente novamente.'
            : 'Não há taxa disponível para esse par de moedas. Escolha outro par.';
      }

      throw new FrankfurterError(message, 'http');
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new FrankfurterError(
        'A Frankfurter enviou uma resposta que não é um JSON válido. Tente novamente.',
        'json',
      );
    }

    if (controller.signal.aborted) throw abortError();
    return data;
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) {
      throw new FrankfurterError(
        'A consulta demorou mais que o esperado. Verifique sua conexão e tente novamente.',
        'timeout',
      );
    }
    if (error instanceof FrankfurterError) throw error;
    throw new FrankfurterError(
      'Não foi possível conectar à Frankfurter. Verifique sua conexão e tente novamente.',
      'network',
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}

function invalidResponse() {
  return new FrankfurterError(
    'A Frankfurter retornou dados incompletos ou inesperados. Tente novamente.',
    'schema',
  );
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function getCurrencies({ signal } = {}) {
  const data = await request('/currencies', signal);
  if (!Array.isArray(data) || data.length === 0) throw invalidResponse();

  const seen = new Set();
  return data
    .map((currency) => {
      if (
        !currency ||
        !CURRENCY_CODE.test(currency.iso_code) ||
        typeof currency.name !== 'string' ||
        !currency.name.trim() ||
        seen.has(currency.iso_code)
      ) {
        throw invalidResponse();
      }

      seen.add(currency.iso_code);
      return { code: currency.iso_code, name: currency.name.trim() };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getRate(base, quote, { signal } = {}) {
  if (!CURRENCY_CODE.test(base) || !CURRENCY_CODE.test(quote) || base === quote) {
    throw new FrankfurterError('Selecione duas moedas diferentes e válidas.', 'validation');
  }

  const data = await request(`/rate/${base}/${quote}`, signal);
  if (
    !data ||
    data.base !== base ||
    data.quote !== quote ||
    typeof data.rate !== 'number' ||
    !Number.isFinite(data.rate) ||
    data.rate <= 0 ||
    !validDate(data.date)
  ) {
    throw invalidResponse();
  }

  return {
    base: data.base,
    quote: data.quote,
    rate: data.rate,
    date: data.date,
  };
}
