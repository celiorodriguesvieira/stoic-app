import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

export type AbaAdmin =
  | 'filosofos'
  | 'atividades'
  | 'conteudos'
  | 'programacao'
  | 'biblioteca'
  | 'usuarios';

/**
 * Navegação administrativa do nó `596:9`. A aba atual fica preenchida.
 *
 * A ordem segue o trabalho, não a estrutura do painel: escolher o filósofo,
 * cadastrar o conteúdo da semana, programar a semana. Usuários fica por
 * último, porque não faz parte do fluxo editorial. O Figma lista Conteúdos
 * primeiro; Atividades fica entre Filósofos e Conteúdos, que é onde ela cai
 * no fluxo: a aula vincula uma atividade já cadastrada.
 *
 * Não há saída para o app aqui, e isso é do desenho: "admin desktop:
 * navegação administrativa própria, sem hambúrguer do app" (`654:1759`). A
 * entrada é o item "Painel administrativo" do menu Seu espaço (`645:977`).
 *
 * O Figma desenha oito itens; existem seis. Faltam EXPLORAR e TEMAS, porque
 * as telas ainda não existem. BIBLIOTECA fica depois da
 * programação: é cadastro de apoio, fora do ciclo da semana (`668:156`).
 */
export function NavegacaoAdmin({ atual }: { atual: AbaAdmin }) {
  const router = useRouter();
  const { podeAdministrar } = useAuth();

  return (
    <View style={styles.barra}>
      <Button
        label="FILÓSOFOS"
        size="medium"
        type={atual === 'filosofos' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin/filosofos')}
        style={styles.pilula}
      />

      <Button
        label="ATIVIDADES"
        size="medium"
        type={atual === 'atividades' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin/atividades')}
        style={styles.pilula}
      />

      <Button
        label="CONTEÚDOS"
        size="medium"
        type={atual === 'conteudos' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin')}
        style={styles.pilula}
      />

      <Button
        label="PROGRAMAÇÃO SEMANAL"
        size="medium"
        type={atual === 'programacao' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin/programacao')}
        style={styles.pilula}
      />

      <Button
        label="BIBLIOTECA"
        size="medium"
        type={atual === 'biblioteca' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin/biblioteca')}
        style={styles.pilula}
      />

      {/* Só administrador mexe em pessoas, e a aba nem aparece para editor. */}
      {podeAdministrar ? (
        <Button
          label="USUÁRIOS E PERMISSÕES"
          size="medium"
          type={atual === 'usuarios' ? 'primary' : 'secondary'}
          onPress={() => router.replace('/admin/usuarios')}
          style={styles.pilula}
        />
      ) : null}
    </View>
  );
}

/** Etiqueta do topo do painel. Nó `596:6`. */
export function EtiquetaAdmin() {
  return <Text variant="supportSemibold">PAUSA / ADMINISTRADOR</Text>;
}

/** Botão de voltar em pílula — "← CONTEÚDOS" do nó `596:1146`. */
export function BotaoVoltar({ rotulo, aoVoltar }: { rotulo: string; aoVoltar: () => void }) {
  return (
    <Button
      label={rotulo}
      type="secondary"
      size="medium"
      onPress={aoVoltar}
      style={[styles.pilula, styles.voltar]}
    />
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  pilula: {
    paddingHorizontal: spacing['3xl'],
  },
  voltar: {
    alignSelf: 'flex-start',
  },
});
