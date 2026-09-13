import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

/**
 * Papéis do PAUSA.
 *
 * Regra do handoff `600:75`: o papel é autorizado no backend e NUNCA vem de um
 * campo editável pelo cliente. Por isso não existe seletor de papel no
 * cadastro — todo mundo nasce `usuario`. O primeiro administrador é criado à
 * mão no Console do Firebase; os seguintes, pela tela de Usuários e permissões.
 */
export const PAPEIS = ['usuario', 'editor', 'administrador'] as const;

export type Papel = (typeof PAPEIS)[number];

export const PAPEL_PADRAO: Papel = 'usuario';

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  usuario: 'Acesso ao app e ao próprio progresso.',
  editor: 'Cria, edita e publica conteúdos.',
  administrador: 'Também gerencia usuários e permissões.',
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  usuario: 'Usuário',
  editor: 'Editor',
  administrador: 'Administrador',
};

export type PerfilUsuario = {
  uid: string;
  nome: string;
  email: string;
  papel: Papel;
};

/** Editor e administrador entram no painel; administrador também mexe em pessoas. */
export function podeEditarConteudo(papel: Papel | null): boolean {
  return papel === 'editor' || papel === 'administrador';
}

export function podeGerenciarUsuarios(papel: Papel | null): boolean {
  return papel === 'administrador';
}

function ehPapel(valor: unknown): valor is Papel {
  return typeof valor === 'string' && (PAPEIS as readonly string[]).includes(valor);
}

const COLECAO = 'usuarios';

/**
 * Cria o documento de perfil logo após o cadastro.
 *
 * `merge: true` para que uma segunda tentativa (falha de rede na primeira) não
 * apague nada — e o papel só é gravado se ainda não existir, para que salvar o
 * perfil de novo nunca rebaixe um administrador.
 */
export async function criarPerfil(
  uid: string,
  dados: { nome: string; email: string },
): Promise<void> {
  if (!db) return;

  const referencia = doc(db, COLECAO, uid);
  const existente = await getDoc(referencia);

  await setDoc(
    referencia,
    {
      nome: dados.nome,
      email: dados.email,
      ...(existente.exists() ? {} : { papel: PAPEL_PADRAO, criadoEm: serverTimestamp() }),
    },
    { merge: true },
  );
}

/** Observa o perfil do UID. Devolve `null` enquanto não há Firestore ou documento. */
export function observarPerfil(
  uid: string,
  aoMudar: (perfil: PerfilUsuario | null) => void,
): () => void {
  if (!db) {
    aoMudar(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, COLECAO, uid),
    (instantaneo) => {
      const dados = instantaneo.data();

      if (!dados) {
        aoMudar(null);
        return;
      }

      aoMudar({
        uid,
        nome: typeof dados.nome === 'string' ? dados.nome : '',
        email: typeof dados.email === 'string' ? dados.email : '',
        // Papel desconhecido ou ausente cai no mais restrito, nunca no mais permissivo.
        papel: ehPapel(dados.papel) ? dados.papel : PAPEL_PADRAO,
      });
    },
    () => aoMudar(null),
  );
}
