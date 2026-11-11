// Verificação de integração: sem mocks, cache ou taxas substitutas.
import { getCurrencies, getRate } from '../src/models/frankfurter.js';

try {
  const currencies = await getCurrencies();
  if (!['USD', 'BRL'].every((code) => currencies.some((item) => item.code === code))) {
    throw new Error('O catálogo não contém USD e BRL.');
  }
  const rate = await getRate('USD', 'BRL');
  const converted = 10.5 * rate.rate;
  console.log(`${currencies.length} moedas disponíveis.`);
  console.log(`10,50 USD = ${converted} BRL; taxa ${rate.rate}; referência ${rate.date}.`);
} catch (error) {
  console.error(`Consulta real não concluída: ${error.message}`);
  process.exitCode = 1;
}
