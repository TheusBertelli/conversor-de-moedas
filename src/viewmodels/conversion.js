const currencyLocales = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CHF: 'de-CH',
  ARS: 'es-AR',
  MXN: 'es-MX',
  CLP: 'es-CL',
  INR: 'en-IN',
  KRW: 'ko-KR',
  ZAR: 'en-ZA',
};

// Um único ponto ou vírgula representa a parte decimal. Milhares não são aceitos.
export function parseAmount(text) {
  const normalized = String(text).trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(normalized)) return NaN;
  const value = Number(normalized.replace(',', '.'));
  return Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER ? value : NaN;
}

export function validateConversion(amount, base, quote, currencies) {
  if (!String(amount).trim()) return { error: 'Digite o valor que deseja converter.' };
  const value = parseAmount(amount);
  if (!Number.isFinite(value)) {
    return { error: 'Digite um número válido, sem separador de milhares. Exemplo: 10,50.' };
  }
  if (value <= 0) return { error: 'O valor precisa ser maior que zero.' };
  if (!base) return { error: 'Escolha a moeda de origem.' };
  if (!quote) return { error: 'Escolha a moeda de destino.' };
  if (
    !currencies.some((currency) => currency.code === base) ||
    !currencies.some((currency) => currency.code === quote)
  ) {
    return { error: 'Escolha duas moedas disponíveis na lista.' };
  }
  if (base === quote) return { error: 'Escolha moedas diferentes para fazer a conversão.' };
  return { value, error: '' };
}

export function formatMoney(value, currency) {
  if (!Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(currencyLocales[currency] || 'pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    // A API pode listar códigos como USDT, que não são aceitos por Intl.currency.
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 }).format(value)} ${currency}`;
  }
}

export function formatRate(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 10 }).format(value);
}

export function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
