# PAUSA — progresso do desenvolvimento

Diário para retomar o trabalho sem depender de memória. Atualize a cada sessão:
mova o que foi feito para "Histórico" e revise "Próximos passos".

**Última atualização:** 2026-09-16 (cadastro da aula semanal)
**Figma:** [APP — TCC](https://www.figma.com/design/4ZvYZeKHrKGtUlSEEzedEp/APP---TCC)

---

## Retomar aqui

**O passo que eu faria primeiro:** cadastrar uma aula de verdade. O caminho
inteiro existe desde 16/09 e nunca foi percorrido com sessão real:

```
/admin → NOVA AULA / 4 ETAPAS → preencher os quatro níveis
      → REVISAR PUBLICAÇÃO → PUBLICAR CONTEÚDO
      → /admin/programacao → escolher a aula → programar a semana
```

Antes disso, **importar os filósofos** (`/admin/filosofos` → "Importar os seis
do código"): sem eles o seletor "Filósofo principal do card" abre vazio e a
aula não passa da identificação.

**O que ainda não fecha o ciclo:** a Home não lê a edição ativa. Programar a
semana grava a edição, mas o app continua mostrando o card de exemplo.

---

### Antes disso (pendência de 14/09)

**Abrir o app e olhar.** Nada do que foi
construído nas últimas duas sessões jamais renderizou — nem o fluxo de entrada
inteiro, nem as **seis telas do painel `/admin`**, nem o porteiro de quatro
estados que decide quem entra nele. É muito código escrito às cegas.

```bash
cd pausa && npx expo start --web     # depois abra http://localhost:8081
```

Para ver o **primeiro acesso**, use uma aba anônima — as chaves do onboarding
já estão gravadas no navegador. Para o painel, `http://localhost:8081/admin`
(sua conta já é `administrador`).

**Roteiro do que conferir no painel**, que nunca foi exercitado:

1. Catálogo vazio → **Novo conteúdo** → preencher um nível só → Salvar rascunho
2. "Revisar publicação" deve estar **bloqueado** até os quatro níveis
3. Preencher os quatro → Revisar → checklist e prévia → **Publicar**
4. Programação semanal: programar um período; período que cruze outro deve
   **perguntar** antes de substituir
5. Usuários: você aparece com "SEU ACESSO" desabilitado

**Depois disso**, o buraco mais óbvio: **não existe "sair da conta" no app**.
Com cadastro obrigatório é a única forma de trocar de usuário, e hoje só a tela
de verificação e o painel têm. O lugar é Perfil ou Preferências — desenhadas no
protótipo (`11. Protótipo`, frames 19 e 20), nunca implementadas.

### Estado do código

Tudo commitado: `cca5cf5` ("Estururação do login e firebase") levou os 16
arquivos da sessão de 13/09.

**Conferido em 2026-09-15** (Chromium headless, 390 px e 1280 px, zero erros no
console): splash, Boas-vindas, Entrar, Criar conta, Recuperar senha e o `/admin`
sem sessão ("Entre para continuar"). **Falta** tudo que exige login — onboarding,
abas e as seis telas do painel.

As credenciais **não** vazaram: `.env` está no `.gitignore`, o `.env.example` tem
só placeholders no commit e no staged, e a chave não aparece em commit nenhum
(conferido com `git log -S`).

**Verificação automática:** `npx tsc --noEmit` passa; `npx expo lint` só acusa um
padrão de refs que já existia antes destas sessões; `npx expo export` gera iOS e
web com as 26 rotas. As Security Rules foram testadas contra o projeto real
(tabela adiante). **Nenhuma tela foi conferida visualmente.**

---

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

**Corrigido em 2026-09-15 — o onboarding reaparecia a cada login.** A conclusão
era decidida só pelo `AsyncStorage`, que é justamente o que não acompanha a
pessoa: em outro navegador, aba anônima ou depois de limpar os dados do site, o
app pedia tudo de novo com as respostas já salvas no Firestore. Agora
`usuarios/{uid}.preferencias` também vale como prova de conclusão, o
`OnboardingProvider` espera a leitura do perfil antes de mandar alguém para o
onboarding (`perfilCarregado`, novo no `auth-context`) e, quando o perfil prova
a conclusão, a marca local é regravada para a abertura seguinte não depender de
rede.

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

- **O app é só claro** (2026-09-15). Item 04 do contrato do menu (`649:987`):
  "somente tema claro, independentemente da aparência do aparelho". Até aqui o
  app seguia o sistema e escurecia com cores que a IA escolheu no código —
  nenhuma tela escura foi desenhada. `useTheme` passou a devolver sempre o modo
  claro; os valores escuros continuam em `tokens.ts` à espera de desenho, e os
  hooks `use-color-scheme` foram removidos por terem ficado sem uso.
- **O link do painel usa o `papel` do Firestore, não custom claim.** O item 08
  do `649:987` pede `role === "admin"` no token, atribuída pelo Admin SDK — que
  exigiria Cloud Functions (e provavelmente plano Blaze). O projeto inteiro já
  autoriza pelo `usuarios/{uid}.papel`, com as regras impedindo autopromoção.
  Vale corrigir o texto do contrato no Figma.
- **Editar o nome acontece dentro do menu**, não numa tela de perfil. O item 12
  manda preservar o contexto de origem e não existe tela de perfil desenhada —
  inventar uma rota seria pior do que editar ali mesmo.

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
| Admin · Editor de artigo | `src/app/admin/conteudo/[id].tsx` | `595:4` |
| Admin · Aula em quatro etapas | `src/app/admin/aula/[id].tsx` | `668:202` |
| Admin · Revisar e publicar | `src/app/admin/revisar/[id].tsx` | `595:5` |
| Admin · Programação semanal | `src/app/admin/programacao.tsx` | `595:7` |
| Admin · Usuários e permissões | `src/app/admin/usuarios/index.tsx` | `595:6` |
| Admin · Alterar permissão | `src/app/admin/usuarios/[uid].tsx` | `595:8` |
| Admin · Filósofos | `src/app/admin/filosofos/index.tsx` | `643:947` |
| Admin · Novo / Editar filósofo | `src/app/admin/filosofos/[id].tsx` | `643:1215`, `643:948` |
| Menu "Seu espaço" | `src/components/ui/menu-seu-espaco.tsx` | `645:977`, `649:987` |
| Cabeçalho com hambúrguer | `src/components/ui/cabecalho-app.tsx` | `649:987`, item 14 |
| Seu perfil | `src/app/perfil/index.tsx` | `508:836` |
| Seu avatar | `src/app/perfil/avatar.tsx` | `511:1045` |
| Preferências | `src/app/preferencias.tsx` | `506:1063` |

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
| `src/lib/admin/acervo.ts` | Semente dos filósofos, temas fixos, id a partir do nome |
| `src/lib/admin/use-filosofos.ts` | Hook que lê o acervo do Firestore nas telas |
| `src/lib/admin/repositorio.ts` | Firestore: catálogo, publicação, agenda, filósofos, papéis, auditoria |
| `src/components/admin/` | Casca de página, campos, estados, navegação |
| `firestore.rules` | Autorização de verdade — o painel só esconde botões |

Regras que o código faz valer, do contrato:

- rascunho salva incompleto, publicar exige os quatro níveis (revalidado dentro
  da transação, não só no formulário);
- **excluir é arquivar** (2026-09-15): `arquivarConteudo` põe o status em
  `arquivado`, o que já tira o conteúdo do app pelas Security Rules (usuário
  comum só lê `publicado`). O catálogo esconde os arquivados atrás de "Mostrar
  arquivados (n)" e `restaurarConteudo` devolve ao status anterior — guardado em
  `statusAnterior` para não rebaixar a rascunho o que estava no ar. Apagar de
  verdade continua só nas regras (`allow delete: if ehAdmin()`), sem caminho na
  tela: apagar deixaria destaque órfão e sumiria com o histórico editorial.
  Arquivar um conteúdo programado no Conhecimento do dia **pergunta antes** e,
  confirmado, desmarca só as datas de hoje em diante — as passadas são registro
  do que já foi ao ar;
- a aplicação cotidiana é um registro só, exibido em dois caminhos;
- a agenda guarda referência ao conteúdo, nunca cópia do texto;
- **a aula é o registro do destaque** (2026-09-16): artigo e aula dividem a
  coleção `conteudos` e o catálogo (`672:1248`), separados pelo campo `tipo`.
  Documento gravado antes de 16/09 não tem o campo e é lido como `artigo`;
  cada tipo abre no seu editor, e abrir um pelo endereço do outro redireciona
  em vez de gravar por cima;
- **a programação só aceita aula publicada** (`671:1249`): o destaque da Home é
  a experiência de quatro etapas, e um artigo programado abriria a Home num
  formato que a tela do Conhecimento da semana não sabe mostrar;
- **as opções da reflexão têm id próprio**, sorteado uma vez: é o id que a
  resposta da pessoa vai guardar, e identificar a opção pela posição faria
  reordenar a lista reescrever o que já foi respondido;
- **publicar não coloca na Home**: só a edição da Programação semanal coloca —
  é o "publicar conteúdo sozinho não o coloca automaticamente na Home" do
  contrato;
- **o destaque é semanal** (2026-09-15): `programarEdicao` grava `inicio`
  (inclusivo) e `fim` (exclusivo, sete dias depois), e recusa período que cruze
  outra edição — "uma única edição ativa por vez" (`671:1237`). Cruzamento vira
  pergunta e a tela reenvia com o id de quem será substituído. Registros da
  agenda diária antiga (campo `data`) são lidos como a semana que começa
  naquele dia;
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

- [ ] **O papel vem do perfil no Firestore, não de custom claim.** O contrato
      do acesso ao painel (`646:106`) pede `role === "admin"` no token do
      Firebase, atribuída pelo Admin SDK (`646:108`). Hoje `usuarios/{uid}.papel`
      faz esse papel — as regras impedem autoatribuição, então não é buraco de
      segurança, mas diverge do contrato e da etapa 1 da ordem de implementação
- [ ] **Seguir a ordem de implementação do contrato** (`675:1256`): 1. auth,
      papel admin e regras de dados · 2. autores e temas · 3. acervo, rascunhos
      e versões · 4. validação, prévia e publicação · 5. atividades e recursos
      externos · 6. programação e curadoria · 7. consultas do app · 8. testes de
      aceite. As etapas 3, 4 e 6 foram feitas antes de 1 e 2 estarem fechadas
- [x] ~~**PUBLICAR AS SECURITY RULES**~~ — **feito em 2026-09-16**. O bloco
      `match /filosofos` estava só no repositório desde 15/09; era a única
      diferença de regra entre o arquivo e o servidor, e travou o painel
      inteiro por uma sessão. O diagnóstico só ficou incontestável quando a
      tela de Usuários carregou: listar usuários exige `ehAdmin()` verdadeiro
      no servidor, o que provou que o papel estava certo e sobrou uma única
      explicação possível
- [ ] **Conferir a programação com os campos novos**: data e horário de início
      e término nunca renderizaram com sessão. Sem permissão de leitura da
      agenda, a tela mostra o erro no lugar do formulário inteiro — o que é
      outra coisa a rever, já que criar uma edição não deveria sumir da tela
      porque a lista não carregou
- [ ] **Percorrer o cadastro da aula com sessão de verdade**: criar, preencher
      os quatro níveis, revisar, publicar e programar. Nada disso foi exercitado
      contra o Firestore — só com `EXPO_PUBLIC_AUTH_BYPASS=true`, que mostra as
      telas mas não grava
- [ ] **O atalho de desenvolvimento não alcança o app.** Com
      `EXPO_PUBLIC_AUTH_BYPASS=true` não há usuário do Firebase, então
      `uid` é nulo, `carregar(uid)` devolve sempre `onboardingDone: false` e a
      guarda manda para o onboarding — que também não conclui, porque concluir
      grava por UID. Resultado: **nenhuma tela atrás do onboarding pode ser
      vista sem conta de verdade**, e foi assim que o painel inteiro acabou
      escrito às cegas. Ou o bypass passa a usar um uid fictício, ou ele serve
      só para as telas de entrada
- [x] ~~**A Home ainda não lê a edição ativa.**~~ O card semanal continua sendo o
      exemplo fixo de Marco Aurélio no código. Falta ler a agenda
      (`inicio <= hoje < fim`), buscar a aula referenciada e montar o card com
      a frase de destaque, a duração e o filósofo — e, sem edição ativa,
      ocultar o destaque e oferecer Explorar, como manda o contrato
- [ ] **A aula publicada não tem leitor no app**: as quatro etapas existem no
      cadastro e na prévia do painel, mas ninguém as percorre (`61:6`–`61:9`).
      É o próximo passo depois da Home
- [ ] **Campos do `668:202` que ficaram de fora**: "Atividade relacionada
      (opcional)" — não existe coleção de atividades, e um seletor vazio seria
      pior do que a ausência
- [ ] **`NOVO RECURSO / BIBLIOTECA` (`672:1245`) não foi criado**: a Biblioteca
      não tem cadastro nem coleção. O botão entra quando o `668:203` existir
- [ ] **Erro do Firestore aparece em inglês** no catálogo sem sessão ("Missing
      or insufficient permissions"). A mensagem vem crua do SDK e devia ser
      traduzida como as outras
- [ ] **Os interruptores de Preferências só guardam a escolha.** "Conhecimento
      do dia" não muda a Home; "Reduzir animações" e "Texto ampliado" não
      alteram a renderização. Ficam no aparelho, por conta (`pausa:{uid}:
      preferencias-app`). O desenho de 15/09 **removeu "Lembretes"**, que era o
      único item a exigir permissão de notificação
- [ ] **"Temas de interesse" não navega**: o desenho tem a seta, mas não existe
      tela de edição de interesses. Hoje a linha só mostra o que foi escolhido
      no onboarding
- [ ] **Foco preso no menu** (item 06): o React Native não tem captura de foco
      nativa. Escape, X, toque fora e Voltar fecham, mas Tab ainda escapa do
      painel na web
- [ ] **Importar os filósofos**: em `/admin/filosofos`, com o acervo vazio,
      aparece "Importar os seis do código". É isso que põe `seneca`,
      `epicteto` e os outros quatro no Firestore com os **mesmos ids** que os
      conteúdos já guardam em `autorId`. Sem esse passo, o seletor de filósofo
      do editor abre vazio
- [ ] **Atividades** (`644:95`): o contrato inteiro está desenhado e nada foi
      implementado. Três tipos num editor condicionado, prévia, versão pública
      preservada até republicar, registro de conclusão por tentativa
- [x] ~~**Foto do filósofo**: depende de habilitar o Cloud Storage~~ —
      **encerrado em 16/09 por decisão do contrato** (`668:167`): "Cloud Storage
      não será ativado. Retratos e miniaturas são assets distribuídos". Virou o
      acervo em `src/lib/retratos.ts`. `668:166` diz o mesmo para áudio e vídeo:
      URL HTTPS de provedor externo
- [ ] **A tela `595:7` tem dois campos que ficaram de fora**: "atividade
      recomendada" e "seleção da Biblioteca" (até 12 itens). Nenhuma das duas
      coleções existe no código — entram quando Atividades e Biblioteca
      existirem
- [ ] **Exercitar o arquivamento com sessão de verdade**: arquivar um conteúdo,
      conferir que ele sai do catálogo, aparecer em "Mostrar arquivados",
      restaurar e ver se volta ao status que tinha. E o caso da pergunta:
      programar um destaque, arquivar o conteúdo e confirmar que desmarca a data
- [x] ~~Publicar as `firestore.rules` de novo? **Não é preciso**~~ — **esta
      conclusão estava errada e custou uma sessão.** Ela valia para o
      arquivamento, mas em 15/09 o arquivo ganhou o bloco `match /filosofos`, e
      isso **nunca foi publicado**. Em 16/09 o painel dava "Missing or
      insufficient permissions" em toda a tela de filósofos: o `ruleset` ativo
      era de 2026-09-14 e o `match /{document=**} { allow read, write: if false }`
      negava a coleção. **Regra nova no arquivo = republicar, sempre**:
      `npx firebase-tools deploy --only firestore:rules --project pausa-cc7f3`
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
- [ ] **Cadastro, Entrar e Onboarding 02 não desenham controle de voltar.** No
      iPhone não há botão físico, então as três eram becos sem saída; o código
      pôs "← VOLTAR". No **painel** a ausência é proposital — "admin desktop:
      navegação administrativa própria, sem hambúrguer do app" (`654:1759`) —,
      **mas isso deixa o painel sem saída em tela de celular**. Decidir se o
      painel ganha uma saída desenhada ou se deixa de ser aberto no aparelho
- [ ] A barra `596:9` desenha **oito** itens; o código tem quatro. Faltam
      ATIVIDADES, EXPLORAR, BIBLIOTECA e TEMAS, cujas telas não existem
- [ ] `595:7` tem "SALVAR RASCUNHO" e "REVISAR PROGRAMAÇÃO", mas **não existe
      tela de revisão da programação** no arquivo, nem estado de rascunho para a
      edição. O código continua com uma ação só, que programa direto
- [ ] `668:202` põe "Filósofo principal do card, temas e duração" num campo só;
      no código são três controles, porque um campo de texto livre não dá para
      escolher filósofo nem marcar tema
- [ ] `668:202` não mostra o que acontece quando a aula ainda não tem nenhum
      nível completo — a tela desenhada já está preenchida
- [ ] O catálogo `595:3` só tem EDITAR em cada linha. O código passou a ter
      ARQUIVAR (com confirmação na própria linha) e RESTAURAR, além do botão
      "Mostrar arquivados" — desenhar isso, junto com o status "Arquivado" na
      coluna STATUS

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

### Sessão de 2026-09-13/14 com Claude Code

**Conduzido pelo autor:** desenhou no Figma as seis telas do painel, o contrato
de handoff do admin (`600:71`–`600:76`), o contrato de navegação
(`618:18`) e as telas de Login, Recuperação, Boas-vindas, Verificar e-mail e
Acesso não autorizado. Criou o projeto no Firebase. Decidiu que o administrador
é declarado pelo Console, que a splash dura 5 s e — revertendo a decisão de
12/09 — que **o modo visitante seria removido**.

**Feito pela IA:** implementou as telas a partir dos nós do Figma; escreveu o
modelo de dados, o acesso ao Firestore e as Security Rules; testou as regras
contra o projeto real; e implementou o contrato de navegação.

**Onde a IA discordou ou corrigiu o rumo** (registrar isto importa para a
seção 21 tanto quanto o que foi aceito):

- apontou que um seletor "sou administrador" no cadastro violaria a regra que o
  próprio handoff escrevia ("não confiar em campo de perfil editável pelo
  cliente"), e a tela ficou sem ele;
- ao remover o modo visitante, registrou três consequências que o autor
  decidiu aceitar — coleta mínima (seção 20), efeito na nota de SUS (que é a
  proposição P2) e a regra 5.1.1(v) da App Store;
- descobriu que tratar falha de rede como ausência de permissão expulsaria um
  administrador do painel por causa de conexão ruim, e separou os dois estados;
- ao validar o parâmetro de destino do login, trocou validação por prefixo por
  lista fechada, porque a primeira seria um redirecionador aberto.

**Erros da IA nesta sessão**, também registrados: afirmou que o arquivo do Figma
tinha uma página só, com base numa listagem incompleta da ferramenta — o autor
corrigiu, são 11 páginas. E interpretou "primeiro acesso Onboarding depois
sempre Home" como remoção do cadastro do fluxo, o que precisou ser revertido.

---

### Sessão de 2026-09-16 com Claude Code

**Conduzido pelo autor:** desenhou no Figma a página 12 inteira — o contrato
editorial (`667:101`), a tela da aula em quatro etapas (`668:202`), a
programação por período (`595:7`) e os cadastros de atividade, biblioteca,
temas e mídia. Decidiu que o cadastro da aula semanal era a prioridade e
apontou o nó.

**Feito pela IA:** implementou o cadastro da aula a partir do `668:202` —
modelo de dados, validação, editor, prévia e checklist de publicação — e ligou
a programação semanal à aula publicada.

**Onde a IA discordou ou propôs outro caminho:**

- a IA tinha começado a ligar a Home à edição ativa; o autor interrompeu e
  redirecionou para o cadastro — sem aula cadastrada não há o que a Home
  mostrar, e a ordem do autor era a certa;
- o Figma junta "filósofo, temas e duração" num campo de texto só; a IA
  separou em três controles, porque texto livre não escolhe filósofo nem marca
  tema — e registrou a divergência na lista do Figma;
- a IA deixou de fora dois campos desenhados ("Atividade relacionada" e o botão
  "Novo recurso / Biblioteca") por não existirem as coleções: um seletor vazio
  e um botão que não leva a lugar nenhum enganam mais do que a ausência;
- o contrato pede id estável nas opções da reflexão; a IA sorteia o id na
  criação em vez de usar a posição, para que reordenar a lista não reescreva
  respostas já dadas;
- a primeira versão do editor despejava as trinta e seis pendências de uma aula
  em branco num aviso só; a IA repartiu em identificação, nível em edição e
  níveis restantes depois de ver a tela renderizada.

**Verificação:** `npx tsc --noEmit` passa; `npx expo lint` só acusa o padrão de
refs que já existia. As três telas novas foram renderizadas no Chromium
headless (1360 px) com o console limpo — a primeira vez que uma tela do painel
foi conferida com os olhos antes de ser dada por pronta.

---

## Histórico

### 2026-09-16

- **Regras publicadas e primeiro filósofo gravado.** Fim do bloqueio que
  atravessou a sessão: `filosofos` passou a existir para o servidor

- **Home ligada ao Firestore** (`327:403`): saudação por hora do aparelho com o
  nome do cadastro, card do Conhecimento da semana vindo da **edição ativa**, e
  os dois atalhos ("Explore ideias" e "Aplique no dia-a-dia"). Sem edição ativa,
  o destaque some e a tela oferece Explorar, como manda o contrato — em vez de
  repescar a semana vencida. Saíram do código os dados de exemplo: a citação
  fixa de Marco Aurélio, as grades de Autores e Temas e o carrossel "Continue
  lendo", que não existiam no desenho e fingiam um acervo que ninguém cadastrou
- **"Continue de onde parou" fica oculto**: o próprio handoff manda esconder
  sem histórico, e o app não grava posição de leitura em lugar nenhum
- **O card semanal deixou de ser citação**: passou a mostrar a
  `weeklyCardPhrase` da aula, sem aspas — "não atribuir frase editorial como
  citação literal" (`668:128`)
- **Programação por instante** (`595:7`, ajuste da tarde): o período deixou de
  ser duas datas e passou a ser **data + horário de início e de término**, em
  DD/MM/AAAA e HH:MM. O término virou campo editável — vem preenchido com sete
  dias e acompanha o início até alguém mexer nele. O **seletor de fuso saiu**:
  Brasília é fixo, e é isso que permite comparar períodos como texto
- **Acervo de retratos** (`src/lib/retratos.ts`): o cadastro de filósofos
  deixou de depender de upload. `fotoUrl` virou `portraitAssetId`, o botão
  virou "ESCOLHER DO ACERVO", e texto alternativo e crédito passaram a vir da
  imagem, não do formulário
- **Área segura e teclado no painel**: `PaginaAdmin` ganhou `SafeAreaView` e
  ajuste de recuo do teclado. O cabeçalho começa em `safeAreaTop + 16px`, como
  o contrato manda
- **Saídas que não existiam**: "← APP" na barra do painel (as quatro telas de
  primeiro nível não tinham volta ao app) e "← VOLTAR" em Criar conta, Entrar e
  Onboarding 02 — no iPhone não há botão físico, e as três eram becos sem saída
- **Erro do Firestore em português** (`traduzirErro`), com a causa provável
  nomeada em `permission-denied`
- **Cadastro da aula semanal** implementado a partir do `668:202`: identificação
  (título, frase de destaque de 10–80 caracteres, filósofo, temas, duração) e
  as quatro etapas — Conteúdo, Reflexão, Aplicação, Conclusão — em cada um dos
  quatro níveis
- Artigo e aula passaram a dividir a coleção `conteudos`, separados pelo campo
  `tipo`; o catálogo ganhou a coluna TIPO e os botões "NOVA AULA / 4 ETAPAS" e
  "NOVO ARTIGO", e cada linha abre no editor do seu tipo
- Revisão e publicação passaram a validar a aula: prévia das quatro etapas na
  ordem do app e checklist com frase do card, duração e os quatro níveis
- Programação semanal passou a oferecer **só aula publicada** (`671:1249`)
- `paraRascunho` centralizou a conversão documento → formulário, para campo
  novo não ficar de fora de um editor sem ninguém perceber


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
