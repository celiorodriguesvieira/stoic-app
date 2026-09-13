# Problema: sequência do Epicteto na tela de boas-vindas

**Estado:** resolvido em 2026-09-12 — quadros reexportados da seção `584:11`
("Epicteto / Exportação alinhada / 591 × 886") e verificação aprovada. Resta
apagar no Figma o retângulo "Correção / Artefato alfa" (`108:5`), que não é mais
necessário.
**Onde aparece:** splash de abertura (`src/components/splash-overlay.tsx`)
**Componente:** `src/components/epicteto-sequence.tsx`
**Nós no Figma:** `99:5` (tela), `100:3`, `103:5`, `103:6` (quadros animados)

## Sintoma

A animação não parece um GIF do Epicteto ajustando a mão no bastão. O
personagem inteiro salta na horizontal, alternando entre esquerda e direita,
como se a câmera se mexesse em vez da mão.

## Causa

Não é erro de código. Os três PNGs exportados têm o conteúdo em posições
diferentes dentro do mesmo canvas de 591 × 886.

| Quadro | Caixa do conteúdo (L, T, R, B) | Largura | Centro X |
| --- | --- | --- | --- |
| `01-repouso` | 0, 43, 541, 798 | 541 | 270,5 |
| `02-ajuste` | 4, 43, 531, 798 | 527 | 267,5 |
| `03-retorno` | 73, 43, 591, 798 | 518 | **332,0** |

O quadro 03 está deslocado 73 px para a direita e encosta na borda direita do
canvas. Como ele ocupa 84% do ciclo de animação, o olho lê a posição dele como
"a correta" e percebe os outros dois como um salto para a esquerda.

O desenho em si está consistente: alinhando os quadros pelo tronco e pela
cabeça — que não deveriam se mover —, a sobreposição chega a 99,7%. **Não é
preciso redesenhar o Epicteto, apenas reexportar com o mesmo enquadramento.**

| Quadro | Correção horizontal | Sobreposição após corrigir |
| --- | --- | --- |
| `01-repouso` | referência | — |
| `02-ajuste` | +11 px | 99,9% |
| `03-retorno` | −57 px | 99,7% |

## Defeito secundário: conteúdo encostando na borda

Dois quadros têm pixels opacos colados no limite do canvas, o que indica corte:

| Quadro | Borda | Pixels |
| --- | --- | --- |
| `01-repouso` | esquerda | 89 |
| `03-retorno` | direita | 89 |

No quadro 03 isso significa que parte do desenho provavelmente foi cortada na
exportação. Depois de reenquadrar, nenhuma borda deve ter pixel opaco.

## Defeito terciário: artefato de alfa

O quadro `01-repouso` tem 89 pixels opacos isolados na borda esquerda do
canvas (coluna x = 0 a 2, entre y = 614 e y = 705), desligados do corpo do
personagem. No Figma existe um retângulo chamado **"Correção / Artefato alfa"**
(nó `108:5`, 10 × 58, preenchido com `bg/surface`) tapando esse defeito.

Esse remendo não foi reproduzido no código, de propósito: cobrir lixo com um
retângulo da cor do fundo quebra assim que o fundo mudar — no modo escuro, por
exemplo, o remendo vira uma mancha clara. O certo é limpar o alfa na origem.

## Como corrigir

1. Reenquadrar de forma que sobre margem transparente nos quatro lados dos três
   quadros — nada encostando na borda.
2. No Figma, colocar os três quadros em frames de **tamanho idêntico**, com o
   corpo do Epicteto na **mesma coordenada x/y** nos três. Só a mão muda.
3. Exportar **os frames**, não o conteúdo selecionado. O erro típico é
   selecionar o desenho: o Figma recorta na caixa do conteúdo e, como a mão
   muda de posição, cada export sai com enquadramento diferente.
4. Apagar o artefato de alfa na borda esquerda do quadro 01 e remover o
   retângulo "Correção / Artefato alfa", que deixa de ser necessário.
5. Substituir os arquivos em `assets/images/epicteto/`, mantendo os nomes
   `01-repouso.png`, `02-ajuste.png` e `03-retorno.png`.
6. Rodar a verificação abaixo antes de commitar.

## Verificação

```bash
python3 scripts/verificar-sequencia.py
```

Requer `pip3 install Pillow numpy`. O script roda três testes — tamanho de
canvas igual, corpo alinhado (tolerância de 2 px) e bordas sem pixel opaco — e
sai com código 1 se algum falhar.

Rodando contra os arquivos atuais, os três defeitos aparecem:

```
Canvas
  PASSOU: todos em 591x886

Alinhamento do corpo
    01-repouso   desvio   +0 px   sobreposicao 100.0%   ok
    02-ajuste    desvio  +11 px   sobreposicao  99.9%   FORA
    03-retorno   desvio  -57 px   sobreposicao  99.7%   FORA
  FALHOU: quadros desalinhados

Bordas limpas
    01-repouso   89 px opacos na borda esquerda
    03-retorno   89 px opacos na borda direita
  FALHOU: conteudo encostando na borda do canvas
```

Critério de aceite: os três testes passando.

## Resultado da reexportação

Frames `584:12` (01-repouso), `584:15` (02-ajuste) e `584:18` (03-retorno),
exportados como PNG em escala 1, com o conteúdo recortado dentro de cada frame.

| Quadro | Caixa do conteúdo (L, T, R, B) |
| --- | --- |
| `01-repouso` | 36, 43, 561, 798 |
| `02-ajuste` | 35, 43, 562, 798 |
| `03-retorno` | 36, 43, 554, 798 |

```
Canvas
  PASSOU: todos em 591x886

Alinhamento do corpo
    01-repouso   desvio   +0 px   sobreposicao 100.0%   ok
    02-ajuste    desvio   +0 px   sobreposicao  99.9%   ok
    03-retorno   desvio   +0 px   sobreposicao  99.7%   ok
  PASSOU: corpo alinhado nos tres quadros

Bordas limpas
  PASSOU: nenhum pixel solto nas bordas
```

## Contexto da animação (já implementado, não precisa mudar)

Os tempos vêm dos keyframes do Figma, com easing `step-end` — cortes secos,
sem interpolação, porque é pixel art. Ciclo de 2000 ms em loop:

| Quadro | Visível | Duração |
| --- | --- | --- |
| 01 repouso | 0% → 9% | 180 ms |
| 02 ajuste | 9% → 16% | 140 ms |
| 03 retorno | 16% → 100% | 1680 ms |

Os três ficam montados alternando opacidade, para nenhum ser carregado no meio
do ciclo. Quando o usuário liga "reduzir movimento" no sistema, a animação não
roda e fica fixa no quadro 03.
