# PAUSA

> Pare. Pense. Escolha.

Aplicativo móvel de filosofia para o cotidiano, com foco em estoicismo.
Trabalho de Conclusão de Curso.

## Stack

- **App:** React Native com Expo (SDK 57) e expo-router
- **Linguagem:** TypeScript
- **Back-end:** Firebase — Authentication e Cloud Firestore
- **Tipografia:** Pixelify Sans (identidade) e Inter (leitura)

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com as credenciais do Firebase
npm start
```

Abra o app **Expo Go** no celular e escaneie o QR Code exibido no terminal.

O app roda sem o `.env`, mas login e Firestore ficam indisponíveis — útil para
trabalhar nas telas antes de configurar o projeto no Firebase.

## Estrutura

```
src/
  app/          rotas (expo-router — cada arquivo é uma tela)
  components/   componentes reutilizáveis
    ui/         componentes base do design system
  hooks/        hooks compartilhados
  lib/          integrações externas (Firebase)
  theme/        tokens de design — cores, tipografia, espaçamento
  types/        declarações de tipos
```

## Design System

Os tokens em `src/theme/` espelham a página *00. Design System* do arquivo
Figma do projeto. Ao alterar um valor em um lado, altere no outro.

| Token | Uso |
| --- | --- |
| `canvas` | fundo da tela |
| `surface` | cards e superfícies elevadas |
| `accent` | ação primária |
| `emphasis` | destaque editorial |
| `gold` | indicadores e realce da marca |

## Scripts

| Comando | Ação |
| --- | --- |
| `npm start` | inicia o servidor de desenvolvimento |
| `npm run android` | abre no emulador Android |
| `npm run ios` | abre no simulador iOS |
| `npm run lint` | verifica o código |

## Notas de implementação

Decisões não óbvias que, se desfeitas sem contexto, quebram algo.

### `src/types/firebase-auth.d.ts` não pode ser apagado

O pacote `@firebase/auth` declara a chave `types` no seu `exports` **antes**
das condições de plataforma. O TypeScript casa com a primeira chave e nunca
chega na condição `react-native`, então `getReactNativePersistence` existe no
bundle que o Metro carrega mas não nos tipos. Esse arquivo reexpõe a função.
Sem ele o projeto não compila; sem a função, a sessão do usuário não sobrevive
ao fechamento do app.

### Fontes são importadas por subcaminho, não pelo índice

```ts
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
```

O índice do pacote faz `require` de todas as variações — a Inter tem 16, cerca
de 5,5 MB — e o Metro não descarta assets não usados. Importar de
`@expo-google-fonts/inter` levaria todas para dentro do app.

### Valores herdados do Figma que ainda precisam de confirmação

| Item | Situação |
| --- | --- |
| `text/accent` no modo dark | O Figma só define o valor light (`#a96e10`). Sobre fundo escuro ele ficaria ilegível, então usamos o dourado do modo dark. |
| Tipografia da tela de boas-vindas | A tela usa Pixelify Bold 32, kicker 20, citação 13/19 e rótulo de botão 14 — nenhum desses degraus consta na página *02 / Tipografia*. |
| `Label / Button` | A escala documenta 16/20, mas o componente Button do Figma usa 14. O componente é a referência usada no código. |
| Cores da `Navigation / Bottom` | Seis cores em hex à mão, todas a poucos pontos dos tokens: fundo `#fbf4e8` (token `#fbf7ef`), divisor `#dbccb8` (token `#d8cec2`), rótulo ativo `#29211f` (token `#252327`), rótulo inativo `#706661` (token `#756e68`), ícone ativo `#DE9228` (token `#d69a26`), ícone inativo `#6F6763` (token `#756e68`). O código usa os tokens. |
| `bg/card` (`#efe8df`) | Fundo do card horizontal de filósofo. Não consta na seção Cores. O valor do modo dark (`#1c1a19`) foi derivado. |
| `text/on-emphasis-muted` (`#c2bab5`) | Texto de apoio no card de autor. Não consta na seção Cores. |
| Cor do `Citação / Autoria` | Usa `text/accent` na tela de boas-vindas e `brand/gold` dentro do card de mensagem semanal. O componente recebe a cor por prop. |
| Descrição do `Card / Autor em destaque` | A descrição no Figma diz "nome em 16/22; apoio em 14/20", mas o nó desenhado usa 20/24 e 12/16. O código segue o nó. |

Reconciliar com o arquivo do Figma antes da entrega: ou a escala ganha esses
degraus, ou as telas passam a usar os existentes.

### Animação da tela de boas-vindas

Os três quadros do Epicteto vêm dos keyframes do Figma com easing `step-end` —
cortes secos, sem interpolação, porque é pixel art. Ciclo de 2000 ms:
180 ms (repouso) → 140 ms (ajuste) → 1680 ms (retorno). Os três ficam montados
alternando opacidade, para nenhum ser carregado no meio do ciclo.
