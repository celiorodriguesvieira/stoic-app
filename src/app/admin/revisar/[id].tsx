import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/estados';
import { BotaoVoltar } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { mensagemDeErro, observarConteudo, publicarConteudo } from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  MAX_FRASE_DESTAQUE,
  MIN_FRASE_DESTAQUE,
  NIVEIS,
  nivelCompleto,
  pendenciasParaPublicar,
  ROTULO_NIVEL,
  type Conteudo,
  type Nivel,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { radius, spacing } from '@/theme';

/** Largura do template de prévia no Figma (`599:107`) — a tela do app. */
const LARGURA_PREVIA = 390;

type Publicacao =
  | { estado: 'ocioso' }
  | { estado: 'publicando' }
  | { estado: 'erro'; mensagem: string };

export default function AdminRevisarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nivel, setNivel] = useState<Nivel>('leigo');
  const [publicacao, setPublicacao] = useState<Publicacao>({ estado: 'ocioso' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      observarConteudo(
        id,
        (encontrado) => {
          setCarregando(false);

          if (!encontrado) {
            setErro('Este conteúdo não existe mais.');
            return;
          }

          setConteudo(encontrado);
        },
        (falha) => {
          setCarregando(false);
          setErro(falha.message);
        },
      ),
    [id, tentativa],
  );

  async function publicar() {
    if (!conteudo || !user || publicacao.estado === 'publicando') return;

    setPublicacao({ estado: 'publicando' });

    try {
      await publicarConteudo(conteudo.id, conteudo.versao, user.uid);
      // Sucesso: volta à lista, onde o status já aparece como Publicado.
      router.replace('/admin');
    } catch (falha) {
      // O rascunho continua intacto — nada é apagado numa falha de publicação.
      setPublicacao({
        estado: 'erro',
        mensagem: mensagemDeErro(falha, 'Não foi possível publicar.'),
      });
    }
  }

  // O botão volta para o editor do tipo certo. Enquanto a leitura não chegou,
  // o destino é o catálogo — nunca um editor que apagaria o outro registro.
  const topo = (
    <BotaoVoltar
      rotulo={conteudo?.tipo === 'aula' ? '← AULA' : '← EDITOR'}
      aoVoltar={() =>
        router.replace(
          conteudo === null
            ? '/admin'
            : conteudo.tipo === 'aula'
              ? `/admin/aula/${conteudo.id}`
              : `/admin/conteudo/${conteudo.id}`,
        )
      }
    />
  );

  if (carregando) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <Carregando rotulo="Carregando a prévia…" />
      </PaginaAdmin>
    );
  }

  if (erro || !conteudo) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <ErroRecuperavel
          mensagem={erro ?? 'Conteúdo indisponível.'}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  const pendencias = pendenciasParaPublicar(conteudo);

  return (
    <PaginaAdmin
      titulo="REVISAR E PUBLICAR"
      apoio={`Conferir as quatro versões antes de publicar. Vendo o nível ${ROTULO_NIVEL[nivel]}.`}
      topo={topo}
      nota="Após publicar, o conteúdo volta à lista com status Publicado. Numa falha, o rascunho é preservado e a tentativa pode ser repetida.">
      <Linha>
        {NIVEIS.map((cada) => (
          <Button
            key={cada}
            label={ROTULO_NIVEL[cada].toLocaleUpperCase('pt-BR')}
            size="medium"
            type={cada === nivel ? 'primary' : 'secondary'}
            onPress={() => setNivel(cada)}
            style={styles.pilulaNivel}
            accessibilityState={{ selected: cada === nivel }}
          />
        ))}
      </Linha>

      <Linha>
        {conteudo.tipo === 'aula' ? (
          <PreviaDaAula conteudo={conteudo} nivel={nivel} />
        ) : (
          <Previa conteudo={conteudo} nivel={nivel} />
        )}

        <View style={styles.checklist}>
          <CaixaSecao titulo="CHECKLIST DE PUBLICAÇÃO">
            {conteudo.tipo === 'aula' ? (
              <>
                <Item
                  ok={!!conteudo.autorId && conteudo.temaIds.length > 0}
                  rotulo="Filósofo principal e temas"
                />

                <Item
                  ok={
                    conteudo.aula.fraseDestaque.trim().length >= MIN_FRASE_DESTAQUE &&
                    conteudo.aula.fraseDestaque.trim().length <= MAX_FRASE_DESTAQUE
                  }
                  rotulo={`Frase do card (${MIN_FRASE_DESTAQUE}–${MAX_FRASE_DESTAQUE} caracteres)`}
                />

                <Item ok={conteudo.aula.duracaoMinutos > 0} rotulo="Duração estimada" />

                {NIVEIS.map((cada) => (
                  <Item
                    key={cada}
                    ok={nivelCompleto(conteudo.aula.etapas[cada])}
                    rotulo={`${ROTULO_NIVEL[cada]}: quatro etapas`}
                  />
                ))}

                <Text variant="supportSemibold">
                  Publicar deixa a aula disponível para ser programada. Ela só aparece na Home
                  quando entrar numa edição da Programação semanal.
                </Text>
              </>
            ) : (
              <>
                <Item
                  ok={!!conteudo.autorId && conteudo.temaIds.length > 0 && !!conteudo.fonte.trim()}
                  rotulo="Autor, temas e fonte"
                />

                {NIVEIS.map((cada) => (
                  <Item
                    key={cada}
                    ok={conteudo.textos[cada].trim().length > 0}
                    rotulo={ROTULO_NIVEL[cada]}
                  />
                ))}

                <Item
                  ok={aplicacaoVinculada(conteudo.aplicacao)}
                  rotulo="Aplicação cotidiana vinculada"
                />

                <Text variant="supportSemibold">
                  Ao publicar, o conteúdo fica disponível em Explorar e na página do filósofo. A
                  aplicação prática aparece também em Filosofia no Cotidiano, sem cópias.
                </Text>
              </>
            )}

            {publicacao.estado === 'erro' ? (
              <Aviso mensagem={publicacao.mensagem} tom="erro" />
            ) : null}

            {pendencias.length > 0 ? (
              <Aviso mensagem={`Bloqueado: ${pendencias.join(' ')}`} tom="erro" />
            ) : null}

            <Button
              label={publicacao.estado === 'publicando' ? 'Publicando…' : 'PUBLICAR CONTEÚDO'}
              size="medium"
              disabled={publicacao.estado === 'publicando' || pendencias.length > 0}
              onPress={publicar}
              style={styles.publicar}
            />
          </CaixaSecao>
        </View>
      </Linha>
    </PaginaAdmin>
  );
}

