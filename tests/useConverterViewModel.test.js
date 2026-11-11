import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getCurrencies, getRate } from '../src/models/frankfurter';
import useConverterViewModel from '../src/viewmodels/useConverterViewModel';

jest.mock('../src/models/frankfurter', () => ({ getCurrencies: jest.fn(), getRate: jest.fn() }));

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'EUR', name: 'Euro' },
];
const rate = { base: 'USD', quote: 'BRL', rate: 5.5, date: '2026-11-10' };
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

async function ready() {
  const hook = await renderHook(() => useConverterViewModel());
  await waitFor(() => expect(hook.result.current.loadingCurrencies).toBe(false));
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  getCurrencies.mockResolvedValue(currencies);
  getRate.mockResolvedValue(rate);
});

test('carrega as moedas ao abrir e define seleções válidas', async () => {
  const pending = deferred();
  getCurrencies.mockReturnValueOnce(pending.promise);
  const { result } = await renderHook(() => useConverterViewModel());
  expect(result.current.loadingCurrencies).toBe(true);
  await act(async () => pending.resolve(currencies));
  expect(result.current.currencies).toEqual(currencies);
  expect(result.current.base).toBe('USD');
  expect(result.current.quote).toBe('BRL');
  expect(result.current.loadingCurrencies).toBe(false);
});

test('seleciona moedas disponíveis quando USD e BRL não estão na resposta', async () => {
  getCurrencies.mockResolvedValueOnce([{ code: 'EUR' }, { code: 'JPY' }]);
  const { result } = await ready();
  expect(result.current.base).toBe('EUR');
  expect(result.current.quote).toBe('JPY');
});

test('falha ao carregar moedas e permite tentar novamente', async () => {
  getCurrencies.mockRejectedValueOnce(new Error('Sem conexão.'));
  const { result } = await ready();
  expect(result.current.error).toBe('Sem conexão.');
  expect(result.current.currencies).toEqual([]);
  await act(async () => result.current.reloadCurrencies());
  expect(result.current.error).toBe('');
  expect(result.current.currencies).toHaveLength(3);
});

test.each(['', '0', '-10', 'abc', '1.000,50'])('não consulta a API para valor inválido %s', async (value) => {
  const { result } = await ready();
  await act(() => result.current.setAmount(value));
  await act(async () => result.current.convert());
  expect(getRate).not.toHaveBeenCalled();
  expect(result.current.validationError).toBeTruthy();
  expect(result.current.converting).toBe(false);
});

test('não consulta a API para moedas iguais ou não disponíveis', async () => {
  const { result } = await ready();
  await act(() => result.current.setQuote('USD'));
  await act(async () => result.current.convert());
  expect(result.current.validationError).toMatch(/diferentes/);
  await act(() => result.current.setQuote('XYZ'));
  await act(async () => result.current.convert());
  expect(result.current.validationError).toMatch(/disponíveis/);
  expect(getRate).not.toHaveBeenCalled();
});

test('converte decimal com a taxa recebida, sem arredondar o valor calculado', async () => {
  getRate.mockResolvedValueOnce({ ...rate, rate: 5.123456 });
  const { result } = await ready();
  await act(() => result.current.setAmount('10,50'));
  await act(async () => result.current.convert());
  expect(getRate).toHaveBeenCalledWith('USD', 'BRL', expect.objectContaining({ signal: expect.anything() }));
  expect(result.current.result).toMatchObject({
    amount: 10.5, base: 'USD', quote: 'BRL', converted: 10.5 * 5.123456,
    rate: 5.123456, date: '2026-11-10',
  });
  expect(result.current.history).toEqual([result.current.result]);
});

test('expõe carregamento, bloqueia cliques simultâneos e encerra ao concluir', async () => {
  const pending = deferred();
  getRate.mockReturnValueOnce(pending.promise);
  const { result } = await ready();
  let request;
  await act(() => { request = result.current.convert(); result.current.convert(); });
  expect(result.current.converting).toBe(true);
  expect(getRate).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve(rate); await request; });
  expect(result.current.converting).toBe(false);
});

test('limpa resultado anterior em falha, preserva histórico e permite repetir', async () => {
  const { result } = await ready();
  await act(async () => result.current.convert());
  getRate.mockRejectedValueOnce(new Error('Falha na conexão.'));
  await act(async () => result.current.convert());
  expect(result.current.result).toBeNull();
  expect(result.current.history).toHaveLength(1);
  expect(result.current.error).toBe('Falha na conexão.');
  expect(result.current.validationError).toBe('');
  expect(result.current.converting).toBe(false);
  await act(async () => result.current.convert());
  expect(result.current.error).toBe('');
  expect(result.current.result.converted).toBe(550);
});

