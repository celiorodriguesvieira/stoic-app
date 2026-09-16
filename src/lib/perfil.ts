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

/**
 * Preferências escolhidas no onboarding.
 *
 * Ficam no perfil, e não numa coleção à parte, porque são poucas, mudam pouco e
 * são sempre lidas junto com o perfil. `atualizadoEm` é milissegundos do
 * cliente: serve para reconciliar com o que está no aparelho (item 03 do
 * contrato `618:18`), não para ordenar registros no servidor.
 */
export type PreferenciasPerfil = {
  nivel: string | null;
  interesses: string[];
  atualizadoEm: number;
};

export type PerfilUsuario = {
  uid: string;
  nome: string;
  email: string;
  papel: Papel;
  /** Avatar do acervo (item 07 do `649:987`). `null` = inicial do nome. */
  avatarId: string | null;
  preferencias: PreferenciasPerfil | null;
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

function lerPreferencias(valor: unknown): PreferenciasPerfil | null {
  if (!valor || typeof valor !== 'object') return null;

  const bruto = valor as Record<string, unknown>;

  return {
    nivel: typeof bruto.nivel === 'string' ? bruto.nivel : null,
    interesses: Array.isArray(bruto.interesses)
      ? bruto.interesses.filter((item): item is string => typeof item === 'string')
      : [],
    atualizadoEm: typeof bruto.atualizadoEm === 'number' ? bruto.atualizadoEm : 0,
  };
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

/**
 * Resultado da leitura do perfil.
 *
 * A distinção entre `erro` e `pronto` com papel `usuario` importa: o contrato de
 * navegação (`618:18`, item 05) diz que "falha de rede não significa conta
 * inexistente ou ausência de permissão". Colapsar os dois em `null` faria uma
 * queda de rede expulsar um administrador do painel.
 */
export type LeituraPerfil =
  | { estado: 'carregando' }
  | { estado: 'pronto'; perfil: PerfilUsuario | null }
  | { estado: 'erro'; mensagem: string };

/**
 * Grava as preferências do onboarding no perfil.
 *
 * `merge: true` toca apenas o campo `preferencias` — o `papel` fica intacto, que
 * é o que as Security Rules exigem para deixar a própria pessoa escrever no seu
 * documento.
 */
export async function salvarPreferencias(
  uid: string,
  preferencias: { nivel: string | null; interesses: string[] },
): Promise<void> {
  if (!db) return;

  await setDoc(
    doc(db, COLECAO, uid),
    {
      preferencias: {
        nivel: preferencias.nivel,
        interesses: preferencias.interesses,
        atualizadoEm: Date.now(),
      },
    },
    { merge: true },
  );
}

/**
 * Grava nome e avatar juntos (itens 02 e 07 do contrato do menu, `649:987`).
 *
 * "Salvar alterações persiste avatarId junto com o nome; Cancelar descarta
 * ambos" — por isso uma gravação só, e não duas que poderiam deixar metade da
 * edição salva se a segunda falhasse.
 *
 * `merge: true` pelo mesmo motivo de `salvarPreferencias`: tocar só estes
 * campos é o que as regras exigem para a própria pessoa escrever no seu
 * documento — mandar o papel junto seria recusado.
 */
export async function salvarIdentidade(
  uid: string,
  identidade: { nome: string; avatarId: string | null },
): Promise<void> {
  if (!db) return;

  await setDoc(
    doc(db, COLECAO, uid),
    { nome: identidade.nome.trim(), avatarId: identidade.avatarId },
    { merge: true },
  );
}

/** Observa o perfil do UID, distinguindo "ainda não sei" de "não tem". */
export function observarPerfil(
  uid: string,
  aoMudar: (leitura: LeituraPerfil) => void,
): () => void {
  if (!db) {
    aoMudar({ estado: 'erro', mensagem: 'Firebase não configurado.' });
    return () => {};
  }

  return onSnapshot(
    doc(db, COLECAO, uid),
    (instantaneo) => {
      const dados = instantaneo.data();

      if (!dados) {
        // Documento ausente é resposta válida do servidor: a conta existe e
        // ainda não tem perfil. Não é erro.
        aoMudar({ estado: 'pronto', perfil: null });
        return;
      }

      aoMudar({
        estado: 'pronto',
        perfil: {
          uid,
          nome: typeof dados.nome === 'string' ? dados.nome : '',
          email: typeof dados.email === 'string' ? dados.email : '',
          // Papel desconhecido ou ausente cai no mais restrito, nunca no mais permissivo.
          papel: ehPapel(dados.papel) ? dados.papel : PAPEL_PADRAO,
          avatarId: typeof dados.avatarId === 'string' ? dados.avatarId : null,
          preferencias: lerPreferencias(dados.preferencias),
        },
      });
    },
    (falha) => aoMudar({ estado: 'erro', mensagem: falha.message }),
  );
}