function Item({ ok, rotulo }: { ok: boolean; rotulo: string }) {
  return (
    <Text
      variant="supportSemibold"
      color={ok ? 'text' : 'textSecondary'}
      accessibilityLabel={`${rotulo}: ${ok ? 'pronto' : 'pendente'}`}>
      {ok ? '✓' : '○'} {rotulo}
    </Text>
  );
}


/**
 * A aula como a pessoa vai percorrer: as quatro etapas em sequência.
 *
 * É a mesma ordem do app (`61:6` a `61:9`) porque revisar fora de ordem não
 * mostraria o que a revisão precisa mostrar — se a conclusão responde à
 * reflexão que veio antes.
 */
function PreviaDaAula({ conteudo, nivel }: { conteudo: Conteudo; nivel: Nivel }) {
  const { nomeDoFilosofo } = useFilosofos();

  const etapas = conteudo.aula.etapas[nivel];
  const escritas = etapas.opcoes.filter((opcao) => opcao.texto.trim());

  return (
    <View style={styles.previa}>
      <CaixaSecao espacamento="lg">
        <Text variant="labelMetadata" color="textSecondary">
          CONHECIMENTO DA SEMANA
        </Text>

        <Text variant="cardHeading">
          {conteudo.aula.fraseDestaque || 'Sem frase de destaque.'}
        </Text>

        <Text variant="labelMetadata" color="textSecondary">
          {nomeDoFilosofo(conteudo.autorId).toLocaleUpperCase('pt-BR')}
        </Text>

        <View style={styles.divisor} />

        <Text variant="headingMedium">{conteudo.titulo || 'Sem título'}</Text>

        <Etapa numero={1} nome="Conteúdo">
          <Texto valor={etapas.introducao} falta="Sem introdução ainda." />
          <Texto valor={etapas.explicacao} falta="Sem explicação ainda." />
          <Text variant="citationSource" color="textSecondary">
            {etapas.fonte || 'Sem referência da fonte'}
          </Text>
        </Etapa>

        <Etapa numero={2} nome="Reflexão">
          <Texto valor={etapas.pergunta} falta="Sem pergunta ainda." />

          {escritas.length > 0 ? (
            escritas.map((opcao) => (
              <Text key={opcao.id} color="textSecondary">
                ○ {opcao.texto}
              </Text>
            ))
          ) : (
            <Text color="textSecondary">Sem opções escritas ainda.</Text>
          )}

          <Texto valor={etapas.orientacao} falta="Sem orientação ainda." />
        </Etapa>

        <Etapa numero={3} nome="Aplicação">
          <Texto valor={etapas.pratica} falta="Sem prática ainda." />
        </Etapa>

        <Etapa numero={4} nome="Conclusão">
          <Texto valor={etapas.sintese} falta="Sem síntese ainda." />
          <Text variant="cardHeading">
            {etapas.leveComVoce || 'Sem a frase “Leve com você”.'}
          </Text>
        </Etapa>
      </CaixaSecao>
    </View>
  );
}

