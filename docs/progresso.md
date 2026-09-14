# PAUSA — progresso do desenvolvimento

Diário para retomar o trabalho sem depender de memória. Atualize a cada sessão:
mova o que foi feito para "Histórico" e revise "Próximos passos".

**Última atualização:** 2026-09-13
**Figma:** [APP — TCC](https://www.figma.com/design/4ZvYZeKHrKGtUlSEEzedEp/APP---TCC)
**Estado do git:** tudo abaixo está **sem commit**.
**Verificação:** `npx tsc --noEmit` passa, `npx expo lint` não acusa nada no
código novo e `npx expo export` gera os bundles de iOS e web (as 6 rotas de
`/admin` aparecem na saída). As Security Rules foram testadas contra o projeto
real (ver abaixo). **Nenhuma tela foi conferida visualmente ainda.**

## Firebase (projeto `pausa-cc7f3`)

Configurado em 2026-09-13. Credenciais no `.env` (não versionado); o
`.env.example` continua sendo só modelo.

| Item | Estado |
| --- | --- |
| Authentication · e-mail/senha | ligado |
| Firestore | criado em `southamerica-east1` (São Paulo) |
| Security Rules | publicadas a partir de `firestore.rules` |

O banco foi criado uma primeira vez pelo `deploy`, que o pôs em `nam5` (EUA).
Como estava vazio, foi apagado e recriado em São Paulo — latência menor para os
usuários de teste conta para a proposição P2 (usabilidade percebida). Reusar o
id `(default)` exige esperar ~5 min de carência depois de apagar.

### Preferências do onboarding

Nível e interesses vão para **os dois lados**: `AsyncStorage` (funciona offline e
para visitante) e `usuarios/{uid}.preferencias` no Firestore quando há conta.
Falha de rede não trava o onboarding — fica no aparelho e sobe na entrada
seguinte.

Sem isso, a promessa do cadastro ("continue de onde parou em outros aparelhos")
não se cumpriria, e não haveria como cruzar perfil com desempenho na avaliação
de **P1**.

### Regras verificadas contra o backend real

Feito com uma conta de teste (criada e removida em seguida), via REST:

| Tentativa | Esperado | Resultado |
| --- | --- | --- |
| Cadastro nascer `administrador` | negado | 403 |
| Cadastro nascer `editor` | negado | 403 |
| Cadastro nascer `usuario` | permitido | 200 |
| `usuario` criar conteúdo | negado | 403 |
| `usuario` se autopromover | negado | 403 |
| `usuario` ler a lista de usuários | negado | 403 |
| `usuario` ler o próprio perfil | permitido | 200 |
| `usuario` gravar as próprias preferências | permitido | 200 |
| `usuario` subir o papel junto com as preferências | negado | 403 |

Script em `scratchpad/teste-regras.sh` (fora do repositório). Vale repetir depois
de qualquer mudança em `firestore.rules`.

---

## Fluxo de entrada do app

Fonte: **LEIA PRIMEIRO / Regras de acesso / App e Admin** (`618:18`), o
contrato de navegação do Figma. Os itens citados abaixo são os dele.

```
Splash (sempre, automática)
        │
        ├─ primeiro acesso ──> BOAS-VINDAS
        │                        ├── Criar conta ──> Cadastro ──> Verificar e-mail ─┐
        │                        └── Entrar ──────> Login ───────────────────────────┤
        │                                                                            │
        │                                            onboarding concluído? ──────────┤
        │                                              não ──> Onboarding ──> Home   │
        │                                              sim ─────────────────> Home <─┘
        │
        └─ depois ──> Home   (sessão válida)   |   sem sessão ──> Login
```

**Não existe entrada sem cadastro** (item 06). O modo visitante foi removido em
2026-09-13 — ver "Decisões tomadas".

Quem decide é `src/app/_layout.tsx`. Nada conta aberturas: tudo sai do estado
salvo (item 02).

| Situação | Tela |
| --- | --- |
| Sem sessão | `(auth)` → começa em **Boas-vindas** |
| Cadastro feito, e-mail não confirmado | `(auth)` → `verificar-email` |
| Onboarding pendente ou interrompido | `onboarding`, **retomando a etapa salva** |
| Sessão + onboarding concluído | `(tabs)` → Home |
| `/admin` | sempre montado; quem entra é decidido lá dentro |

A splash não é rota: é uma camada por cima (`SplashOverlay`) enquanto a rota
certa já carrega por baixo. Vale **inclusive para o painel administrativo**.

### Acesso ao painel (item 04)

`src/app/admin/_layout.tsx` dá **quatro** respostas diferentes, não duas:

| Estado | Tela |
| --- | --- |
| Sem sessão | "Entre para continuar" → Login |
| Perfil ainda carregando | "Conferindo permissões…" |
| Falha ao ler o perfil | "Não foi possível validar" — **nunca** "não autorizado" (item 05) |
| Papel `usuario` | **Acesso não autorizado** (`626:31`) |
| Papel `editor` ou `administrador` | o painel |

Separar as duas do meio é o que impede uma queda de rede de expulsar um
administrador do painel.

"Entrar com outra conta" encerra a sessão e vai para `/entrar?destino=/admin` —
depois de entrar, a pessoa volta ao painel, não à Home (item 06). O parâmetro
`destino` aceita apenas uma **lista fechada** de caminhos; validar por prefixo
transformaria o login num redirecionador aberto.

### Estado salvo no aparelho (AsyncStorage)

O item 03 do contrato exige **cache separado por usuário**, então as chaves
levam o UID: duas pessoas no mesmo aparelho não compartilham onboarding.

| Chave | Conteúdo |
| --- | --- |
| `pausa:{uid}:onboarding-concluido` | `"true"` ao terminar o onboarding |
| `pausa:{uid}:preferencias` | `{ nivel, interesses[], atualizadoEm }` |
| `pausa:{uid}:onboarding-parcial` | etapa e escolhas de um onboarding interrompido |
| `pausa:verificacao-pendente` | UID cuja verificação de e-mail ficou pendente |
| `pausa:cache-adotado-por` | UID que herdou o cache da era do visitante |

As chaves globais antigas (`pausa:onboarding-concluido`, `pausa:preferencias`,
`pausa:onboarding-parcial`, `pausa:visitante`) são **copiadas para a primeira
conta que abrir o app e nunca apagadas** — o item 03 diz que "a remoção do modo
visitante não autoriza apagar dados locais existentes".

Para ver o primeiro acesso de novo, apague os dados do app (desinstale o Expo Go
do simulador).

---

## Decisões tomadas

- **A splash dura 5 s, e isso prevalece sobre o contrato.** O item 01 do
  `618:18` diz "sem atraso artificial", mas os 5 s existem para dar tempo de ler
  a citação — decisão do autor em 2026-09-12, reafirmada em 2026-09-13. Vale
  corrigir o texto do contrato no Figma.
- **A splash abre toda sessão, sem exceção** — inclusive o painel admin. Chegou
  a ficar de fora do `/admin` por o contrato dizer que o painel é separado do
  app público; revertido a pedido.
- **O modo visitante foi removido** (2026-09-13, decisão do autor no Figma). O
  contrato `618:18` passou a dizer "o acesso ao app exige conta autenticada" e
  "não existe entrada sem cadastro"; "Continuar sem conta" saiu do Cadastro e do
  Login. Isso reverte a decisão de 2026-09-12 de cadastro opcional.

  **Três consequências registradas na hora da decisão**, para não se perderem:
  a seção 20 do `IDEIA.md` pede coleta mínima; exigir conta antes de mostrar o
  app tende a derrubar a nota de **SUS**, que é a proposição **P2**; e a regra
  **5.1.1(v) da App Store** proíbe exigir cadastro quando o app funciona sem
  ele — esta última é motivo de rejeição na revisão da Apple, não preferência.
- **Não haverá auth anônimo.** Chegou a ser cogitado para guardar dados de quem
  não tinha conta; com o cadastro obrigatório, perdeu a razão de existir.
- **Splash aparece em toda abertura**, dura **5 s** (a spec do Figma dizia
  2,2 s, curto demais para ler a citação) e **não tem botão** — tocar em
  qualquer lugar adianta a saída. Com "reduzir movimento", sai sem animação.
- **Espaçamento padrão: 24 px entre seções.** Dentro de um grupo, 16 px; entre
  rótulo e campo, 8 px.
- **Onboarding usa só as telas visíveis no Figma** (`55:6` e `55:50`). As
  ocultas ("Filosofia além das frases", "No seu ritmo") ficaram de fora.
- **Nível do onboarding é escolha única**: visual de checkbox (como no Figma),
  mas anunciado como radio para leitor de tela.
- **Nenhuma opção vem pré-marcada** e os botões funcionam sem seleção.
- **Não existe seletor de papel no cadastro.** O contrato do handoff admin
  (`600:75`) proíbe confiar em campo de perfil editável pelo cliente — a caixa
  "sou administrador" seria exatamente isso. Todo cadastro nasce `usuario`; o
  primeiro administrador é criado à mão no Console do Firebase.
- **O painel mora em `src/app/admin/`, não em `(admin)/`.** Um grupo de rotas
  colidiria com `(tabs)/index.tsx` no caminho `/`.
- **O painel não é travado por plataforma.** O layout é desktop (1200 px), mas
  roda em qualquer alvo para poder ser conferido no simulador.
- **A busca e os seletores funcionam de verdade.** O handoff dizia que não
  seriam simulados nesta entrega; como o Firestore entrou junto, foram feitos.

---

## O que existe hoje

### Telas

| Tela | Arquivo | Nó no Figma |
| --- | --- | --- |
| Splash (Epicteto) | `src/components/splash-overlay.tsx` | `1:2`, `99:4` |
| Cadastro | `src/app/(auth)/criar-conta.tsx` | `576:12` |
| Entrar | `src/app/(auth)/entrar.tsx` | `612:12` |
| Recuperar senha (2 estados) | `src/app/(auth)/recuperar-senha.tsx` | `613:14`, `613:43` |
| Boas-vindas | `src/app/(auth)/index.tsx` | `621:18` |
| Verificar e-mail | `src/app/(auth)/verificar-email.tsx` | `626:18` |
| Acesso não autorizado | dentro de `src/app/admin/_layout.tsx` | `626:31` |
| Onboarding 01 e 02 | `src/app/onboarding.tsx` | `55:6`, `55:50` |
| Abas (Hoje, Explorar, Atividades, Biblioteca) | `src/app/(tabs)/` | — |
| Admin · Conteúdos | `src/app/admin/index.tsx` | `595:3` |
| Admin · Editor | `src/app/admin/conteudo/[id].tsx` | `595:4` |
| Admin · Revisar e publicar | `src/app/admin/revisar/[id].tsx` | `595:5` |
| Admin · Conhecimento do dia | `src/app/admin/conhecimento-do-dia.tsx` | `595:7` |
| Admin · Usuários e permissões | `src/app/admin/usuarios/index.tsx` | `595:6` |
| Admin · Alterar permissão | `src/app/admin/usuarios/[uid].tsx` | `595:8` |

### Componentes criados nesta fase

- `src/components/ui/text-field.tsx` — campo com rótulo e erro
- `src/components/ui/checkbox.tsx` — checkbox 16 px com ícone do Figma
- `src/components/onboarding/opcoes.tsx` — `OpcaoNivel` e `OpcaoInteresse`
- `src/components/onboarding/progresso.tsx` — pontinhos de progresso
- `src/components/cards/retrato-filosofo.tsx` — card com personagem saindo do topo
- `Button` ganhou `size="medium"` (48 px) e `shape="rounded"` (raio 8)

### Painel administrativo (2026-09-13)

Desenho: seção `595:2`, contrato de handoff `600:71`. Guia de instalação e
limites em [`docs/painel-admin.md`](painel-admin.md).

| Arquivo | Papel |
| --- | --- |
| `src/lib/perfil.ts` | Papéis, perfil no Firestore, quem pode o quê |
| `src/lib/admin/tipos.ts` | Conteúdo, níveis, aplicação, validação de publicação |
| `src/lib/admin/acervo.ts` | Filósofos e temas (constantes por ora) |
| `src/lib/admin/repositorio.ts` | Firestore: catálogo, publicação, agenda, papéis, auditoria |
| `src/components/admin/` | Casca de página, campos, estados, navegação |
| `firestore.rules` | Autorização de verdade — o painel só esconde botões |

Regras que o código faz valer, do contrato:

- rascunho salva incompleto, publicar exige os quatro níveis (revalidado dentro
  da transação, não só no formulário);
- a aplicação cotidiana é um registro só, exibido em dois caminhos;
- a agenda guarda referência ao conteúdo, nunca cópia do texto;
- conflito de edição por número de versão — recusa gravar sobre versão mais nova;
- data ocupada na agenda vira pergunta, não erro;
- ninguém altera o próprio papel; o último administrador não perde o acesso;
- toda alteração de papel vai para `auditoria` com ator, alvo, anterior/novo e data.

O cadastro deixou de ser só validação: `criarConta` cria a conta no Firebase
Authentication, grava `usuarios/{uid}` com papel `usuario` e dispara a
verificação de e-mail. Falha de rede preserva nome e e-mail para nova tentativa
e nunca persiste a senha.

### Tokens e tipografia adicionados

- Cores: `wine`, `error`, `selected`, `portrait` (valores do modo escuro foram
  escolhidos no código; o Figma só tem tema claro)
- Tipografia: `supportSemibold`, `onboardingKicker`, `onboardingTitle`,
  `onboardingTitleCompact`, `optionTitle`, `optionLabel`, `portraitName`,
  `portraitMeta`
- Alinhados ao Figma: `headingLarge` 28/32, `bodyMedium` 16/22,
  `labelButton` com espaçamento 0,25
- Fonte `PixelifySans_500Medium` carregada em `src/app/_layout.tsx`

### Imagens

- `assets/images/epicteto/` — três quadros reexportados da seção `584:11`,
  alinhados (ver `docs/splash-sequencia-epicteto.md`)
- `assets/images/retratos/seneca-abertura.png` e `nietzsche-leitura.png`
- `assets/images/icones/check.svg`

---

## Próximos passos

### No código

- [ ] Fazer commit do trabalho destas duas fases
- [ ] Criar a primeira conta pelo app e promovê-la a `administrador` no Console
      (Firestore → `usuarios/{uid}` → campo `papel`)
- [ ] Rodar no simulador e no navegador e comparar tudo com o Figma
- [ ] **Sair da conta** não existe em lugar nenhum do app. Com o cadastro
      obrigatório, é a única forma de trocar de usuário — hoje só a tela de
      verificação de e-mail tem "Usar outra conta". O lugar é Perfil ou
      Preferências (`11. Protótipo`, frames 19 e 20)
- [ ] Usar as preferências para recomendar conteúdo: nível e interesses já estão
      no perfil, mas nada os lê ainda
- [ ] Após entrar, voltar ao **destino solicitado** — o handoff `577:18` pede
      "retomar destino solicitado ou Home"; hoje a rota é sempre decidida pela
      guarda (Home ou onboarding)
- [ ] Tela de verificação de e-mail (o cadastro já dispara o envio)
- [ ] Cloud Function para a trava do último administrador — hoje a contagem roda
      no cliente e tem janela de corrida
- [ ] Ligar o app público aos conteúdos publicados (hoje as abas ainda não leem
      o Firestore)
- [ ] Player do YouTube: o handoff `78:3` tem os quatro estados desenhados e
      nada foi implementado

### No Figma

- [ ] "Estudioso" tem a mesma descrição de "Leigo" ("Não possuo conhecimento prévio")
- [ ] Texto do onboarding 01 repete "cotidiano"
- [ ] Onboarding mostra 4 pontinhos de progresso, mas só há 2 telas visíveis
- [ ] Nível usa checkbox, mas a descrição do componente pede Radio para escolha única
- [ ] Botão → pontinhos ainda fora do padrão (56 px na tela 01, 40 px na 02)
- [ ] Remover o botão das telas da splash (`99:4`)
- [ ] Atualizar a spec de movimento da splash de 2,2 s para 5 s
- [ ] `618:18`, item 01: trocar "sem atraso artificial" por "5 s, com toque
      para adiantar" — a splash tem duração proposital
- [ ] Apagar o retângulo "Correção / Artefato alfa" (`108:5`)
- [ ] O painel usa a barra de navegação administrativa em todas as telas de
      primeiro nível; o Figma mostra "← CONTEÚDOS" em `595:6` e `595:7`, o que
      deixa a pessoa sem como trocar de aba
- [ ] `595:3` e `595:6` montam as tabelas como um texto só alinhado por espaços;
      no código viraram colunas de verdade, porque espaços não sobrevivem à
      fonte variável
- [ ] Os textos "Dados abaixo são exemplos" e "Exemplos editoriais" já não valem:
      os dados vêm do Firestore

---

## Como rodar

1. No `.env`, deixe `EXPO_PUBLIC_AUTH_BYPASS=false` para ver o fluxo completo
   (com `true`, o cadastro é pulado).
2. `cd pausa && npx expo start -c`
3. Aperte `i` para abrir no simulador do iOS; `r` recarrega o app.
4. Antes de trocar os quadros do Epicteto: `python3 scripts/verificar-sequencia.py`.

Para o painel: `npx expo start --web` e abra `http://localhost:8081/admin`.
Sem Firebase configurado, as telas abrem mas mostram "Firebase não configurado"
no lugar das listas — e só aparecem com `EXPO_PUBLIC_AUTH_BYPASS=true`, que
concede papel de administrador em desenvolvimento. Instalação de verdade em
[`docs/painel-admin.md`](painel-admin.md).

---

## Uso de IA (para a seção 21 do TCC)

Sessão de 2026-09-12 com Claude Code:

- O autor definiu o fluxo (splash sempre, cadastro opcional, onboarding no
  primeiro acesso), desenhou todas as telas no Figma e ajustou os espaçamentos.
- A IA recomendou tornar o cadastro opcional, implementou as telas a partir do
  Figma, reexportou e verificou os quadros do Epicteto e apontou inconsistências
  de texto e componente no Figma.

---

### Sessão de 2026-09-13 com Claude Code

- O autor desenhou as seis telas do painel no Figma, escreveu o contrato de
  handoff (`600:71`–`600:76`) e decidiu que o administrador é declarado
  diretamente pelo Console do Firebase.
- A IA leu o contrato, apontou que um seletor de papel no cadastro violaria a
  própria regra escrita ali, implementou as telas, o modelo de dados, o acesso
  ao Firestore e as Security Rules, e documentou o limite conhecido da trava do
  último administrador.

---

## Histórico

### 2026-09-13

- **Modo visitante removido**: "Continuar sem conta" saiu de todas as telas, o
  cache local passou a ser separado por UID e o cache antigo é herdado sem ser
  apagado
- Boas-vindas (`621:18`), Verificar e-mail (`626:18`) e Acesso não autorizado
  (`626:31`) ganharam desenho no Figma e foram sincronizadas
- Reenvio do e-mail de verificação passou a ter espera de 60 s entre tentativas
  ("limitar repetição", item 06)
- Preferências do onboarding passaram a ser gravadas também no perfil do
  Firestore
- Contrato de navegação `618:18` implementado: Boas-vindas, verificação de
  e-mail, retomada da etapa do onboarding e as quatro respostas do painel
- Splash passou a valer também no painel admin (tinha ficado de fora)
- Telas **Entrar** (`612:12`) e **Recuperar senha** (`613:14`, `613:43`)
  desenhadas no Figma e implementadas; o handoff `577:18` ganhou as seções
  LOGIN e RECUPERAÇÃO DE SENHA
- Painel administrativo implementado a partir da seção `595:2`: catálogo,
  editor, revisão/publicação, agenda, usuários e alteração de permissão
- Cadastro ligado ao Firebase Authentication, com perfil e papel no Firestore
- `firestore.rules` escrito e versionado
- `eslint` e `eslint-config-expo` entraram no `package.json` (o script `lint` já
  existia, faltava a dependência)

### 2026-09-12

- Cadastro opcional implementado a partir do Figma e ajustado duas vezes
- Quadros do Epicteto reexportados e aprovados na verificação
- Splash virou camada de abertura: 2,2 s → 5 s, botão removido
- Onboarding (2 telas) implementado e espaçamentos ajustados três vezes
