import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  mensagemDeErro,
  ErroPedeConfirmacao,
  observarConteudos,
  observarEdicoes,
  programarEdicao,
} from '@/lib/admin/repositorio';
import {
  DIAS_DA_EDICAO,
  dataDe,
  dataDeExibicao,
  dataValida,
  mascaraDeData,
  mascaraDeHora,
  dataParaExibicao,
  fimDaEdicao,
  FUSO_EDITORIAL_PADRAO,
  instante,
  pendenciasDaEdicao,
  periodoParaExibicao,
  periodosSeSobrepoem,
  proximaSegunda,
  type Conteudo,
  type EdicaoSemanal,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { spacing } from '@/theme';

/** Hoje no fuso editorial, como `AAAA-MM-DD`. */
function hoje(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_EDITORIAL_PADRAO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

type Envio =
  | { estado: 'ocioso' }
  | { estado: 'programando' }
  | { estado: 'programado' }
  | { estado: 'erro'; mensagem: string }
  /** Período ocupado: exige confirmar a substituição da edição que cruza. */
  | { estado: 'confirmar'; mensagem: string; substituirId: string };

/**
 * Programação semanal (`595:7`).
 *
 * O contrato editorial de 15/09 trocou o destaque por data pela **edição de
 * sete dias**: o mesmo conteúdo fica na Home a semana inteira, com início
 * inclusivo e fim exclusivo. A tela desenhada tem ainda atividade recomendada
 * e seleção da Biblioteca; nenhuma das duas coleções existe no código, então
 * elas ficam de fora até existirem — ver `docs/progresso.md`.
 */
export default function AdminProgramacaoScreen() {
  const { user } = useAuth();
  const { nomeDoFilosofo } = useFilosofos();

  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [edicoes, setEdicoes] = useState<EdicaoSemanal[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const [nome, setNome] = useState('');
  const [conteudoId, setConteudoId] = useState('');

  // Os quatro campos guardam o que está escrito na tela, em DD/MM/AAAA e HH:MM.
  // A conversão para o formato gravado acontece num lugar só, logo abaixo.
  const [dataInicio, setDataInicio] = useState(() => dataParaExibicao(proximaSegunda(hoje())));
  const [horaInicio, setHoraInicio] = useState('00:00');
  const [dataFim, setDataFim] = useState(() =>
    dataParaExibicao(dataDe(fimDaEdicao(`${proximaSegunda(hoje())}T00:00`))),
  );
  const [horaFim, setHoraFim] = useState('00:00');
  const [envio, setEnvio] = useState<Envio>({ estado: 'ocioso' });

  const inicio = instante(dataDeExibicao(dataInicio), horaInicio.trim());
  const fim = instante(dataDeExibicao(dataFim), horaFim.trim());
  const pendencias = pendenciasDaEdicao({ nome, conteudoId, inicio, fim });

  // O período se calcula sozinho a partir dos quatro campos; nome e aula não
  // entram nesta conta, por isso não é `pendencias.length === 0`.
  const periodoPronto = pendenciasDaEdicao({ nome: 'x', conteudoId: 'x', inicio, fim }).length === 0;

  /**
   * Mudar o início empurra o término sete dias à frente, mas só enquanto o
   * término ainda for o que esta tela calculou. Depois que alguém o edita à
   * mão, mexer no início deixa de apagar essa escolha.
   *
   * A sugestão só é recalculada com uma data **completa**: enquanto se digita,
   * o campo passa por valores parciais, e recalcular a cada tecla esvaziava o
   * término em vez de deixá-lo quieto.
   */
  function aoMudarDataInicio(bruto: string) {
    const valor = mascaraDeData(bruto);
    const sugestaoAtual = dataParaExibicao(dataDe(fimDaEdicao(inicio)));

    setDataInicio(valor);

    const dataIso = dataDeExibicao(valor);
    if (dataFim === sugestaoAtual && dataValida(dataIso)) {
      const novoFim = fimDaEdicao(instante(dataIso, horaInicio));
      if (novoFim) setDataFim(dataParaExibicao(dataDe(novoFim)));
    }

    setEnvio({ estado: 'ocioso' });
  }

  useEffect(() => {
    const pararConteudos = observarConteudos(setConteudos, (falha) => setErro(falha.message));
    const pararEdicoes = observarEdicoes(setEdicoes, (falha) => setErro(falha.message));

    return () => {
      pararConteudos();
      pararEdicoes();
    };
  }, [tentativa]);

  /**
   * O que pode entrar na edição: **aula publicada**, e só.
   *
   * O contrato chama o campo de "Aula publicada" e diz que a referência à aula
   * é obrigatória (`671:1249`). O destaque da Home é a experiência de quatro
   * etapas; um artigo programado abriria a Home num formato que a tela do
   * Conhecimento da semana não sabe mostrar.
   */
  const publicados = useMemo(
    () =>
      (conteudos ?? [])
        .filter((conteudo) => conteudo.status === 'publicado' && conteudo.tipo === 'aula')
        .map((conteudo) => ({
          id: conteudo.id,
          nome: `${conteudo.titulo} (${nomeDoFilosofo(conteudo.autorId)})`,
        })),
    [conteudos, nomeDoFilosofo],
  );

  /**
   * Título de um conteúdo já programado.
   *
   * Procura no catálogo inteiro, não na lista de opções: uma edição antiga
   * pode apontar para um artigo ou para uma aula arquivada, e nenhum dos dois
   * está entre o que se pode programar hoje. Dizer "removido" sobre um
   * conteúdo que existe seria mentira na tela.
   */
  const tituloDoConteudo = (id: string) => {
    const conteudo = (conteudos ?? []).find((cada) => cada.id === id);

    return conteudo
      ? `${conteudo.titulo || 'Sem título'} (${nomeDoFilosofo(conteudo.autorId)})`
      : 'Conteúdo removido';
  };

  function aoMudarCampo<T>(definir: (valor: T) => void) {
    return (valor: T) => {
      definir(valor);
      setEnvio({ estado: 'ocioso' });
    };
  }

  async function programar(substituirId?: string) {
    if (envio.estado === 'programando') return;

    if (!user) {
      setEnvio({ estado: 'erro', mensagem: 'Sessão expirada. Entre de novo.' });
      return;
    }

    setEnvio({ estado: 'programando' });

    try {
      await programarEdicao({ nome, conteudoId, inicio, fim }, user.uid, substituirId);
      setEnvio({ estado: 'programado' });
    } catch (falha) {
      const mensagem = mensagemDeErro(falha, 'Falha ao programar.');

      if (falha instanceof ErroPedeConfirmacao) {
        // O id de quem cruza sai da lista que a tela já tem em mãos: assim a
        // substituição atinge exatamente a edição mostrada na pergunta.
        const conflito = (edicoes ?? []).find((edicao) =>
          periodosSeSobrepoem({ inicio, fim }, edicao),
        );

        setEnvio(
          conflito
            ? { estado: 'confirmar', mensagem, substituirId: conflito.id }
            : { estado: 'erro', mensagem },
        );
        return;
      }

      setEnvio({ estado: 'erro', mensagem });
    }
  }

  return (
    <PaginaAdmin
      titulo="PROGRAMAÇÃO SEMANAL"
      apoio="Organize o destaque da Home, a atividade recomendada e a seleção da Biblioteca em um único período."
      topo={<EtiquetaAdmin />}
      nota="Antes de programar: conferir intervalo livre, versões publicadas e ordem da seleção. Substituir uma edição exige confirmar os destinos afetados.">
      <NavegacaoAdmin atual="programacao" />

      {erro ? (
        <ErroRecuperavel
          mensagem={erro}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      ) : conteudos === null || edicoes === null ? (
        <Carregando rotulo="Carregando a programação…" />
      ) : (
        <>
          <CampoTexto
            rotulo="Nome interno da edição *"
            placeholder="Ex.: Escolhas e atenção"
            value={nome}
            onChangeText={aoMudarCampo(setNome)}
          />

          {publicados.length === 0 ? (
            <Vazio
              titulo="Nenhuma aula publicada ainda."
              apoio="Cadastre e publique um conteúdo da semana antes de programar."
            />
          ) : (
            <>
              <CampoSelecao
                rotulo="Conteúdo semanal *"
                opcoes={publicados}
                valor={conteudoId}
                aoEscolher={aoMudarCampo(setConteudoId)}
                vazio="Selecione uma aula publicada"
              />

              <Text color="textSecondary">
                A aula selecionada será exibida na Home durante toda a semana.
              </Text>
            </>
          )}

          <Linha>
            <View style={styles.metade}>
              <CampoTexto
                rotulo="Data de início *"
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                value={dataInicio}
                onChangeText={aoMudarDataInicio}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.metade}>
              <CampoTexto
                rotulo="Horário de início *"
                placeholder="00:00"
                keyboardType="number-pad"
                maxLength={5}
                value={horaInicio}
                onChangeText={(bruto) => aoMudarCampo(setHoraInicio)(mascaraDeHora(bruto))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </Linha>

          <Linha>
            <View style={styles.metade}>
              <CampoTexto
                rotulo="Data de término *"
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                value={dataFim}
                onChangeText={(bruto) => aoMudarCampo(setDataFim)(mascaraDeData(bruto))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.metade}>
              <CampoTexto
                rotulo="Horário de término *"
                placeholder="00:00"
                keyboardType="number-pad"
                maxLength={5}
                value={horaFim}
                onChangeText={(bruto) => aoMudarCampo(setHoraFim)(mascaraDeHora(bruto))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </Linha>

          {/*
            A caixa mostra o período calculado, que é o assunto dela. As
            pendências saíram daqui: nome da edição e escolha da aula não são
            período, e apareciam com o mesmo peso da regra do fuso. Agora ficam
            junto do botão que elas bloqueiam.
          */}
          <CaixaSecao titulo="PERÍODO">
            <Text variant="headingMedium" color={periodoPronto ? 'text' : 'textSecondary'}>
              {periodoPronto ? periodoParaExibicao(inicio, fim) : 'Informe data e horário'}
            </Text>

            <Text variant="supportSemibold" color="textSecondary">
              Fuso horário: Brasília ({FUSO_EDITORIAL_PADRAO}). O conteúdo permanece em destaque
              por {DIAS_DA_EDICAO} dias. No horário de término, deixa de ser exibido.
            </Text>
          </CaixaSecao>

          {envio.estado === 'erro' ? <Aviso mensagem={envio.mensagem} tom="erro" /> : null}
          {envio.estado === 'programado' ? <Aviso mensagem="Edição programada." /> : null}

          {envio.estado === 'confirmar' ? (
            <>
              <Aviso mensagem={envio.mensagem} tom="erro" />
              <Linha>
                <Button
                  label="SUBSTITUIR EDIÇÃO"
                  size="medium"
                  onPress={() => programar(envio.substituirId)}
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
            <>
            {pendencias.length > 0 ? <Aviso mensagem={pendencias.join(' ')} /> : null}

            <Button
              label={envio.estado === 'programando' ? 'Programando…' : 'PROGRAMAR EDIÇÃO'}
              size="medium"
              disabled={
                envio.estado === 'programando' ||
                publicados.length === 0 ||
                pendencias.length > 0
              }
              onPress={() => programar()}
              style={styles.programar}
            />
            </>
          )}

          <CaixaSecao titulo="EDIÇÕES PROGRAMADAS">
            {edicoes.length === 0 ? (
              <Vazio titulo="Nenhuma edição programada." />
            ) : (
              edicoes.map((edicao) => (
                <View key={edicao.id} style={styles.linhaEdicao}>
                  <Text style={styles.colPeriodo}>
                    {periodoParaExibicao(edicao.inicio, edicao.fim)}
                  </Text>
                  <Text style={styles.colNome}>{edicao.nome || 'Sem nome'}</Text>
                  <Text style={styles.colConteudo}>{tituloDoConteudo(edicao.conteudoId)}</Text>
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
  linhaEdicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 40,
  },
  colPeriodo: {
    width: 280,
  },
  colNome: {
    flex: 1,
  },
  colConteudo: {
    flex: 2,
  },
});
