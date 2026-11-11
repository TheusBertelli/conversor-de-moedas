import {
  formatDate,
  formatMoney,
  formatRate,
  parseAmount,
  validateConversion,
} from '../src/viewmodels/conversion';

const currencies = [{ code: 'USD' }, { code: 'BRL' }, { code: 'JPY' }];

describe('valores informados', () => {
  test.each([
    ['10,50', 10.5],
    ['10.50', 10.5],
    [' 100 ', 100],
    ['0,01', 0.01],
  ])('%s é interpretado como %s', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  test.each([
    '1.234,56',
    '1,234.56',
    '1,2,3',
    '1 000',
    '10 reais',
    '1e3',
    'Infinity',
    '.',
    '1.',
    '9007199254740992',
  ])('rejeita a entrada %s sem interpretação parcial', (text) => {
    expect(Number.isNaN(parseAmount(text))).toBe(true);
  });

  test.each(['', ' ', '0', '0,00', '-1', 'abc'])(
    'bloqueia valor vazio, não numérico ou não positivo: %s',
    (text) => {
      expect(validateConversion(text, 'USD', 'BRL', currencies).error).toBeTruthy();
    },
  );

  test('exige moedas selecionadas, disponíveis e diferentes', () => {
    for (const [base, quote] of [
      ['', 'BRL'],
      ['USD', ''],
      ['USD', 'USD'],
      ['XYZ', 'BRL'],
    ]) {
      expect(validateConversion('10', base, quote, currencies).error).toBeTruthy();
    }
    expect(validateConversion('10,50', 'USD', 'BRL', currencies)).toEqual({
      value: 10.5,
      error: '',
    });
  });
});

describe('apresentação', () => {
  test('usa convenções da moeda e sua quantidade de casas decimais', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(1234.5, 'BRL')).toMatch(/R\$\s1\.234,50/);
    expect(formatMoney(1234.5, 'JPY')).toMatch(/1,235/);
  });
  test('suporta moedas que não possuem código ISO 4217', () => {
    expect(formatMoney(12.5, 'USDT')).toBe('12,5 USDT');
  });
  test('mantém taxa pequena legível e formata a data sem deslocar o dia', () => {
    expect(formatRate(0.0000123456)).toBe('0,0000123456');
    expect(formatDate('2026-11-11')).toBe('11/11/2026');
    expect(formatDate(null)).toBe('—');
    expect(formatMoney(NaN, 'USD')).toBe('—');
  });
});
