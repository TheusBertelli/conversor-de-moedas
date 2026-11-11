import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrencies, getRate } from '../models/frankfurter';
import { validateConversion } from './conversion';

export default function useConverterViewModel() {
  const [amount, updateAmount] = useState('100');
  const [base, updateBase] = useState('USD');
  const [quote, updateQuote] = useState('BRL');
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const mounted = useRef(false);
  const currencyRequest = useRef(null);
  const conversionRequest = useRef(null);
  const sequence = useRef(0);

  const invalidateConversion = useCallback(() => {
    conversionRequest.current?.abort();
    conversionRequest.current = null;
    setConverting(false);
    setResult(null);
    setError('');
    setValidationError('');
  }, []);

  const setAmount = useCallback((value) => {
    invalidateConversion();
    updateAmount(value);
  }, [invalidateConversion]);

  const setBase = useCallback((value) => {
    invalidateConversion();
    updateBase(value);
  }, [invalidateConversion]);

  const setQuote = useCallback((value) => {
    invalidateConversion();
    updateQuote(value);
  }, [invalidateConversion]);

  const swapCurrencies = useCallback(() => {
    invalidateConversion();
    updateBase(quote);
    updateQuote(base);
  }, [base, quote, invalidateConversion]);

  const selectPair = useCallback((nextBase, nextQuote) => {
    invalidateConversion();
    updateBase(nextBase);
    updateQuote(nextQuote);
  }, [invalidateConversion]);

  const fetchCurrencies = useCallback((controller) => getCurrencies({ signal: controller.signal })
    .then((list) => {
      if (!mounted.current || currencyRequest.current !== controller) return;
      setCurrencies(list);
      const codes = list.map((currency) => currency.code);
      const initialBase = codes.includes('USD') ? 'USD' : codes[0];
      const initialQuote = codes.includes('BRL') && initialBase !== 'BRL'
        ? 'BRL' : codes.find((code) => code !== initialBase);
      updateBase(initialBase || '');
      updateQuote(initialQuote || '');
    }).catch((cause) => {
      if (!mounted.current || currencyRequest.current !== controller || controller.signal.aborted) return;
      setError(cause.message || 'Não foi possível carregar as moedas. Tente novamente.');
    }).finally(() => {
      if (mounted.current && currencyRequest.current === controller) {
        currencyRequest.current = null;
        setLoadingCurrencies(false);
      }
    }), []);

  const reloadCurrencies = useCallback(() => {
    currencyRequest.current?.abort();
    const controller = new AbortController();
    currencyRequest.current = controller;
    invalidateConversion();
    setLoadingCurrencies(true);
    setCurrencies([]);
    return fetchCurrencies(controller);
  }, [fetchCurrencies, invalidateConversion]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    currencyRequest.current = controller;
    fetchCurrencies(controller);
    return () => {
      mounted.current = false;
      currencyRequest.current?.abort();
      conversionRequest.current?.abort();
    };
  }, [fetchCurrencies]);

  const convert = useCallback(async () => {
    if (conversionRequest.current || loadingCurrencies) return;
    setResult(null);
    setError('');
    setValidationError('');
    const validation = validateConversion(amount, base, quote, currencies);
    if (validation.error) {
      setValidationError(validation.error);
      return;
    }
    const controller = new AbortController();
    conversionRequest.current = controller;
    setConverting(true);
    try {
      const rate = await getRate(base, quote, { signal: controller.signal });
      if (!mounted.current || conversionRequest.current !== controller || controller.signal.aborted) return;
      const converted = validation.value * rate.rate;
      if (!Number.isFinite(converted) || converted <= 0) {
        throw new Error('O resultado está fora do intervalo suportado. Tente um valor menor.');
      }
      const conversion = {
        id: String(++sequence.current), amount: validation.value, base, quote,
        converted, rate: rate.rate, date: rate.date,
      };
      setResult(conversion);
      setHistory((previous) => [conversion, ...previous].slice(0, 10));
    } catch (cause) {
      if (!mounted.current || conversionRequest.current !== controller || controller.signal.aborted) return;
      setError(cause.message || 'Não foi possível consultar a taxa. Tente novamente.');
    } finally {
      if (mounted.current && conversionRequest.current === controller) {
        conversionRequest.current = null;
        setConverting(false);
      }
    }
  }, [amount, base, quote, currencies, loadingCurrencies]);

  const toggleFavorite = useCallback(() => {
    if (!base || !quote || base === quote || !currencies.some((item) => item.code === base)
      || !currencies.some((item) => item.code === quote)) return;
    setFavorites((previous) => previous.some((item) => item.base === base && item.quote === quote)
      ? previous.filter((item) => item.base !== base || item.quote !== quote)
      : [...previous, { base, quote }]);
  }, [base, quote, currencies]);

  const clearHistory = useCallback(() => setHistory([]), []);
  const isFavorite = favorites.some((item) => item.base === base && item.quote === quote);

  return {
    amount, base, quote, currencies, loadingCurrencies, converting, error, validationError,
    result, history, favorites, isFavorite, setAmount, setBase, setQuote, swapCurrencies,
    selectPair, convert, reloadCurrencies, toggleFavorite, clearHistory,
  };
}
