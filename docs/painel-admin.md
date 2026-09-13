# Painel administrativo

Onde o conteúdo do PAUSA é cadastrado. Desenho: seção **PAUSA / Admin /
Conteúdos e permissões** (`595:2`) e contrato de handoff `600:71`.

**Endereço:** `/admin` — não há botão no app. Quem não é editor nem
administrador não consegue chegar lá nem digitando o endereço.

---

## Colocar de pé (uma vez)

### 1. Projeto no Firebase

1. [Console do Firebase](https://console.firebase.google.com) → **Adicionar projeto**.
2. Dentro do projeto: **Criar aplicativo** → **Web** (`</>`).
3. Copie o bloco "Configuração do SDK" e preencha o `.env` (modelo em
   `.env.example`). São seis valores; todos começam com `EXPO_PUBLIC_`.
4. **Authentication** → *Get started* → habilite **E-mail/senha**.
5. **Firestore Database** → *Criar banco de dados* → **modo de produção**
   (as regras deste repositório substituem as padrão no passo seguinte).

### 2. Publicar as Security Rules

As regras estão em `firestore.rules` e são o que realmente protege os dados —
o painel só esconde botões.

```bash
npm install -g firebase-tools     # se ainda não tiver
firebase login
firebase use --add                # escolha o projeto criado
firebase deploy --only firestore:rules
```

### 3. Criar o primeiro administrador

Não existe tela para isso, **de propósito**: se houvesse, qualquer pessoa
viraria administrador. O caminho é manual e único.

1. Abra o app e crie sua conta normalmente pela tela de cadastro.
   Isso grava `usuarios/{seu-uid}` com `papel: "usuario"`.
2. Console → **Firestore Database** → coleção `usuarios` → seu documento.
3. Edite o campo `papel` para `administrador` e salve.
4. Volte ao app e abra `/admin`.

Daí em diante, promoções são feitas pela própria tela **Usuários e permissões**.

> Custom claims dariam uma verificação mais barata, mas não são editáveis pela
> interface do Console — exigiriam o Admin SDK. Por isso o papel mora no
> Firestore, onde você consegue mexer à mão.

---

## Coleções

| Coleção | Documento | Para quê |
| --- | --- | --- |
| `usuarios` | `{uid}` | Perfil e `papel`. Criado no cadastro. |
| `conteudos` | `{id}` | Conteúdo, textos por nível e aplicação vinculada. |
| `agenda` | `{id}` | Conhecimento do dia: referência a `conteudoId` + data. |
| `auditoria` | `{id}` | Histórico de alteração de permissão. Só cresce. |

O conteúdo guarda `autorId` e `temaIds` (não os nomes), para que renomear um
filósofo ou um tema não quebre vínculo nenhum. A lista de filósofos e temas
ainda é constante, em `src/lib/admin/acervo.ts` — vira coleção quando houver
tela de curadoria.

---

## Regras que o código faz valer

Do contrato `600:74`–`600:76`:

- **Rascunho salva incompleto; publicar exige os quatro níveis.** A validação
  roda de novo dentro da transação de publicação, não só no formulário.
- **A aplicação cotidiana é um registro só**, dentro do conteúdo, exibida em
  dois caminhos. Não há cópia para manter em sincronia.
- **A agenda guarda referência, não cópia.** Corrigir o conteúdo corrige o
  destaque já programado.
- **Conflito de edição:** cada conteúdo tem um número de `versao`. O editor
  guarda a versão que carregou e a transação recusa gravar sobre uma versão
  mais nova — em vez de apagar o trabalho de outra pessoa em silêncio.
- **Data já ocupada** na agenda não é erro: vira pergunta, e só substitui após
  confirmação.
- **Ninguém altera o próprio papel** e **o último administrador não perde o
  acesso**.
- **Toda alteração de papel é registrada** em `auditoria` com ator, alvo,
  valores anterior e novo, data e resultado.

---

## Limite conhecido

A trava do **último administrador** roda no cliente. O SDK web não permite
consultar dentro de `runTransaction`, então a contagem de administradores é uma
consulta feita antes da transação — há uma janela de corrida se dois
administradores se rebaixarem ao mesmo tempo.

As Security Rules impedem escalada de privilégio (só administrador escreve
`papel`, e nunca o próprio), mas não sabem contar documentos. A garantia
definitiva dessa regra exige uma **Cloud Function**. Enquanto ela não existir,
isto é proteção contra engano, não contra ataque — e está assim documentado
porque o contrato do handoff pede que operações não implementadas não sejam
tratadas como prontas.
