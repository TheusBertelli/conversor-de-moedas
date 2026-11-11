# Ambiente na nuvem

Use o checkout existente em `/workspace/conversor-de-moedas`. Cada tarefa da nuvem já é isolada; não crie um worktree sem uma solicitação específica. Confira `git status` antes de trabalhar e use Node 24.

## Instalação

```bash
cd /workspace/conversor-de-moedas
bash scripts/setup-cloud.sh
```

O script instala exatamente o lockfile e executa lint, testes e exportação web. Os caches ficam em `/tmp`, pois o diretório pessoal desta máquina não é gravável. Não é necessário fornecer credenciais para a Frankfurter.

## Inicialização

Processos não sobrevivem a um snapshot. Reinicie o Expo em cada sessão em que precisar da aplicação:

```bash
cd /workspace/conversor-de-moedas
export npm_config_cache=/tmp/npm-cache
export EXPO_NO_TELEMETRY=1
export __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/expo-home
npm run web -- --port 8081
```

Aguarde o Metro iniciar e verifique a tela com o navegador de testes. Os comandos de Android e iOS estão no README; esta instância não tem emulador ou dispositivo conectado.

## Acesso às cotações

A política de rede precisa permitir `api.frankfurter.dev`. Para consultar a documentação, permita também `frankfurter.dev`. Esses domínios devem ser adicionados em **Configurações do ambiente → Rede / Acesso à internet**, preservando as permissões existentes.

Depois de salvar a configuração, verifique uma conexão nova:

```bash
npm run test:api
```

Não use dados fixos para contornar um bloqueio. Os testes automatizados usam respostas controladas e continuam disponíveis independentemente da API. As capturas do README são identificadas dessa forma.

## Testes da interface nesta máquina

```bash
npm run build:web
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

O Playwright inicia seu servidor estático e verifica os fluxos em duas larguras. Caso já exista um servidor de testes nessa porta, ele pode ser reutilizado em execução local. Em uma máquina sem Chromium instalado, siga o comando de instalação do Playwright no README.

## Persistência da configuração

A instalação e os testes foram executados nesta instância. A ferramenta da plataforma não conseguiu confirmar a leitura ou a gravação do rascunho reutilizável (`INVALID_ARGUMENT`). Assim, não foi possível confirmar a gravação dos campos `install_script` e `start_skill`, nem a liberação de rede ou a publicação de um snapshot. Este documento e o script preservam as instruções para configurar o ambiente pelo painel quando essa operação estiver disponível.
