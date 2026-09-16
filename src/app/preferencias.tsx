import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { minTouchTarget, spacing } from '@/theme';

/**
 * Preferências de rotina e acessibilidade (`506:1063`).
 *
 * Ficam **no aparelho**: são ajustes de como este aparelho se comporta, não
 * dados da conta. O rodapé promete só o que acontece — "salvas
 * automaticamente" —, sem alegar sincronização, que o item 10 do contrato
 * proíbe anunciar quando a gravação é local.
 */
const CHAVE = (uid: string) => `pausa:${uid}:preferencias-app`;

type Ajustes = {
  conhecimentoDoDia: boolean;
  reduzirAnimacoes: boolean;
  textoAmpliado: boolean;
};

const PADRAO: Ajustes = {
  conhecimentoDoDia: true,
  reduzirAnimacoes: false,
  textoAmpliado: false,
};

export default function PreferenciasScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const uid = user?.uid ?? null;

  const [ajustes, setAjustes] = useState<Ajustes>(PADRAO);

  useEffect(() => {
    if (!uid) return;

    let vivo = true;

    AsyncStorage.getItem(CHAVE(uid))
      .then((salvo) => {
        if (!vivo || !salvo) return;
        setAjustes({ ...PADRAO, ...(JSON.parse(salvo) as Partial<Ajustes>) });
      })
      .catch(() => {
        // Sem leitura, valem os padrões — nada se perde.
      });

    return () => {
      vivo = false;
    };
  }, [uid]);

  function alternar(campo: keyof Ajustes) {
    const proximo = { ...ajustes, [campo]: !ajustes[campo] };
    setAjustes(proximo);

    if (uid) {
      AsyncStorage.setItem(CHAVE(uid), JSON.stringify(proximo)).catch(() => {});
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar ao menu"
            onPress={() => router.back()}
            style={styles.voltar}>
            <Text variant="headingMedium">←</Text>
          </Pressable>

          <Text variant="headingLarge" accessibilityRole="header">
            PREFERÊNCIAS
          </Text>
        </View>

        <Secao titulo="ROTINA">
          <Ajuste
            titulo="Conhecimento do dia"
            ligado={ajustes.conhecimentoDoDia}
            aoAlternar={() => alternar('conhecimentoDoDia')}
          />
        </Secao>

        <Secao titulo="ACESSIBILIDADE">
          <Ajuste
            titulo="Reduzir animações"
            ligado={ajustes.reduzirAnimacoes}
            aoAlternar={() => alternar('reduzirAnimacoes')}
          />
          <Ajuste
            titulo="Texto ampliado"
            ligado={ajustes.textoAmpliado}
            aoAlternar={() => alternar('textoAmpliado')}
          />
        </Secao>

        <Secao titulo="CONTEÚDO">
          {/*
            O desenho traz a seta, mas não existe tela de edição de interesses.
            A linha fica legível e sem toque: um item que parece levar a algum
            lugar e não leva é pior do que um item quieto.
          */}
          <View style={styles.linha}>
            <Text style={styles.linhaTexto}>Temas de interesse</Text>
            <Text color="textSecondary">›</Text>
          </View>
        </Secao>

        <Text variant="bodySmall" color="textSecondary" style={styles.rodape}>
          As alterações são salvas automaticamente.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text variant="supportSemibold" color="textAccent">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Ajuste({
  titulo,
  ligado,
  aoAlternar,
}: {
  titulo: string;
  ligado: boolean;
  aoAlternar: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.linha}>
      <Text style={styles.linhaTexto}>{titulo}</Text>

      <Switch
        value={ligado}
        onValueChange={aoAlternar}
        accessibilityLabel={titulo}
        trackColor={{ true: colors.gold, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  voltar: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.md,
  },
  secao: {
    gap: spacing.lg,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 56,
  },
  linhaTexto: {
    flex: 1,
  },
  rodape: {
    alignSelf: 'center',
  },
});
