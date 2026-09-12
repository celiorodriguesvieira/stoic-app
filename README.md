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
