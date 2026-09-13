#!/usr/bin/env python3
"""
Verifica os quadros da sequencia do Epicteto usada na tela de boas-vindas.

Roda os tres testes que pegam os defeitos descritos em
docs/splash-sequencia-epicteto.md:

  1. os tres quadros tem o mesmo tamanho de canvas
  2. o corpo do personagem esta na mesma posicao nos tres (so a mao muda)
  3. nao ha pixels soltos grudados nas bordas do canvas

Uso:  python3 scripts/verificar-sequencia.py
Requer Pillow e numpy:  pip3 install Pillow numpy
"""

import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit('Faltam dependencias. Rode: pip3 install Pillow numpy')

PASTA = Path(__file__).resolve().parent.parent / 'assets' / 'images' / 'epicteto'
QUADROS = ['01-repouso', '02-ajuste', '03-retorno']

# Margem aceita de desalinhamento, em pixels do canvas original.
TOLERANCIA_PX = 2

# Fracao superior da imagem usada para alinhar: cabeca e tronco, que nao
# deveriam se mover entre os quadros.
FAIXA_ESTATICA = 0.45


def carregar():
    mascaras = {}
    for nome in QUADROS:
        caminho = PASTA / f'{nome}.png'
        if not caminho.exists():
            sys.exit(f'Arquivo nao encontrado: {caminho}')
        imagem = Image.open(caminho).convert('RGBA')
        mascaras[nome] = (np.array(imagem)[:, :, 3] > 0, imagem.size)
    return mascaras


def testar_canvas(mascaras):
    tamanhos = {nome: tamanho for nome, (_, tamanho) in mascaras.items()}
    unicos = set(tamanhos.values())
    if len(unicos) > 1:
        for nome, tamanho in tamanhos.items():
            print(f'    {nome}: {tamanho[0]}x{tamanho[1]}')
        return False, 'os quadros tem canvas de tamanhos diferentes'
    largura, altura = unicos.pop()
    return True, f'todos em {largura}x{altura}'


def testar_alinhamento(mascaras):
    referencia = QUADROS[0]
    altura = mascaras[referencia][0].shape[0]
    faixa = slice(0, int(altura * FAIXA_ESTATICA))
    base = mascaras[referencia][0][faixa]

    falhas = []
    for nome in QUADROS:
        alvo = mascaras[nome][0][faixa]
        melhor_dx, melhor_pontuacao = 0, -1
        for dx in range(-120, 121):
            pontuacao = np.logical_and(base, np.roll(alvo, dx, axis=1)).sum()
            if pontuacao > melhor_pontuacao:
                melhor_pontuacao, melhor_dx = pontuacao, dx
        sobreposicao = melhor_pontuacao / base.sum() * 100
        estado = 'ok' if abs(melhor_dx) <= TOLERANCIA_PX else 'FORA'
        print(f'    {nome:<12} desvio {melhor_dx:+4d} px   sobreposicao {sobreposicao:5.1f}%   {estado}')
        if abs(melhor_dx) > TOLERANCIA_PX:
            falhas.append(f'{nome} ({melhor_dx:+d} px)')

    if falhas:
        return False, 'quadros desalinhados: ' + ', '.join(falhas)
    return True, 'corpo alinhado nos tres quadros'


def testar_bordas(mascaras):
    falhas = []
    for nome in QUADROS:
        mascara = mascaras[nome][0]
        bordas = {
            'esquerda': mascara[:, 0],
            'direita': mascara[:, -1],
            'topo': mascara[0, :],
            'base': mascara[-1, :],
        }
        for lado, linha in bordas.items():
            quantidade = int(linha.sum())
            if quantidade:
                print(f'    {nome:<12} {quantidade} px opacos na borda {lado}')
                falhas.append(f'{nome}/{lado}')
    if falhas:
        return False, 'conteudo encostando na borda do canvas: ' + ', '.join(falhas)
    return True, 'nenhum pixel solto nas bordas'


def main():
    mascaras = carregar()
    testes = [
        ('Canvas', testar_canvas),
        ('Alinhamento do corpo', testar_alinhamento),
        ('Bordas limpas', testar_bordas),
    ]

    tudo_ok = True
    for titulo, funcao in testes:
        print(f'\n{titulo}')
        ok, mensagem = funcao(mascaras)
        print(f'  {"PASSOU" if ok else "FALHOU"}: {mensagem}')
        tudo_ok = tudo_ok and ok

    print()
    if tudo_ok:
        print('Sequencia aprovada — pode commitar.')
        return 0
    print('Sequencia reprovada. Ver docs/splash-sequencia-epicteto.md')
    return 1


if __name__ == '__main__':
    sys.exit(main())
