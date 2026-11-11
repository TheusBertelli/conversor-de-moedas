# Requisitos e verificação

Este documento relaciona os requisitos do enunciado “Aplicativo de Conversão de Moedas com React Native, JavaScript e arquitetura MVVM” aos arquivos do projeto. A presença de uma implementação ou de um teste não significa, por si só, que ele foi executado em um aparelho.

## Entrega e arquitetura

| Requisito                                                 | Implementação ou instrução                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| React Native com JavaScript e Expo                        | `package.json`, `app.json`, `index.js` e `App.js`; Node 24 em `.nvmrc`.                                            |
| Estrutura simples em MVVM                                 | Pastas `src/models`, `src/viewmodels` e `src/views`.                                                               |
| Inicialização e integração da tela                        | `App.js`.                                                                                                          |
| Model independente da interface                           | `src/models/frankfurter.js`: requisições, HTTP, JSON e validação dos dados.                                        |
| View sem requisições ou cálculo de conversão              | `ConverterScreen.js`, `CurrencyPicker.js`, `ConversionResult.js` e `ConversionHistory.js`: renderização e eventos. |
| ViewModel com React Hooks                                 | `useConverterViewModel.js`: estados, efeitos, validação e coordenação.                                             |
| Regras e formatação separadas da tela                     | `src/viewmodels/conversion.js`.                                                                                    |
| Convenções de código                                      | ESLint e Prettier; `npm run format` aplica a formatação e `npm run format:check` verifica.                         |
| Cores compartilhadas da interface                         | `src/views/colors.js`.                                                                                             |
| Instruções de instalação, navegador e plataformas nativas | `README.md`.                                                                                                       |
| Código no GitHub                                          | Repositório `TheusBertelli/conversor-de-moedas`; commits e envio são verificados à parte.                          |
| Capturas de tela                                          | `docs/screenshots/conversao-mobile.png` e `conversao-desktop.png`; a legenda no README informa a origem dos dados. |

## Tela e fluxo de conversão

| Requisito                                                                        | Implementação                                                                                          | Verificação prevista                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Título, entrada de valor, seleção de origem e destino, botão e área de resultado | `ConverterScreen.js`                                                                                   | Navegação e conversão pela interface.                                      |
| Seleção simples, com nomes e códigos de moeda                                    | `CurrencyPicker.js`, com modal, busca e lista                                                          | Abrir cada seletor e escolher uma moeda.                                   |
| Lista de moedas recebida ao iniciar                                              | Efeito do ViewModel chama `getCurrencies`                                                              | Testes do Model e do ViewModel.                                            |
| Moedas iniciais válidas e seletores indisponíveis durante o carregamento         | ViewModel usa USD/BRL quando disponíveis e escolhe alternativas do catálogo; View desabilita seletores | Testes do ViewModel e inspeção da tela.                                    |
| Requisição após validação dos campos                                             | `convert` no ViewModel                                                                                 | Entradas inválidas não chamam `getRate`.                                   |
| Consulta na direção correta                                                      | `getRate(base, quote)`                                                                                 | Testes verificam URL e par retornado.                                      |
| Cálculo com a taxa recebida                                                      | `valor informado × rate` no ViewModel                                                                  | Teste de conversão e precisão.                                             |
| Resultado com valor original, origem, convertido e destino                       | `result` e `ConversionResult.js`                                                                       | Conferência visual e testes do ViewModel.                                  |
| Exibição da taxa e da data retornadas                                            | `ConversionResult.js` e formatadores                                                                   | Testes de dados e data sem mudança de fuso.                                |
| Formatação monetária sem reutilizar valor arredondado no cálculo                 | `formatMoney` apenas na apresentação                                                                   | Testes de formatação e cálculo.                                            |
| Layout adequado a celular, tablet e navegador                                    | `StyleSheet`, `SafeAreaView`, rolagem, adaptação por largura e teclado                                 | Capturas em larguras diferentes; validação nativa pendente de dispositivo. |
| Indicação de taxa de referência                                                  | Aviso abaixo do formulário                                                                             | Inspeção da tela.                                                          |
| Nenhuma taxa fixa em produção                                                    | Model consulta a Frankfurter para concluir cada conversão                                              | Revisão do código; integração real depende de acesso à API.                |

## Validação obrigatória

Os casos estão em `tests/conversion.test.js` e `tests/useConverterViewModel.test.js`.

| Entrada ou situação                                           | Comportamento esperado                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Campo vazio ou só espaços                                     | Pedir que o usuário digite um valor, sem consultar a taxa.                       |
| Texto, símbolos, notação científica ou separadores misturados | Explicar o formato aceito, sem consultar a taxa.                                 |
| Zero ou número negativo                                       | Informar que o valor precisa ser maior que zero.                                 |
| Decimal com vírgula ou ponto                                  | Interpretar ambos como separador decimal. Não são aceitos separadores de milhar. |
| Origem ou destino ausente                                     | Solicitar a seleção da moeda correspondente.                                     |
| Código fora da lista recebida                                 | Solicitar moedas disponíveis.                                                    |
| Origem e destino iguais                                       | Bloquear e solicitar moedas diferentes.                                          |
| Número fora do intervalo suportado                            | Bloquear uma entrada ou resultado que não possa ser calculado com segurança.     |

## API, carregamento e erros

O contrato utilizado foi conferido na fonte oficial da Frankfurter. A API pública não exige chave para esses endpoints.

