import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { nomeDoFilosofo } from '@/lib/admin/acervo';
import {
  observarAgenda,
  observarConteudos,
  programarDestaque,
} from '@/lib/admin/repositorio';
import {
  FUSO_EDITORIAL_PADRAO,
  type Conteudo,
  type DestaqueAgendado,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

const FUSOS = [
  { id: 'America/Sao_Paulo', nome: 'America/Sao_Paulo' },
  { id: 'America/Manaus', nome: 'America/Manaus' },
  { id: 'America/Belem', nome: 'America/Belem' },
  { id: 'UTC', nome: 'UTC' },
];

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

type Envio =
  | { estado: 'ocioso' }
  | { estado: 'programando' }
  | { estado: 'programado' }
  | { estado: 'erro'; mensagem: string }
  /** Data ocupada: exige um segundo toque para confirmar a substituição. */
  | { estado: 'confirmar'; mensagem: string };

export default function AdminConhecimentoDoDiaScreen() {
  const { user } = useAuth();

  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [agenda, setAgenda] = useState<DestaqueAgendado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const [conteudoId, setConteudoId] = useState('');
  const [data, setData] = useState('');
  const [fuso, setFuso] = useState(FUSO_EDITORIAL_PADRAO);
  const [envio, setEnvio] = useState<Envio>({ estado: 'ocioso' });

  useEffect(() => {
    const pararConteudos = observarConteudos(setConteudos, (falha) => setErro(falha.message));
    const pararAgenda = observarAgenda(setAgenda, (falha) => setErro(falha.message));

    return () => {
      pararConteudos();
      pararAgenda();
    };
  }, [tentativa]);

  // Só conteúdo publicado pode virar destaque — a lista já reflete isso.
  const publicados = useMemo(
    () =>
      (conteudos ?? [])
        .filter((conteudo) => conteudo.status === 'publicado')
        .map((conteudo) => ({
          id: conteudo.id,
          nome: `${conteudo.titulo} · ${nomeDoFilosofo(conteudo.autorId)}`,
        })),
    [conteudos],
  );

  const tituloDoConteudo = (id: string) =>
    publicados.find((opcao) => opcao.id === id)?.nome ?? 'Conteúdo removido';

  async function programar(substituir = false) {
    if (envio.estado === 'programando') return;

    if (!conteudoId) {
      setEnvio({ estado: 'erro', mensagem: 'Escolha o conteúdo publicado.' });
      return;
    }

    if (!DATA_ISO.test(data)) {
      setEnvio({ estado: 'erro', mensagem: 'Informe a data no formato AAAA-MM-DD.' });
      return;
    }

    if (!user) {
      setEnvio({ estado: 'erro', mensagem: 'Sessão expirada. Entre de novo.' });
      return;
    }

    setEnvio({ estado: 'programando' });

    try {
      await programarDestaque({ conteudoId, data, fuso }, user.uid, substituir);
      setEnvio({ estado: 'programado' });
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Falha ao programar.';

      // Data ocupada não é erro: é uma pergunta. Pede confirmação antes de trocar.
      setEnvio(
        mensagem.includes('Já existe destaque')
          ? {
              estado: 'confirmar',
              mensagem: `Já existe destaque em ${data}. Substituir pelo conteúdo escolhido?`,
            }
          : { estado: 'erro', mensagem },
      );
    }
  }

  return (
    <PaginaAdmin
      titulo="CONHECIMENTO DO DIA"
      apoio="Selecione um conteúdo publicado. O destaque aponta para o mesmo registro do acervo."
      topo={<EtiquetaAdmin />}
      nota="A agenda guarda a referência ao conteúdo e a data — nunca uma cópia do texto. Corrigir o conteúdo corrige o destaque.">
      <NavegacaoAdmin atual="conhecimento" />

      {erro ? (
        <ErroRecuperavel mensagem={erro} aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }} />
      ) : conteudos === null || agenda === null ? (
        <Carregando rotulo="Carregando a agenda…" />
      ) : (
        <>
          {publicados.length === 0 ? (
            <Vazio
              titulo="Nenhum conteúdo publicado ainda."
              apoio="Publique um conteúdo antes de programar o destaque."
            />
          ) : (
            <CampoSelecao
              rotulo="Conteúdo"
              opcoes={publicados}
              valor={conteudoId}
              aoEscolher={(valor) => {
                setConteudoId(valor);
                setEnvio({ estado: 'ocioso' });
              }}
              vazio="Escolher conteúdo publicado"
            />
          )}

          <Linha>
            <View style={styles.metade}>
              <CampoTexto
                rotulo="Data de exibição"
                placeholder="AAAA-MM-DD"
                value={data}
                onChangeText={(valor) => {
                  setData(valor);
                  setEnvio({ estado: 'ocioso' });
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.metade}>
              <CampoSelecao
                rotulo="Fuso editorial"
                opcoes={FUSOS}
                valor={fuso}
                aoEscolher={setFuso}
              />
            </View>
          </Linha>

          <CaixaSecao titulo="ANTES DE PROGRAMAR">
            <Text>
              Verificar se o conteúdo está publicado e se a data está livre. Se já houver destaque
              nessa data, pedir confirmação antes de substituí-lo.
            </Text>
          </CaixaSecao>

          {envio.estado === 'erro' ? <Aviso mensagem={envio.mensagem} tom="erro" /> : null}
          {envio.estado === 'programado' ? <Aviso mensagem="Destaque programado." /> : null}

          {envio.estado === 'confirmar' ? (
            <>
              <Aviso mensagem={envio.mensagem} tom="erro" />
              <Linha>
                <Button
                  label="SUBSTITUIR DESTAQUE"
                  size="medium"
                  onPress={() => programar(true)}
                  style={styles.acao}
                />
                <Button
                  label="CANCELAR"
                  type="secondary"
                  size="medium"
                  onPress={() => setEnvio({ estado: 'ocioso' })}
                  style={styles.acao}
                />
              </Linha>
            </>
          ) : (
            <Button
              label={envio.estado === 'programando' ? 'Programando…' : 'PROGRAMAR DESTAQUE'}
              size="medium"
              disabled={envio.estado === 'programando' || publicados.length === 0}
              onPress={() => programar(false)}
              style={styles.programar}
            />
          )}

          <CaixaSecao titulo="AGENDA">
            {agenda.length === 0 ? (
              <Vazio titulo="Nenhum destaque programado." />
            ) : (
              agenda.map((destaque) => (
                <View key={destaque.id} style={styles.linhaAgenda}>
                  <Text style={styles.colData}>{destaque.data}</Text>
                  <Text style={styles.colConteudo}>{tituloDoConteudo(destaque.conteudoId)}</Text>
                  <Text style={styles.colFuso} color="textSecondary">
                    {destaque.fuso}
                  </Text>
                </View>
              ))
            )}
          </CaixaSecao>
        </>
      )}
    </PaginaAdmin>
  );
}

const styles = StyleSheet.create({
  metade: {
    flexGrow: 1,
    flexBasis: 320,
  },
  programar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3xl'],
  },
  acao: {
    flexGrow: 1,
    flexBasis: 240,
  },
  linhaAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 40,
  },
  colData: {
    width: 120,
  },
  colConteudo: {
    flex: 1,
  },
  colFuso: {
    width: 180,
  },
});
