import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/Estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Retrato } from '@/components/admin/Retrato';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { mensagemDeErro, semearFilosofos } from '@/lib/admin/repositorio';
import { type Filosofo } from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { retratoDoAcervo } from '@/lib/retratos';
import { spacing } from '@/theme';

/** Tela `643:947`. Um cadastro só para nome, foto e biografia. */
export default function AdminFilosofosScreen() {
  const router = useRouter();
  const { filosofos, carregando, erro, nomeDoFilosofo } = useFilosofos();

  const [busca, setBusca] = useState('');
  const [semeando, setSemeando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return filosofos;

    return filosofos.filter((filosofo) =>
      filosofo.nome.toLocaleLowerCase('pt-BR').includes(termo),
    );
  }, [filosofos, busca]);

  async function importarSemente() {
    setSemeando(true);
    setFalhou(false);

    try {
      const novos = await semearFilosofos();
      setAviso(
        novos === 0
          ? 'Nada a importar: todos já estavam cadastrados.'
          : `${novos} ${novos === 1 ? 'filósofo importado' : 'filósofos importados'}.`,
      );
    } catch (falha) {
      setAviso(mensagemDeErro(falha, 'Não foi possível importar.'));
      setFalhou(true);
    } finally {
      setSemeando(false);
    }
  }

  return (
    <PaginaAdmin
      titulo="FILÓSOFOS"
      apoio="Consulte os filósofos e retratos disponíveis na biblioteca."
      topo={<EtiquetaAdmin />}
      nota="Ao escolher um filósofo no conteúdo, nome e retrato são preenchidos automaticamente.">
      <NavegacaoAdmin atual="filosofos" />

      <Linha>
        <Button
          label="NOVO FILÓSOFO"
          size="medium"
          onPress={() => router.push('/admin/filosofos/novo')}
          style={styles.acaoTopo}
        />

        {/*
          Os seis filósofos viveram no código até 2026-09-15. Num banco vazio,
          importá-los é o caminho para não recadastrar à mão o que os conteúdos
          já referenciam por id.
        */}
        {!carregando && filosofos.length === 0 ? (
          <Button
            label={semeando ? 'IMPORTANDO…' : 'IMPORTAR OS SEIS DO CÓDIGO'}
            type="secondary"
            size="medium"
            disabled={semeando}
            onPress={importarSemente}
            style={styles.acaoTopo}
          />
        ) : null}
      </Linha>

      {aviso ? <Aviso mensagem={aviso} tom={falhou ? 'erro' : 'neutro'} /> : null}

      <CampoTexto
        rotulo="Buscar filósofo"
        placeholder="Buscar por nome…"
        value={busca}
        onChangeText={setBusca}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <CaixaSecao>
        {erro ? (
          <ErroRecuperavel mensagem={erro} />
        ) : carregando ? (
          <Carregando rotulo="Carregando o acervo…" />
        ) : filosofos.length === 0 ? (
          <Vazio
            titulo="Nenhum filósofo cadastrado ainda."
            apoio="Comece por “Novo filósofo” ou importe os seis que estavam no código."
          />
        ) : filtrados.length === 0 ? (
          <Vazio titulo="Nenhum filósofo corresponde à busca." apoio={`Termo: “${busca}”`} />
        ) : (
          filtrados.map((filosofo) => (
            <LinhaFilosofo
              key={filosofo.id}
              filosofo={filosofo}
              aoEditar={() => router.push(`/admin/filosofos/${filosofo.id}`)}
              nome={nomeDoFilosofo(filosofo.id)}
            />
          ))
        )}
      </CaixaSecao>
    </PaginaAdmin>
  );
}

function LinhaFilosofo({
  filosofo,
  nome,
  aoEditar,
}: {
  filosofo: Filosofo;
  nome: string;
  aoEditar: () => void;
}) {
  return (
    <View style={styles.linha}>
      <Retrato nome={nome} retratoId={filosofo.portraitAssetId} />

      <View style={styles.identidade}>
        <Text>{nome}</Text>
        <Text color="textSecondary">
          {retratoDoAcervo(filosofo.portraitAssetId)?.nome ?? 'Sem retrato'}
          {filosofo.biografia.trim() ? '' : ', sem biografia'}
        </Text>
      </View>

      <Button
        label="EDITAR"
        type="secondary"
        size="medium"
        onPress={aoEditar}
        style={styles.acao}
        accessibilityLabel={`Editar ${nome}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  acaoTopo: {
    paddingHorizontal: spacing['2xl'],
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 80,
  },
  identidade: {
    flex: 1,
    gap: spacing.xs,
  },
  acao: {
    width: 200,
  },
});