| Requisito                                                    | Implementação e cobertura                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Moedas em JSON                                               | `GET https://api.frankfurter.dev/v2/currencies`; normaliza `iso_code` e `name`.                                                |
| Taxa, par e data em JSON                                     | `GET https://api.frankfurter.dev/v2/rate/{base}/{quote}`; valida `{date,base,quote,rate}`.                                     |
| Endpoint alternativo citado no enunciado                     | `/v2/rates?base=USD&quotes=BRL` é uma alternativa à consulta de par. O aplicativo usa `/rate/{base}/{quote}`.                  |
| Aguardar as respostas e verificar sucesso HTTP               | `async`/`await` e `response.ok` no Model.                                                                                      |
| Distinguir falha de rede, HTTP, JSON e resposta incompatível | `FrankfurterError`, coberto por `tests/frankfurter.test.js`.                                                                   |
| Resposta vazia ou taxa ausente/inválida                      | Validação de catálogo, taxa positiva e finita, par e data; testes do Model.                                                    |
| Erro quando um par não está disponível                       | Mensagem específica para HTTP 404; possibilidade de escolher outro par. O erro 404 do catálogo orienta a recarregar as moedas. |
| Tempo limite de consulta                                     | Cancelamento após 15 segundos, com mensagem e teste.                                                                           |
| Carregamento inicial e durante a conversão                   | Estados separados `loadingCurrencies` e `converting`, indicadores na View.                                                     |
| Impedir consultas simultâneas por cliques repetidos          | Botão desabilitado e controle por referência no ViewModel; teste de chamada duplicada.                                         |
| Encerrar carregamento também após erro                       | Blocos `finally`, testados no Model e no ViewModel.                                                                            |
| Nova tentativa                                               | Botão para recarregar catálogo e botão de conversão liberado depois de uma falha.                                              |
| Separar erro da API de erro de entrada                       | Estados `error` e `validationError`.                                                                                           |
| Não apresentar resultado antigo como atual                   | Editar campos ou iniciar outra conversão limpa `result`; histórico fica separado.                                              |
| Não deixar resposta antiga sobrescrever a nova               | Cancelamento e conferência da identidade da requisição antes de atualizar o estado.                                            |
| Cancelar ao sair da tela                                     | Limpeza do efeito e `AbortController`; testes do ViewModel.                                                                    |

## Desafios opcionais incluídos

| Funcionalidade            | Comportamento                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Histórico temporário      | Guarda as últimas 10 conversões da sessão e permite limpar; apresentação em `ConversionHistory.js`.                       |
| Inversão de moedas        | Troca origem e destino e limpa o resultado para uma nova consulta.                                                        |
| Formatação por localidade | Localidades mapeadas por moeda; padrão `pt-BR` nas demais e alternativa para códigos não aceitos por `Intl.NumberFormat`. |
| Última consulta           | Data de referência da taxa no resultado e em cada item do histórico.                                                      |
| Favoritos                 | Guarda pares durante a sessão, permite usar e remover o par atual.                                                        |
| Testes automatizados      | Testes do Model, das validações, dos formatadores e do fluxo do ViewModel.                                                |

## Conferência manual em dispositivo

Esta lista pode ser desmarcada para repetir a conferência. Ela não representa validações já executadas nesta máquina.

- [ ] Abrir em Android ou iOS com Expo compatível e verificar a inicialização.
- [ ] Carregar as moedas pela rede real.
- [ ] Converter um valor positivo e comparar valor, taxa e data com a resposta da API.
- [ ] Repetir com campo vazio, zero, negativo, texto e moedas iguais.
- [ ] Converter `10,50` e `10.50` e comparar os resultados.
- [ ] Inverter as moedas e fazer uma nova consulta.
- [ ] Confirmar que os indicadores aparecem e o botão não inicia consultas duplicadas.
- [ ] Interromper a conexão, conferir o erro e tentar novamente após restabelecê-la.
- [ ] Alterar campos durante uma consulta e verificar que o resultado antigo não reaparece.
- [ ] Salvar, selecionar e remover um favorito.
- [ ] Fazer mais de 10 conversões e limpar o histórico.
- [ ] Conferir teclado, rolagem, leitores de tela, rotação e tamanho de fonte no dispositivo.

Os testes automatizados usam respostas controladas. Acesso real à Frankfurter e execução em aparelho ou emulador devem ser registrados separadamente dos testes locais e das capturas do navegador.

## Verificação da revisão visual

- `npm run check` verifica a formatação, executa ESLint, roda os 78 testes de Model, ViewModel, validação e formatação e gera a versão web.
- `npm run test:e2e` executa 16 cenários no Chromium em larguras de celular e desktop, com respostas controladas da API; capturas no README têm a mesma origem.
- A revisão usa fundo branco, formulário centralizado, bordas cinza e ações azuis. O resultado fica junto do formulário, sem slogans ou etapas numeradas. As referências oficiais estão no README.
- O projeto inicial Expo foi aberto no Chromium e os bundles Hermes de Android e iOS foram gerados na primeira entrega. Isso não equivale à instalação ou execução do novo layout em um aparelho.
- A consulta real à Frankfurter foi tentada e bloqueada pela política de rede do ambiente (HTTPS CONNECT 403). `npm run test:api` permite repetir a consulta após liberar `api.frankfurter.dev`.
- Sem emulador Android, simulador iOS ou dispositivo conectado nesta máquina. A conferência nativa permanece na lista acima.
