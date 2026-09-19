import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/Estados';
import { BotaoVoltar } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Retrato } from '@/components/admin/Retrato';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { criarFilosofo, mensagemDeErro, salvarFilosofo } from '@/lib/admin/repositorio';
import {
  filosofoVazio,
  NIVEIS,
  pendenciasDoFilosofo,
  ROTULO_NIVEL,
  type IntroducaoDoFilosofo,
  type Nivel,
  type RascunhoFilosofo,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { ACERVO_DE_RETRATOS, retratoDoAcervo } from '@/lib/retratos';
import { radius, spacing } from '@/theme';

type Gravacao =
  { estado: 'ocioso' } | { estado: 'salvando' } | { estado: 'erro'; mensagem: string };

/** Telas `643:948` (editar) e `643:1215` (novo) — o mesmo formulário. */
export default function AdminFilosofoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { filosofos, carregando, erro } = useFilosofos();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoFilosofo>(filosofoVazio);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [tocado, setTocado] = useState(false);
  const [escolherAberto, setEscolherAberto] = useState(false);
  const [nivel, setNivel] = useState<Nivel>('leigo');
  const hidratado = useRef(false);

  const existente = criando ? null : filosofos.find((filosofo) => filosofo.id === id);

  // Só a primeira leitura preenche o formulário: depois disso, uma atualização
  // vinda do servidor não pode apagar o que a pessoa está escrevendo.
  useEffect(() => {
    if (criando || hidratado.current || !existente) return;

    hidratado.current = true;
    const { id: _id, atualizadoEm: _atualizadoEm, ...campos } = existente;
    setRascunho(campos);
  }, [criando, existente]);

  const pendencias = pendenciasDoFilosofo(rascunho);
  const salvando = gravacao.estado === 'salvando';
  const escolhido = retratoDoAcervo(rascunho.portraitAssetId);

  function alterarIntroducao(campo: keyof IntroducaoDoFilosofo, valor: string) {
    setRascunho((atual) => ({
      ...atual,
      introducoes: {
        ...atual.introducoes,
        [nivel]: { ...atual.introducoes[nivel], [campo]: valor },
      },
    }));
  }

  function escolherRetrato(portraitAssetId: string | null) {
    setRascunho((atual) => ({ ...atual, portraitAssetId }));
    setEscolherAberto(false);
  }

  async function salvar() {
    setTocado(true);

    if (pendencias.length > 0) return;

    setGravacao({ estado: 'salvando' });

    try {
      if (criando) {
        await criarFilosofo(rascunho);
      } else {
        await salvarFilosofo(id, rascunho);
      }

      router.replace('/admin/filosofos');
    } catch (falha) {
      setGravacao({
        estado: 'erro',
        mensagem: mensagemDeErro(falha, 'Não foi possível salvar.'),
      });
    }
  }

  if (!criando && carregando) {
    return (
      <PaginaAdmin
        titulo="EDITAR FILÓSOFO"
        topo={
          <BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />
        }>
        <Carregando rotulo="Carregando o cadastro…" />
      </PaginaAdmin>
    );
  }

  if (!criando && !existente) {
    return (
      <PaginaAdmin
        titulo="EDITAR FILÓSOFO"
        topo={
          <BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />
        }>
        <ErroRecuperavel mensagem={erro ?? 'Este filósofo não existe no acervo.'} />
      </PaginaAdmin>
    );
  }

  return (
    <PaginaAdmin
      titulo={criando ? 'NOVO FILÓSOFO' : 'EDITAR FILÓSOFO'}
      apoio={
        criando
          ? 'Cadastre a identidade que será usada em todos os conteúdos.'
          : 'Identidade usada nos cards e na página do filósofo.'
      }
      topo={
        <BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />
      }
      nota="Para cadastrar conteúdo, basta escolher o filósofo da biblioteca. Sem retrato disponível, usar a inicial do nome.">
      <CaixaSecao titulo="FOTO DO FILÓSOFO" espacamento="sm">
        <Retrato nome={rascunho.nome} retratoId={rascunho.portraitAssetId} tamanho={160} />

        <Text color="textSecondary">
          {escolhido ? escolhido.nome : 'Nenhuma foto selecionada.'}
        </Text>

        <Text color="textSecondary">Retratos incluídos no app, sem envio de arquivos.</Text>

        <Button
          label={escolherAberto ? 'FECHAR ACERVO' : 'ESCOLHER DO ACERVO'}
          type="secondary"
          size="medium"
          onPress={() => setEscolherAberto((aberto) => !aberto)}
          style={styles.acao}
          accessibilityState={{ expanded: escolherAberto }}
        />

        {escolherAberto ? (
          <Linha>
            <OpcaoDeRetrato
              rotulo="Sem retrato"
              ativa={rascunho.portraitAssetId === null}
              aoEscolher={() => escolherRetrato(null)}
            />

            {ACERVO_DE_RETRATOS.map((retrato) => (
              <OpcaoDeRetrato
                key={retrato.id}
                rotulo={retrato.nome}
                retratoId={retrato.id}
                ativa={rascunho.portraitAssetId === retrato.id}
                aoEscolher={() => escolherRetrato(retrato.id)}
              />
            ))}
          </Linha>
        ) : null}

        <Text variant="supportSemibold">Imagem / Texto alternativo e crédito</Text>

        {/*
          Texto alternativo e crédito não são campos: vêm do acervo
          (`643:1215`). Aparecem em leitura para a redação conferir o que o app
          vai anunciar, sem poder divergir entre dois filósofos que usem a mesma
          ilustração.
        */}
        <Text color="textSecondary">
          {escolhido
            ? `${escolhido.textoAlternativo} ${escolhido.credito}`
            : 'Texto alternativo e crédito vêm do acervo de imagens do app.'}
        </Text>
      </CaixaSecao>

      <CaixaSecao titulo="DADOS DO FILÓSOFO" espacamento="sm">
        <CampoTexto
          rotulo="Nome *"
          placeholder="Digite o nome do filósofo"
          value={rascunho.nome}
          onChangeText={(nome) => setRascunho((atual) => ({ ...atual, nome }))}
          erro={tocado && !rascunho.nome.trim() ? 'Informe o nome do filósofo.' : undefined}
        />

        <CampoTexto
          rotulo="Biografia curta"
          placeholder="Escreva uma breve apresentação do filósofo."
          value={rascunho.biografia}
          onChangeText={(biografia) => setRascunho((atual) => ({ ...atual, biografia }))}
          linhas={3}
        />

        <Linha>
          <View style={styles.metade}>
            <CampoTexto
              rotulo="Subtítulo"
              placeholder="Filósofo estoico e senador romano"
              value={rascunho.subtitulo}
              onChangeText={(subtitulo) => setRascunho((atual) => ({ ...atual, subtitulo }))}
            />
          </View>

          <View style={styles.metade}>
            <CampoTexto
              rotulo="Período de vida"
              placeholder="4 a.C. — 65 d.C."
              value={rascunho.periodo}
              onChangeText={(periodo) => setRascunho((atual) => ({ ...atual, periodo }))}
            />
          </View>
        </Linha>

        {criando ? (
          <Text color="textSecondary">
            O identificador vem do nome e não muda depois. É ele que cada conteúdo guarda como
            autor.
          </Text>
        ) : null}
      </CaixaSecao>

      {/*
        "Introdução por nível *" (`673:1310`): "preencher texto e fonte de cada
        versão". Um nível por vez, como no editor da aula, com a situação dos
        quatro nas pílulas.
      */}
      <CaixaSecao titulo="INTRODUÇÃO POR NÍVEL *" espacamento="sm">
        <Linha>
          {NIVEIS.map((cada) => {
            const pronto = !!rascunho.introducoes[cada].texto.trim();

            return (
              <Button
                key={cada}
                label={`${pronto ? '✓ ' : ''}${ROTULO_NIVEL[cada].toLocaleUpperCase('pt-BR')}`}
                size="medium"
                type={cada === nivel ? 'primary' : 'secondary'}
                onPress={() => setNivel(cada)}
                accessibilityState={{ selected: cada === nivel }}
                style={styles.nivel}
              />
            );
          })}
        </Linha>

        <CampoTexto
          rotulo={`Título (${ROTULO_NIVEL[nivel]})`}
          placeholder="Uma filosofia para viver melhor"
          value={rascunho.introducoes[nivel].titulo}
          onChangeText={(valor) => alterarIntroducao('titulo', valor)}
        />

        <CampoTexto
          rotulo={`Texto (${ROTULO_NIVEL[nivel]}) *`}
          placeholder="Sêneca aproxima a filosofia das escolhas que fazemos."
          value={rascunho.introducoes[nivel].texto}
          onChangeText={(valor) => alterarIntroducao('texto', valor)}
          linhas={5}
          erro={
            tocado && !rascunho.introducoes[nivel].texto.trim()
              ? `Escreva a introdução de ${ROTULO_NIVEL[nivel]}.`
              : undefined
          }
        />

        <CampoTexto
          rotulo={`Fonte (${ROTULO_NIVEL[nivel]})`}
          placeholder="Sobre a brevidade da vida, capítulos 1 e 3."
          value={rascunho.introducoes[nivel].fonte}
          onChangeText={(valor) => alterarIntroducao('fonte', valor)}
        />
      </CaixaSecao>

      {tocado && pendencias.length > 0 ? (
        <Aviso mensagem={pendencias.join(' ')} tom="erro" />
      ) : null}

      {gravacao.estado === 'erro' ? <Aviso mensagem={gravacao.mensagem} tom="erro" /> : null}

      <Linha>
        <Button
          label={salvando ? 'SALVANDO…' : 'SALVAR FILÓSOFO'}
          size="medium"
          disabled={salvando}
          onPress={salvar}
          style={styles.acao}
        />

        <Button
          label="CANCELAR"
          type="secondary"
          size="medium"
          disabled={salvando}
          onPress={() => router.replace('/admin/filosofos')}
          style={styles.acao}
        />
      </Linha>
    </PaginaAdmin>
  );
}

/** Um retrato do acervo como alternativa clicável. */
function OpcaoDeRetrato({
  rotulo,
  retratoId = null,
  ativa,
  aoEscolher,
}: {
  rotulo: string;
  retratoId?: string | null;
  ativa: boolean;
  aoEscolher: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={rotulo}
      onPress={aoEscolher}
      style={[
        styles.opcao,
        { borderColor: ativa ? colors.accent : colors.border },
        ativa && { backgroundColor: colors.selected },
      ]}>
      <Retrato nome={rotulo} retratoId={retratoId} tamanho={96} />
      <Text variant="supportSemibold">{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metade: {
    flexGrow: 1,
    flexBasis: 320,
  },
  nivel: {
    flexGrow: 1,
    flexBasis: 160,
  },
  acao: {
    paddingHorizontal: spacing['2xl'],
    alignSelf: 'flex-start',
  },
  opcao: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    width: 140,
  },
});
