import { Image } from 'expo-image';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import {
  ROTULO_TIPO_ATIVIDADE,
  sequenciaCorreta,
  type AlternativaAtividade,
  type RascunhoAtividade,
} from '@/lib/admin/tipos';
import { radius, spacing } from '@/theme';

/**
 * Telas de uma atividade no app (`66:2`): interação e conclusão.
 *
 * Moram aqui, e não no painel, pelo mesmo motivo do `DetalheRecurso`: a prévia
 * do admin (`643:1272`) e a aba Atividades têm de mostrar a mesma coisa, e duas
 * cópias acabariam divergindo. Quem guarda a resposta é quem usa — o painel
 * guarda em estado local; o app, quando existir, registra a tentativa.
 */

export type RespostaAtividade = {
  /** Reflexão e situação: a alternativa marcada. */
  alternativaId: string | null;
  /** Ordenação: ids dos blocos, na ordem em que foram tocados. */
  blocos: string[];
};

export const RESPOSTA_VAZIA: RespostaAtividade = { alternativaId: null, blocos: [] };

/** A tentativa confere com o gabarito? Só faz sentido na ordenação. */
export function ordemConfere(atividade: RascunhoAtividade, resposta: RespostaAtividade): boolean {
  const correta = sequenciaCorreta(atividade.ordenacao);

  return (
    correta.length === resposta.blocos.length &&
    correta.every((id, indice) => resposta.blocos[indice] === id)
  );
}

export function respondeu(atividade: RascunhoAtividade, resposta: RespostaAtividade): boolean {
  return atividade.tipo === 'ordenacao' ? resposta.blocos.length > 0 : !!resposta.alternativaId;
}

/**
 * Embaralha de forma estável: a mesma atividade aparece sempre na mesma ordem
 * embaralhada. "Embaralhar apresentação, não gabarito" (`668:142`) — sem isto,
 * a lista sairia na ordem do cadastro, que é justamente a resposta.
 */
function embaralhar<T extends { id: string }>(itens: readonly T[]): T[] {
  const peso = (texto: string) =>
    [...texto].reduce((soma, letra) => (soma * 31 + letra.charCodeAt(0)) % 1_000_003, 7);

  return [...itens].sort((a, b) => peso(a.id) - peso(b.id));
}

/** Botão de voltar, tempo ou estado — o topo das telas do `66:2`. */
function Topo({ direita, aoVoltar }: { direita: string; aoVoltar?: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={styles.topo}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={aoVoltar}
        disabled={!aoVoltar}
        style={styles.voltar}>
        <Image
          source={require('@/assets/images/icones/voltar.svg')}
          style={styles.icone}
          tintColor={colors.text}
          accessible={false}
        />
      </Pressable>

      <Text variant="cardLabel" color="textAccent">
        {direita}
      </Text>
    </View>
  );
}

function Cabecalho({ tipo, titulo }: { tipo: string; titulo: string }) {
  return (
    <View style={styles.cabecalho}>
      <Text variant="cardLabel" color="textAccent">
        {tipo.toLocaleUpperCase('pt-BR')}
      </Text>
      <Text variant="headingLarge" accessibilityRole="header">
        {titulo.toLocaleUpperCase('pt-BR')}
      </Text>
    </View>
  );
}

function Cartao({
  rotulo,
  claro = false,
  children,
}: {
  rotulo: string;
  /** Fundo da superfície, com borda — o "Sua frase" da ordenação. */
  claro?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.cartao,
        { borderColor: colors.border, backgroundColor: claro ? colors.surface : colors.canvas },
      ]}>
      <Text variant="cardLabel" color="textAccent">
        {rotulo}
      </Text>
      {children}
    </View>
  );
}

/**
 * Opção de seleção única: check dourado na marcada, círculo nas outras (`263:15`).
 * Também é a da reflexão da aula (`61:7`): lá o Figma desenha checkbox, mas o
 * próprio componente diz "para escolha única, use Radio" (`353:6`).
 */
export function Opcao({
  texto,
  marcada,
  aoTocar,
  altura,
}: {
  texto: string;
  marcada: boolean;
  aoTocar: () => void;
  altura: number;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: marcada }}
      onPress={aoTocar}
      style={[
        styles.opcao,
        {
          minHeight: altura,
          borderColor: colors.border,
          backgroundColor: marcada ? colors.canvas : colors.surface,
        },
      ]}>
      <Text variant={marcada ? 'supportSemibold' : 'bodySmall'} style={styles.textoOpcao}>
        {texto}
      </Text>

      {marcada ? (
        <Image
          source={require('@/assets/images/icones/check.svg')}
          style={styles.check}
          tintColor={colors.gold}
          accessible={false}
        />
      ) : (
        <View style={[styles.radio, { borderColor: colors.text }]} />
      )}
    </Pressable>
  );
}

