import { useCallback, useEffect, useMemo, useState } from 'react';

import { nomeDoFilosofoEm } from '@/lib/admin/acervo';
import { observarFilosofos } from '@/lib/admin/repositorio';
import type { Filosofo } from '@/lib/admin/tipos';

/**
 * Acervo de filósofos vindo do Firestore.
 *
 * Existe porque o nome do filósofo aparece em quatro telas do painel e, desde
 * que o cadastro saiu do código (`643:947`), nenhuma delas pode mais resolver
 * um `autorId` de forma síncrona. Enquanto a coleção não chega, `nome` cai na
 * semente de `acervo.ts` — assim um conteúdo antigo nunca aparece sem autor.
 */
export function useFilosofos() {
  const [filosofos, setFilosofos] = useState<Filosofo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => observarFilosofos(setFilosofos, (falha) => setErro(falha.message)), []);

  const lista = useMemo(() => filosofos ?? [], [filosofos]);

  const nomeDoFilosofo = useCallback((id: string) => nomeDoFilosofoEm(lista, id), [lista]);

  const opcoes = useMemo(
    () => lista.map((filosofo) => ({ id: filosofo.id, nome: filosofo.nome })),
    [lista],
  );

  return {
    filosofos: lista,
    /** `true` só na primeira leitura; um erro encerra a espera. */
    carregando: filosofos === null && !erro,
    erro,
    nomeDoFilosofo,
    /** Formato esperado por `CampoSelecao`. */
    opcoes,
  };
}