function Etapa({
  numero,
  nome,
  children,
}: {
  numero: number;
  nome: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.etapa}>
      <Text variant="labelMetadata" color="textSecondary">
        {nome.toLocaleUpperCase('pt-BR')}
      </Text>
      {children}
    </View>
  );
}

/** Texto da prévia, ou o aviso de que ele ainda não existe. */
function Texto({ valor, falta }: { valor: string; falta: string }) {
  const escrito = valor.trim();

  return <Text color={escrito ? 'text' : 'textSecondary'}>{escrito || falta}</Text>;
}

/** Como o conteúdo vai aparecer no app, no nível escolhido. */
function Previa({ conteudo, nivel }: { conteudo: Conteudo; nivel: Nivel }) {
  // O acervo é lido aqui, e não recebido por propriedade, porque a prévia é a
  // única parte desta tela que precisa do nome do autor.
  const { nomeDoFilosofo } = useFilosofos();

  const texto = conteudo.textos[nivel].trim();
  const aplicacao = conteudo.aplicacao.textos[nivel].trim();

  return (
    <View style={styles.previa}>
      <CaixaSecao espacamento="lg">
        <Text variant="labelMetadata" color="textSecondary">
          {nomeDoFilosofo(conteudo.autorId).toLocaleUpperCase('pt-BR')}
        </Text>

        <Text variant="headingMedium">{conteudo.titulo || 'Sem título'}</Text>

        <Text color={texto ? 'text' : 'textSecondary'}>
          {texto || `Sem texto para ${ROTULO_NIVEL[nivel]} ainda.`}
        </Text>

        <View style={styles.divisor} />

        <Text variant="labelMetadata" color="textSecondary">
          FILOSOFIA NO COTIDIANO
        </Text>

        <Text variant="cardHeading">
          {conteudo.aplicacao.titulo || 'Aplicação sem título'}
        </Text>

        <Text color={aplicacao ? 'text' : 'textSecondary'}>
          {aplicacao || `Sem aplicação para ${ROTULO_NIVEL[nivel]} ainda.`}
        </Text>

        <Text variant="citationSource" color="textSecondary">
          {conteudo.fonte || 'Sem fonte informada.'}
        </Text>
      </CaixaSecao>
    </View>
  );
}

const styles = StyleSheet.create({
  pilulaNivel: {
    flexGrow: 1,
    flexBasis: 160,
  },
  etapa: {
    gap: spacing.sm,
  },
  previa: {
    width: LARGURA_PREVIA,
    flexGrow: 0,
  },
  checklist: {
    flexGrow: 1,
    flexBasis: 420,
  },
  publicar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3xl'],
  },
  divisor: {
    height: 1,
    opacity: 0.2,
    backgroundColor: '#000',
    borderRadius: radius.sm,
  },
});
