import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/campos';
import { Carregando, ErroRecuperavel, Vazio } from '@/components/admin/estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { nomeDoFilosofo, nomesDosTemas } from '@/lib/admin/acervo';
import { observarConteudos } from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  NIVEIS,
  niveisPreenchidos,
  type Conteudo,
} from '@/lib/admin/tipos';
import { spacing } from '@/theme';

/** Casa uma busca livre com título, filósofo e temas do conteúdo (nó `596:21`). */
function combina(conteudo: Conteudo, termo: string): boolean {
  if (!termo) return true;

  const alvo = [
    conteudo.titulo,
    nomeDoFilosofo(conteudo.autorId),
    nomesDosTemas(conteudo.temaIds),
  ]
    .join(' ')
    .toLocaleLowerCase('pt-BR');

  return alvo.includes(termo.toLocaleLowerCase('pt-BR').trim());
}

export default function AdminConteudosScreen() {
  const router = useRouter();

  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () => observarConteudos(setConteudos, (falha) => setErro(falha.message)),
    [tentativa],
  );

  const filtrados = useMemo(
    () => (conteudos ?? []).filter((conteudo) => combina(conteudo, busca)),
    [conteudos, busca],
  );

  return (
    <PaginaAdmin
      titulo="CONTEÚDOS"
      apoio="Um cadastro. Todos os caminhos do PAUSA."
      topo={<EtiquetaAdmin />}
      nota="O mesmo formulário é usado para criar e editar.">
      <NavegacaoAdmin atual="conteudos" />

      <Linha>
        <View style={styles.busca}>
          <CampoTexto
            rotulo="Buscar"
            placeholder="Buscar por título, filósofo ou tema…"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Button
          label="NOVO CONTEÚDO"
          size="medium"
          onPress={() => router.push('/admin/conteudo/novo')}
          style={styles.novo}
        />
      </Linha>

      <CaixaSecao>
        <View style={styles.linhaCabecalho}>
          <Text variant="supportSemibold" style={styles.colTitulo}>
            TÍTULO / AUTOR
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            NÍVEIS
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            COTIDIANO
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            STATUS
          </Text>
          <View style={styles.colAcao} />
        </View>

        {erro ? (
          <ErroRecuperavel mensagem={erro} aoTentarDeNovo={() => {
              setErro(null);
              setTentativa((n) => n + 1);
            }} />
        ) : conteudos === null ? (
          <Carregando rotulo="Carregando o catálogo…" />
        ) : conteudos.length === 0 ? (
          <Vazio
            titulo="Nenhum conteúdo cadastrado ainda."
            apoio="Comece por “Novo conteúdo”."
          />
        ) : filtrados.length === 0 ? (
          <Vazio titulo="Nenhum conteúdo corresponde à busca." apoio={`Termo: “${busca}”`} />
        ) : (
          filtrados.map((conteudo) => (
            <LinhaConteudo
              key={conteudo.id}
              conteudo={conteudo}
              aoEditar={() => router.push(`/admin/conteudo/${conteudo.id}`)}
            />
          ))
        )}
      </CaixaSecao>
    </PaginaAdmin>
  );
}

function LinhaConteudo({ conteudo, aoEditar }: { conteudo: Conteudo; aoEditar: () => void }) {
  const preenchidos = niveisPreenchidos(conteudo.textos).length;

  return (
    <View style={styles.linhaConteudo}>
      <Text style={styles.colTitulo}>
        {conteudo.titulo || 'Sem título'} · {nomeDoFilosofo(conteudo.autorId)}
      </Text>

      <Text style={styles.colCurta}>
        {preenchidos} de {NIVEIS.length}
      </Text>

      <Text style={styles.colCurta}>
        {aplicacaoVinculada(conteudo.aplicacao) ? 'Vinculado' : 'Não vinculado'}
      </Text>

      <Text style={styles.colCurta}>
        {conteudo.status === 'publicado' ? 'Publicado' : 'Rascunho'}
      </Text>

      <Button
        label="EDITAR"
        type="secondary"
        size="medium"
        onPress={aoEditar}
        style={styles.colAcao}
        accessibilityLabel={`Editar ${conteudo.titulo || 'conteúdo sem título'}`}
      />
    </View>
  );
}

// Larguras proporcionais: a tabela do Figma é alinhada por espaços num texto só,
// o que não sobrevive a fonte variável — aqui vira colunas de verdade.
const styles = StyleSheet.create({
  busca: {
    flexGrow: 1,
    flexBasis: 420,
  },
  novo: {
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing['2xl'],
  },
  linhaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  linhaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 48,
  },
  colTitulo: {
    flex: 3,
  },
  colCurta: {
    flex: 1,
  },
  colAcao: {
    width: 140,
  },
});
