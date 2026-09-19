import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/Estados';
import { BotaoVoltar } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import {
  criarRecurso,
  mensagemDeErro,
  observarRecurso,
  salvarRecurso,
} from '@/lib/admin/repositorio';
import {
  errosDoRecurso,
  paraRascunhoDeRecurso,
  recursoVazio,
  type RascunhoRecurso,
  type TipoRecurso,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

const OPCOES_AFILIADO = [
  { id: 'nao', nome: 'Não' },
  { id: 'sim', nome: 'Sim' },
] as const;

/**
 * Textos dos dois formulários, copiados do Figma: `668:203` (vídeo) e
 * `779:143` (livro). Os dois só diferem nisto e nos campos exclusivos do livro.
 */
const TEXTOS: Record<
  TipoRecurso,
  {
    titulo: string;
    apoio: string;
    trocar: string;
    rotuloTitulo: string;
    exemploTitulo: string;
    rotuloCriador: string;
    exemploCriador: string;
    rotuloUrl: string;
    exemploUrl: string;
    nota: string;
  }
> = {
  video: {
    titulo: 'BIBLIOTECA / CADASTRAR VÍDEO',
    apoio: 'Cole o link do YouTube. Confira a reprodução incorporada na prévia antes de publicar.',
    trocar: 'CADASTRAR LIVRO',
    rotuloTitulo: 'Título do vídeo *',
    exemploTitulo: 'Digite o título do vídeo',
    rotuloCriador: 'Nome do canal ou criador *',
    exemploCriador: 'Digite o nome do canal',
    rotuloUrl: 'Link do YouTube *',
    exemploUrl: 'https://www.youtube.com/watch?v=…',
    nota: 'O vídeo publicado aparece em Todos e Vídeos, com player oficial do YouTube dentro do detalhe. Validar a reprodução na prévia do admin. Se não carregar, oferecer Abrir no YouTube. Sem upload ou Cloud Storage.',
  },
  livro: {
    titulo: 'BIBLIOTECA / CADASTRAR LIVRO',
    apoio: 'Cadastre o livro e seu link de compra. Indique se é um link de afiliado.',
    trocar: 'CADASTRAR VÍDEO',
    rotuloTitulo: 'Título do livro *',
    exemploTitulo: 'Digite o título do livro',
    rotuloCriador: 'Autor do livro *',
    exemploCriador: 'Digite o nome do autor',
    rotuloUrl: 'Link da loja *',
    exemploUrl: 'Cole o link HTTPS de compra, com seu código de afiliado quando aplicável',
    nota: 'Publicado aparece em Todos e Livros. Se Link de afiliado = Sim, mostrar o aviso de comissão antes do botão. Preço e disponibilidade ficam na loja.',
  },
};

type Gravacao =
  | { estado: 'ocioso' }
  | { estado: 'salvando' }
  | { estado: 'salvo' }
  | { estado: 'erro'; mensagem: string };

/**
 * Cadastro de recurso da Biblioteca — vídeo do YouTube ou livro.
 *
 * O mesmo formulário cria e edita, como o de conteúdo. A trava de conflito e
 * a gravação seguem `admin/conteudo/[id].tsx`; o que muda é a validação, que
 * aqui aparece campo a campo ("publicar lista erros por campo", `668:121`).
 */
export default function AdminRecursoScreen() {
  const router = useRouter();
  const { id, tipo } = useLocalSearchParams<{ id: string; tipo?: string }>();
  const { user } = useAuth();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoRecurso>(() =>
    recursoVazio(tipo === 'livro' ? 'livro' : 'video'),
  );
  const [carregando, setCarregando] = useState(!criando);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [conflito, setConflito] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  /** Os erros por campo só aparecem depois de pedir a revisão, não enquanto se digita. */
  const [mostrarErros, setMostrarErros] = useState(false);

  const versaoCarregada = useRef(0);
  const hidratado = useRef(false);
  const [idAtual, setIdAtual] = useState(criando ? null : id);

  useEffect(() => {
    if (!idAtual) return;

    return observarRecurso(
      idAtual,
      (recurso) => {
        setCarregando(false);

        if (!recurso) {
          setErroDeCarga('Este recurso não existe mais.');
          return;
        }

        // Só a primeira leitura preenche o formulário; depois, versão nova do
        // servidor vira aviso de conflito em vez de apagar o que se digita.
        if (!hidratado.current) {
          hidratado.current = true;
          versaoCarregada.current = recurso.versao;
          setRascunho(paraRascunhoDeRecurso(recurso));
          return;
        }

        if (recurso.versao !== versaoCarregada.current) {
          setConflito(true);
        }
      },
      (falha) => {
        setCarregando(false);
        setErroDeCarga(falha.message);
      },
    );
  }, [idAtual, tentativa]);

  function alterar<C extends keyof RascunhoRecurso>(campo: C, valor: RascunhoRecurso[C]) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setGravacao({ estado: 'ocioso' });
  }

  async function gravar(): Promise<string | null> {
    if (gravacao.estado === 'salvando') return null;
    if (!user) {
      setGravacao({ estado: 'erro', mensagem: 'Sessão expirada.' });
      return null;
    }

    setGravacao({ estado: 'salvando' });

    try {
      if (!idAtual) {
        const novoId = await criarRecurso(rascunho, user.uid);
        versaoCarregada.current = 1;
        hidratado.current = true;
        setIdAtual(novoId);
        // Sem isto, recarregar a página abriria outro formulário em branco e o
        // próximo salvamento criaria um segundo documento (ver o editor de
        // conteúdo, onde isso aconteceu).
        router.replace(`/admin/biblioteca/${novoId}`);
        setGravacao({ estado: 'salvo' });
        return novoId;
      }

      versaoCarregada.current = await salvarRecurso(
        idAtual,
        rascunho,
        versaoCarregada.current,
        user.uid,
      );
      setConflito(false);
      setGravacao({ estado: 'salvo' });
      return idAtual;
    } catch (falha) {
      // Falha não limpa o formulário: o rascunho fica na tela para nova tentativa.
      setGravacao({ estado: 'erro', mensagem: mensagemDeErro(falha, 'Não foi possível salvar.') });
      return null;
    }
  }

  async function revisar() {
    setMostrarErros(true);
    if (Object.keys(errosDoRecurso(rascunho)).length > 0) return;

    const salvo = await gravar();
    if (salvo) router.push(`/admin/biblioteca/revisar/${salvo}`);
  }

  /** Trocar de formulário só antes da primeira gravação: tipo gravado não muda. */
  function trocarTipo() {
    alterar('tipo', rascunho.tipo === 'video' ? 'livro' : 'video');
    setMostrarErros(false);
  }

  const textos = TEXTOS[rascunho.tipo];
  const erros = mostrarErros ? errosDoRecurso(rascunho) : {};
  const livro = rascunho.tipo === 'livro';

  const voltar = (
    <BotaoVoltar rotulo="← BIBLIOTECA" aoVoltar={() => router.replace('/admin/biblioteca')} />
  );

  if (carregando) {
    return (
      <PaginaAdmin titulo={textos.titulo} topo={voltar}>
        <Carregando rotulo="Carregando o recurso…" />
      </PaginaAdmin>
    );
  }

  if (erroDeCarga) {
    return (
      <PaginaAdmin titulo={textos.titulo} topo={voltar}>
        <ErroRecuperavel
          mensagem={erroDeCarga}
          aoTentarDeNovo={() => {
            setErroDeCarga(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  return (
    <PaginaAdmin titulo={textos.titulo} apoio={textos.apoio} topo={voltar} nota={textos.nota}>
      {idAtual ? null : (
        <Button
          label={textos.trocar}
          type="secondary"
          size="medium"
          onPress={trocarTipo}
          style={styles.trocar}
        />
      )}

      {conflito ? (
        <ErroRecuperavel
          mensagem="Este recurso mudou em outro lugar desde que você abriu. Recarregue antes de salvar, ou você vai gravar por cima do trabalho de outra pessoa."
          aoTentarDeNovo={() => {
            hidratado.current = false;
            setConflito(false);
            setTentativa((n) => n + 1);
          }}
        />
      ) : null}

      <CaixaSecao titulo="01 · IDENTIFICAÇÃO">
        <CampoTexto
          rotulo={textos.rotuloTitulo}
          placeholder={textos.exemploTitulo}
          value={rascunho.titulo}
          onChangeText={(valor) => alterar('titulo', valor)}
          erro={erros.titulo}
        />

        <CampoTexto
          rotulo={textos.rotuloCriador}
          placeholder={textos.exemploCriador}
          value={rascunho.criador}
          onChangeText={(valor) => alterar('criador', valor)}
          erro={erros.criador}
        />
      </CaixaSecao>

      <CaixaSecao titulo="02 · ORIGEM">
        <CampoTexto
          rotulo={textos.rotuloUrl}
          placeholder={textos.exemploUrl}
          value={rascunho.url}
          onChangeText={(valor) => alterar('url', valor)}
          erro={erros.url}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputMode="url"
        />

        {livro ? (
          <>
            <CampoTexto
              rotulo="Edição ou tradução (opcional)"
              placeholder="Informe a edição ou tradução recomendada"
              value={rascunho.edicao}
              onChangeText={(valor) => alterar('edicao', valor)}
            />

            <CampoSelecao
              rotulo="Link de afiliado? *"
              opcoes={OPCOES_AFILIADO}
              valor={rascunho.afiliado ? 'sim' : 'nao'}
              aoEscolher={(valor) => alterar('afiliado', valor === 'sim')}
            />
          </>
        ) : null}
      </CaixaSecao>

      <CaixaSecao titulo="03 · CURADORIA">
        <CampoTexto
          rotulo="Por que recomendamos *"
          placeholder="Este conteúdo ajuda a distinguir convicção de certeza e a examinar nossas escolhas."
          value={rascunho.recomendacao}
          onChangeText={(valor) => alterar('recomendacao', valor)}
          erro={erros.recomendacao}
          linhas={3}
        />
      </CaixaSecao>

      {gravacao.estado === 'erro' ? <Aviso mensagem={gravacao.mensagem} tom="erro" /> : null}
      {gravacao.estado === 'salvo' ? <Aviso mensagem="Rascunho salvo." /> : null}

      <Linha>
        <Button
          label={gravacao.estado === 'salvando' ? 'Salvando…' : 'SALVAR RASCUNHO'}
          type="secondary"
          size="medium"
          disabled={gravacao.estado === 'salvando'}
          onPress={gravar}
          style={styles.salvar}
        />

        <Button
          label="REVISAR PUBLICAÇÃO"
          size="medium"
          disabled={gravacao.estado === 'salvando'}
          onPress={revisar}
          style={styles.revisar}
        />
      </Linha>
    </PaginaAdmin>
  );
}

// Larguras do Figma: 320 para a troca de formulário, 280 e 320 para as ações.
const styles = StyleSheet.create({
  trocar: {
    alignSelf: 'flex-start',
    width: 320,
    maxWidth: '100%',
  },
  salvar: {
    width: 280,
    maxWidth: '100%',
    paddingHorizontal: spacing.lg,
  },
  revisar: {
    width: 320,
    maxWidth: '100%',
    paddingHorizontal: spacing.lg,
  },
});
