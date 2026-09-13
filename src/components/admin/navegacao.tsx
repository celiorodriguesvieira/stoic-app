import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

export type AbaAdmin = 'conteudos' | 'conhecimento' | 'usuarios';

/** Navegação administrativa do nó `596:9`. A aba atual fica preenchida. */
export function NavegacaoAdmin({ atual }: { atual: AbaAdmin }) {
  const router = useRouter();
  const { podeAdministrar } = useAuth();

  return (
    <View style={styles.barra}>
      <Button
        label="CONTEÚDOS"
        size="medium"
        type={atual === 'conteudos' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin')}
        style={styles.pilula}
      />

      <Button
        label="CONHECIMENTO DO DIA"
        size="medium"
        type={atual === 'conhecimento' ? 'primary' : 'secondary'}
        onPress={() => router.replace('/admin/conhecimento-do-dia')}
        style={styles.pilula}
      />

      {/* Só administrador mexe em pessoas — a aba nem aparece para editor. */}
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