test('descarta resposta antiga depois de alterar campos e concluir outra consulta', async () => {
  const old = deferred();
  const recent = deferred();
  getRate.mockReturnValueOnce(old.promise).mockReturnValueOnce(recent.promise);
  const { result } = await ready();
  let oldRequest;
  let recentRequest;
  await act(() => { oldRequest = result.current.convert(); });
  const oldSignal = getRate.mock.calls[0][2].signal;
  await act(() => result.current.setAmount('20'));
  expect(oldSignal.aborted).toBe(true);
  expect(result.current.converting).toBe(false);
  await act(() => { recentRequest = result.current.convert(); });
  await act(async () => { recent.resolve(rate); await recentRequest; });
  await act(async () => { old.resolve({ ...rate, rate: 99 }); await oldRequest; });
  expect(result.current.result.amount).toBe(20);
  expect(result.current.result.converted).toBe(110);
  expect(result.current.history).toHaveLength(1);
});

test('alterações dos seletores limpam o resultado, e inverter atualiza o par', async () => {
  const { result } = await ready();
  await act(async () => result.current.convert());
  await act(() => result.current.swapCurrencies());
  expect(result.current.result).toBeNull();
  expect(result.current.base).toBe('BRL');
  expect(result.current.quote).toBe('USD');
  await act(() => result.current.selectPair('EUR', 'BRL'));
  expect(result.current.base).toBe('EUR');
  expect(result.current.quote).toBe('BRL');
});

test('favoritos podem ser adicionados, selecionados e removidos durante a sessão', async () => {
  const { result } = await ready();
  await act(() => result.current.toggleFavorite());
  expect(result.current.isFavorite).toBe(true);
  expect(result.current.favorites).toEqual([{ base: 'USD', quote: 'BRL' }]);
  await act(() => result.current.swapCurrencies());
  expect(result.current.isFavorite).toBe(false);
  await act(() => result.current.selectPair('USD', 'BRL'));
  await act(() => result.current.toggleFavorite());
  expect(result.current.favorites).toEqual([]);
});

test('limita histórico às dez últimas conversões e permite limpar', async () => {
  const { result } = await ready();
  for (let index = 0; index < 12; index += 1) {
    await act(() => result.current.setAmount(String(index + 1)));
    await act(async () => result.current.convert());
  }
  expect(result.current.history).toHaveLength(10);
  expect(result.current.history[0].amount).toBe(12);
  expect(result.current.history[9].amount).toBe(3);
  await act(() => result.current.clearHistory());
  expect(result.current.history).toEqual([]);
});

test('aborta a consulta quando a tela é desmontada', async () => {
  const pending = deferred();
  getRate.mockReturnValueOnce(pending.promise);
  const { result, unmount } = await ready();
  let request;
  await act(() => { request = result.current.convert(); });
  const signal = getRate.mock.calls[0][2].signal;
  await unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => { pending.resolve(rate); await request; });
});

test('não inicia conversão enquanto a lista de moedas está carregando', async () => {
  const pending = deferred();
  getCurrencies.mockReturnValueOnce(pending.promise);
  const { result } = await renderHook(() => useConverterViewModel());
  await act(async () => result.current.convert());
  expect(getRate).not.toHaveBeenCalled();
  await act(async () => pending.resolve(currencies));
});

test('uma resposta antiga da lista não substitui a tentativa mais recente', async () => {
  const old = deferred();
  getCurrencies.mockReturnValueOnce(old.promise);
  const { result } = await renderHook(() => useConverterViewModel());
  const previousSignal = getCurrencies.mock.calls[0][0].signal;
  await act(async () => result.current.reloadCurrencies());
  expect(previousSignal.aborted).toBe(true);
  await act(async () => old.resolve([{ code: 'JPY', name: 'Yen' }]));
  expect(result.current.currencies).toEqual(currencies);
  expect(result.current.loadingCurrencies).toBe(false);
});

test('falha em vez de apresentar resultado numérico infinito', async () => {
  getRate.mockResolvedValueOnce({ ...rate, rate: Number.MAX_VALUE });
  const { result } = await ready();
  await act(async () => result.current.convert());
  expect(result.current.error).toMatch(/fora do intervalo/);
  expect(result.current.result).toBeNull();
  expect(result.current.history).toEqual([]);
  expect(result.current.converting).toBe(false);
});
