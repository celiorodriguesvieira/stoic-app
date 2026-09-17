import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CampoSelecao } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/estados';
import { BotaoVoltar } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { alterarPapel, observarUsuarios } from '@/lib/admin/repositorio';
import { useAuth } from '@/lib/auth-context';
import { DESCRICAO_PAPEL, PAPEIS, ROTULO_PAPEL, type Papel, type PerfilUsuario } from '@/lib/perfil';

const OPCOES_PAPEL = PAPEIS.map((papel) => ({ id: papel, nome: ROTULO_PAPEL[papel] }));

type Envio =
  | { estado: 'ocioso' }
  | { estado: 'alterando' }
  | { estado: 'erro'; mensagem: string };

export default function AdminConfirmarPermissaoScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { perfil } = useAuth();

  const [alvo, setAlvo] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novoPapel, setNovoPapel] = useState<Papel | ''>('');
  const [envio, setEnvio] = useState<Envio>({ estado: 'ocioso' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      observarUsuarios(
        (todos) => {
          setCarregando(false);
          const encontrado = todos.find((pessoa) => pessoa.uid === uid) ?? null;

          if (!encontrado) {
            setErro('Este usuário não foi encontrado.');
            return;
          }

          setAlvo(encontrado);
        },
        (falha) => {
          setCarregando(false);
          setErro(falha.message);
        },
      ),
    [uid, tentativa],
  );

  async function confirmar() {
    if (!alvo || !perfil || !novoPapel || envio.estado === 'alterando') return;

    setEnvio({ estado: 'alterando' });

    try {
      await alterarPapel(alvo, novoPapel, perfil);
      router.replace('/admin/usuarios');
    } catch (falha) {
      // Nada foi modificado — a lista continua como estava.
      setEnvio({
        estado: 'erro',
        mensagem:
          falha instanceof Error
            ? falha.message
            : 'Não foi possível alterar a permissão. Nada foi modificado. Tente novamente.',
      });
    }
  }

  const topo = <BotaoVoltar rotulo="← USUÁRIOS" aoVoltar={() => router.replace('/admin/usuarios')} />;

  if (carregando) {
    return (
      <PaginaAdmin titulo="ALTERAR PERMISSÃO" topo={topo}>
        <Carregando rotulo="Carregando o perfil…" />
      </PaginaAdmin>
    );
  }

  if (erro || !alvo) {
    return (
      <PaginaAdmin titulo="ALTERAR PERMISSÃO" topo={topo}>
        <ErroRecuperavel
          mensagem={erro ?? 'Perfil indisponível.'}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  // Promover a administrador dá poder sobre outras pessoas: exige o aviso do nó `598:67`.
  const ganhaPrivilegio = novoPapel === 'administrador' && alvo.papel !== 'administrador';
  const nome = alvo.nome || alvo.email;

  return (
    <PaginaAdmin
      titulo="ALTERAR PERMISSÃO"
      apoio={alvo.email}
      topo={topo}
      nota="A alteração é registrada com responsável, data e valores anterior e novo.">
      <CaixaSecao titulo="PERMISSÃO ATUAL" espacamento="sm">
        <Text>{ROTULO_PAPEL[alvo.papel]}</Text>
        <Text color="textSecondary">{DESCRICAO_PAPEL[alvo.papel]}</Text>
      </CaixaSecao>

      <CampoSelecao
        rotulo="Nova permissão"
        opcoes={OPCOES_PAPEL}
        valor={novoPapel}
        aoEscolher={(valor) => {
          setNovoPapel(valor as Papel);
          setEnvio({ estado: 'ocioso' });
        }}
        vazio="Escolher nova permissão"
      />

      <CaixaSecao espacamento="sm">
        {PAPEIS.map((papel) => (
          <Text key={papel} variant="supportSemibold" color="textSecondary">
            {ROTULO_PAPEL[papel]}: {DESCRICAO_PAPEL[papel]}
          </Text>
        ))}
      </CaixaSecao>

      {ganhaPrivilegio ? (
        <CaixaSecao titulo="CONFIRME ANTES DE CONTINUAR">
          <Text>
            {nome} poderá gerenciar permissões de outras pessoas. Esta alteração deve ser
            autorizada pelo servidor e registrada no histórico.
          </Text>
        </CaixaSecao>
      ) : null}

      {envio.estado === 'erro' ? <Aviso mensagem={envio.mensagem} tom="erro" /> : null}

      <Linha>
        <Button
          label="CANCELAR"
          type="secondary"
          size="medium"
          disabled={envio.estado === 'alterando'}
          onPress={() => router.replace('/admin/usuarios')}
          style={styles.acao}
        />

        <Button
          label={envio.estado === 'alterando' ? 'Alterando…' : 'CONFIRMAR ALTERAÇÃO'}
          size="medium"
          disabled={envio.estado === 'alterando' || !novoPapel || novoPapel === alvo.papel}
          onPress={confirmar}
          style={styles.acao}
        />
      </Linha>
    </PaginaAdmin>
  );
}

const styles = StyleSheet.create({
  acao: {
    flexGrow: 1,
    flexBasis: 260,
  },
});
