import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CampoTexto } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/estados';
import { BotaoVoltar } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Retrato } from '@/components/admin/retrato';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { criarFilosofo, salvarFilosofo } from '@/lib/admin/repositorio';
import {
  filosofoVazio,
  pendenciasDoFilosofo,
  type RascunhoFilosofo,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { spacing } from '@/theme';

type Gravacao = { estado: 'ocioso' } | { estado: 'salvando' } | { estado: 'erro'; mensagem: string };

/** Telas `643:948` (editar) e `643:1215` (novo) — o mesmo formulário. */
export default function AdminFilosofoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { filosofos, carregando, erro } = useFilosofos();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoFilosofo>(filosofoVazio);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [tocado, setTocado] = useState(false);
  const hidratado = useRef(false);

  const existente = criando ? null : filosofos.find((filosofo) => filosofo.id === id);

  // Só a primeira leitura preenche o formulário: depois disso, uma atualização
  // vinda do servidor não pode apagar o que a pessoa está escrevendo.
  useEffect(() => {
    if (criando || hidratado.current || !existente) return;

    hidratado.current = true;
    setRascunho({ nome: existente.nome, biografia: existente.biografia });
  }, [criando, existente]);

  const pendencias = pendenciasDoFilosofo(rascunho);
  const salvando = gravacao.estado === 'salvando';

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
        mensagem: falha instanceof Error ? falha.message : 'Não foi possível salvar.',
      });
    }
  }

  if (!criando && carregando) {
    return (
      <PaginaAdmin
        titulo="EDITAR FILÓSOFO"
        topo={<BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />}>
        <Carregando rotulo="Carregando o cadastro…" />
      </PaginaAdmin>
    );
  }

  if (!criando && !existente) {
    return (
      <PaginaAdmin
        titulo="EDITAR FILÓSOFO"
        topo={<BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />}>
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
          : `${existente?.nome ?? ''} • Identidade usada nos cards e na página do filósofo.`
      }
      topo={<BotaoVoltar rotulo="← FILÓSOFOS" aoVoltar={() => router.replace('/admin/filosofos')} />}
      nota="A foto é opcional. Sem imagem, o app exibe a inicial do nome.">
      <CaixaSecao titulo="01 · FOTO DO FILÓSOFO" espacamento="sm">
        <Retrato nome={rascunho.nome} tamanho={160} />

        {/*
          O contrato `643:1269` pede upload de PNG/JPG/WebP validado no servidor.
          O projeto ainda não tem Cloud Storage habilitado, então a tela mostra o
          que vale hoje em vez de um botão que não leva a lugar nenhum.
        */}
        <Text color="textSecondary">
          O envio de foto ainda não está disponível: depende do Cloud Storage, que não está
          habilitado neste projeto. Até lá, o app mostra a inicial do nome.
        </Text>
      </CaixaSecao>

      <CaixaSecao titulo="02 · DADOS DO FILÓSOFO" espacamento="sm">
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

        {criando ? (
          <Text color="textSecondary">
            O identificador vem do nome e não muda depois. É ele que cada conteúdo guarda como
            autor.
          </Text>
        ) : null}
      </CaixaSecao>

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

const styles = StyleSheet.create({
  acao: {
    paddingHorizontal: spacing['2xl'],
  },
});