/** Tela de interação (`66:6`, `263:5`, `263:110`). */
export function InteracaoAtividade({
  atividade,
  resposta,
  aoResponder,
  aoConferir,
  aoVoltar,
  tentou = false,
}: {
  atividade: RascunhoAtividade;
  resposta: RespostaAtividade;
  aoResponder: (resposta: RespostaAtividade) => void;
  aoConferir?: () => void;
  aoVoltar?: () => void;
  /** Ordenação: a pessoa já conferiu esta montagem? Mostra a mensagem de nova tentativa. */
  tentou?: boolean;
}) {
  const { colors } = useTheme();
  const { tipo, ordenacao, escolha } = atividade;

  const blocos = useMemo(() => embaralhar(ordenacao.blocos), [ordenacao.blocos]);
  const alternativas = useMemo(() => embaralhar(escolha.alternativas), [escolha.alternativas]);

  const montada = resposta.blocos
    .map((id) => ordenacao.blocos.find((bloco) => bloco.id === id)?.texto ?? '')
    .filter(Boolean)
    .join(' ');

  const errou = tipo === 'ordenacao' && tentou && !ordemConfere(atividade, resposta);

  function alternarBloco(id: string) {
    const blocosMarcados = resposta.blocos.includes(id)
      ? resposta.blocos.filter((atual) => atual !== id)
      : [...resposta.blocos, id];

    aoResponder({ ...resposta, blocos: blocosMarcados });
  }

  const acao =
    tipo === 'ordenacao'
      ? 'CONFERIR PENSAMENTO'
      : tipo === 'reflexao'
        ? 'CONFERIR REFLEXÃO'
        : 'REFLETIR SOBRE A ESCOLHA';

  return (
    <View style={styles.tela}>
      <Topo direita={`${atividade.duracaoMinutos} MIN`} aoVoltar={aoVoltar} />

      <Cabecalho tipo={ROTULO_TIPO_ATIVIDADE[tipo]} titulo={atividade.titulo} />

      <Text variant="bodySmall" color="textSecondary">
        {atividade.instrucao}
      </Text>

      {tipo === 'ordenacao' ? (
        <>
          <Cartao rotulo="SUA FRASE" claro>
            <Text variant="optionTitle">
              {[ordenacao.fraseBase.trim(), montada].filter(Boolean).join(' ').toLocaleUpperCase('pt-BR')}
            </Text>
          </Cartao>

          {errou && ordenacao.mensagemTentativa.trim() ? (
            <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
              {ordenacao.mensagemTentativa}
            </Text>
          ) : null}

          <Text variant="cardLabel" color="textAccent">
            BLOCOS
          </Text>

          <View style={styles.lista}>
            {blocos.map((bloco) => {
              const usado = resposta.blocos.includes(bloco.id);

              return (
                <Pressable
                  key={bloco.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: usado }}
                  onPress={() => alternarBloco(bloco.id)}
                  style={[
                    styles.bloco,
                    {
                      borderColor: colors.border,
                      backgroundColor: usado ? colors.canvas : colors.surface,
                    },
                  ]}>
                  <Text variant="cardLabel">{bloco.texto.toLocaleUpperCase('pt-BR')}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Cartao rotulo={tipo === 'situacao' ? 'IMAGINE A SITUAÇÃO' : 'SITUAÇÃO'}>
            <Text variant="cardHeading">{escolha.situacao}</Text>
          </Cartao>

          {tipo === 'situacao' && escolha.mensagem ? (
            <View style={[styles.cartao, { borderColor: colors.border }]}>
              <Text variant="supportSemibold">{escolha.mensagem.remetente}</Text>
              {escolha.mensagem.identificador ? (
                <Text variant="bodySmall" color="textSecondary">
                  {escolha.mensagem.identificador}
                </Text>
              ) : null}
              <Text variant="bodySmall">{escolha.mensagem.corpo}</Text>
              {/* Texto inerte, nunca link: "nunca tornar o endereço suspeito clicável". */}
              {escolha.mensagem.endereco ? (
                <Text variant="bodySmall" color="textSecondary" selectable={false}>
                  {escolha.mensagem.endereco}
                </Text>
              ) : null}
              <Text variant="bodySmall" color="textSecondary">
                {escolha.mensagem.observacao}
              </Text>
            </View>
          ) : null}

          <Text variant="cardHeading">{escolha.pergunta}</Text>

          <View style={styles.lista}>
            {alternativas.map((alternativa) => (
              <Opcao
                key={alternativa.id}
                texto={alternativa.texto}
                marcada={resposta.alternativaId === alternativa.id}
                altura={tipo === 'situacao' ? 58 : 52}
                aoTocar={() => aoResponder({ ...resposta, alternativaId: alternativa.id })}
              />
            ))}
          </View>

          {escolha.modo === 'livre' ? (
            <Text variant="cardBody" color="textSecondary">
              Não existe pontuação. A proposta é observar sua intenção.
            </Text>
          ) : null}
        </>
      )}

      <View style={styles.rodape}>
        {/* "Botão só habilita após resposta" (`668:142`). */}
        <Button
          label={acao}
          disabled={!respondeu(atividade, resposta) || errou}
          onPress={aoConferir}
        />
      </View>
    </View>
  );
}

function devolutivaDa(
  atividade: RascunhoAtividade,
  alternativa: AlternativaAtividade | undefined,
): string {
  const { escolha } = atividade;

  if (escolha.modo === 'livre' && escolha.devolutivaLivre === 'comum') return escolha.devolutivaComum;

  return alternativa?.devolutiva ?? '';
}

/** Tela de conclusão (`262:3`, `263:95`, `263:131`). */
export function ConclusaoAtividade({
  atividade,
  resposta,
  aoRefazer,
  aoConcluir,
  aoVoltar,
}: {
  atividade: RascunhoAtividade;
  resposta: RespostaAtividade;
  aoRefazer?: () => void;
  aoConcluir?: () => void;
  aoVoltar?: () => void;
}) {
  const { tipo, escolha, conclusao } = atividade;

  const alternativa =
    escolha.alternativas.find((cada) => cada.id === resposta.alternativaId) ??
    // Sem escolha ainda, mostra o caminho da resposta orientadora (ou o
    // primeiro): a prévia precisa exibir uma conclusão inteira para revisão.
    escolha.alternativas.find((cada) => cada.id === escolha.respostaId) ??
    escolha.alternativas[0];

  const devolutiva = devolutivaDa(atividade, alternativa);
  const livre = tipo !== 'ordenacao' && escolha.modo === 'livre';

  return (
    <View style={styles.tela}>
      <Topo direita="CONCLUÍDO" aoVoltar={aoVoltar} />

      <Cabecalho tipo={ROTULO_TIPO_ATIVIDADE[tipo]} titulo={conclusao.titulo} />

      {tipo === 'ordenacao' ? (
        <>
          <Cartao rotulo="IDEIA RECONSTRUÍDA">
            <Text variant="cardQuote">
              {conclusao.texto ? `“${conclusao.texto}”` : ''}
            </Text>
          </Cartao>

          <Text variant="bodySmall">{atividade.ordenacao.explicacao}</Text>
        </>
      ) : (
        <>
          <Cartao rotulo="LEVE COM VOCÊ">
            <Text variant="cardHeading">{conclusao.texto}</Text>
          </Cartao>

          <Text variant="bodySmall">{devolutiva}</Text>

          {livre ? (
            <Text variant="cardBody" color="textSecondary">
              Sua escolha não vale pontos e não será comparada com a de outras pessoas.
            </Text>
          ) : null}
        </>
      )}

      <View style={styles.rodape}>
        {tipo === 'situacao' ? (
          <Button label="REVER ESCOLHA" type="secondary" onPress={aoRefazer} />
        ) : (
          <Pressable accessibilityRole="button" onPress={aoRefazer} style={styles.refazer}>
            <Text variant="cardLabel" color="wine">
              REFAZER EXERCÍCIO
            </Text>
          </Pressable>
        )}

        <Button label="CONCLUIR ATIVIDADE" onPress={aoConcluir} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    gap: spacing.lg,
    flexGrow: 1,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  icone: {
    width: 24,
    height: 24,
  },
  cabecalho: {
    gap: spacing.md,
  },
  cartao: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  lista: {
    gap: spacing.md,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  textoOpcao: {
    flex: 1,
  },
  check: {
    width: 20,
    height: 20,
  },
  radio: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  bloco: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  rodape: {
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
    gap: spacing.lg,
  },
  refazer: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
