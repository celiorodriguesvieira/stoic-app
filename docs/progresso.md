# PAUSA — progresso do desenvolvimento

Diário para retomar o trabalho sem depender de memória. Atualize a cada sessão:
mova o que foi feito para "Histórico" e revise "Próximos passos".

**Última atualização:** 2026-09-13
**Figma:** [APP — TCC](https://www.figma.com/design/4ZvYZeKHrKGtUlSEEzedEp/APP---TCC)
**Estado do git:** tudo abaixo está **sem commit**.
**Verificação:** `npx tsc --noEmit` passa, `npx expo lint` não acusa nada no
código novo e `npx expo export` gera os bundles de iOS e web (as 6 rotas de
`/admin` aparecem na saída). Nada foi conferido visualmente ainda — nem no
simulador, nem no navegador.

---

## Fluxo de entrada do app

```
Toda abertura ──> Splash (5 s, tocar pula)
                     │
     primeiro acesso ├──> Cadastro ──> Onboarding (2 telas) ──> Abas
                     │     (criar conta OU continuar sem conta)
                     │
     acessos seguintes └──> Abas
```

Quem decide a tela é `src/app/_layout.tsx`, com três guardas (`Stack.Protected`):

| Situação | Tela |
| --- | --- |
| Sem conta e não é visitante | `(auth)` → começa em `criar-conta` |
| Tem conta ou é visitante, onboarding pendente | `onboarding` |
| Tem conta ou é visitante, onboarding concluído | `(tabs)` |

A splash não é rota: é uma camada por cima (`SplashOverlay`) enquanto a rota
certa já carrega por baixo. O painel administrativo não recebe splash — é
separado do app público.

| Situação | Tela |
| --- | --- |
| Papel `editor` ou `administrador` | `/admin` fica acessível por URL |

Não há botão para o painel em lugar nenhum do app: chega-se digitando o
endereço. Quem não tem papel não consegue nem isso — a pilha nem é registrada.

### Estado salvo no aparelho (AsyncStorage)

| Chave | Conteúdo | Onde |
| --- | --- | --- |
| `pausa:visitante` | `"true"` depois de "Continuar sem conta" | `src/lib/auth-context.tsx` |
| `pausa:onboarding-concluido` | `"true"` ao terminar o onboarding | `src/lib/onboarding-context.tsx` |
| `pausa:preferencias` | `{ nivel, interesses[] }` escolhidos no onboarding | `src/lib/onboarding-context.tsx` |

Para ver o primeiro acesso de novo, apague os dados do app (desinstale o Expo Go
do simulador).

---

## Decisões tomadas

- **Cadastro é opcional.** O MVP guarda progresso localmente e o TCC (seção 20
  do `IDEIA.md`) pede coleta mínima de dados e identificadores anônimos. Exigir
  e-mail e senha também prejudicaria a nota de usabilidade (SUS) e vai contra a
  regra 5.1.1(v) da App Store.
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
| Entrar (placeholder) | `src/app/(auth)/entrar.tsx` | — ainda não desenhada |
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
- [ ] **Criar o projeto no Firebase e preencher o `.env`** — sem isso nada do
      painel roda de verdade (passo a passo em `docs/painel-admin.md`)
- [ ] Publicar as regras: `firebase deploy --only firestore:rules`
- [ ] Promover a primeira conta a `administrador` pelo Console
- [ ] Rodar no simulador e no navegador e comparar tudo com o Figma
- [ ] Desenhar e implementar a tela **Entrar** (o cadastro já aponta para ela)
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
