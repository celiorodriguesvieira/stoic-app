import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { rotulosDosInteresses } from '@/lib/interesses';
import { minTouchTarget, spacing } from '@/theme';

/**
 * Preferências de acessibilidade e conteúdo (`506:1063`).
 *
 * A seção ROTINA, com o interruptor "Conhecimento da semana", saiu em
 * 18/09 por decisão do autor: o destaque semanal é o centro da Home, e
 * desligá-lo não faz sentido. O Figma ainda o desenha e precisa ser
 * atualizado.
 *
 * Ficam **no aparelho**: são ajustes de como este aparelho se comporta, não
 * dados da conta. O rodapé promete só o que acontece — "salvas
 * automaticamente" —, sem alegar sincronização, que o item 10 do contrato
 * proíbe anunciar quando a gravação é local.
 */
const CHAVE = (uid: string) => `pausa:${uid}:preferencias-app`;

type Ajustes = {
  reduzirAnimacoes: boolean;
  textoAmpliado: boolean;
};

const PADRAO: Ajustes = {
  reduzirAnimacoes: false,
  textoAmpliado: false,
};

/**
 * Lê os ajustes gravados, campo a campo.
 *
 * Campo a campo, e não espalhando o que veio, porque aparelhos antigos ainda
 * guardam `conhecimentoDaSemana` (e, antes de 16/09, `conhecimentoDoDia`):
 * a chave fica no armazenamento, mas não volta a entrar no estado.
 */
function ler(salvo: string): Ajustes {
  const bruto = JSON.parse(salvo) as Partial<Ajustes>;

  return {
    reduzirAnimacoes: bruto.reduzirAnimacoes ?? PADRAO.reduzirAnimacoes,
    textoAmpliado: bruto.textoAmpliado ?? PADRAO.textoAmpliado,
  };
}

export default function PreferenciasScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();

  const uid = user?.uid ?? null;
  const interesses = rotulosDosInteresses(perfil?.preferencias?.interesses ?? []);

  const [ajustes, setAjustes] = useState<Ajustes>(PADRAO);

  useEffect(() => {
    if (!uid) return;

    let vivo = true;

    AsyncStorage.getItem(CHAVE(uid))
      .then((salvo) => {
        if (!vivo || !salvo) return;
        setAjustes(ler(salvo));
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
            <Image
              source={require('@/assets/images/icones/voltar.svg')}
              style={styles.icone}
              contentFit="contain"
            />
          </Pressable>

          <Text variant="headingLarge" accessibilityRole="header">
            PREFERÊNCIAS
          </Text>
        </View>

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
            Só exibe o que foi escolhido no onboarding — decisão do autor em
            18/09. O desenho traz uma seta, mas não existe tela de edição, e
            uma seta que não leva a lugar nenhum promete o que não entrega.
          */}
          <View style={styles.interesses}>
            <Text>Temas de interesse</Text>
            <Text variant="bodySmall" color="textSecondary">
              {interesses.length > 0 ? interesses.join(' · ') : 'Nenhum tema escolhido.'}
            </Text>
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
      <Text variant="cardLabel" color="textAccent">
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
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
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
    minHeight: 80,
  },
  voltar: {
    width: Math.max(48, minTouchTarget),
    height: Math.max(48, minTouchTarget),
    alignItems: 'center',
    justifyContent: 'center',
  },
  icone: {
    width: 24,
    height: 24,
  },
  secao: {
    gap: spacing.sm,
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
  interesses: {
    minHeight: 56,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  rodape: {
    textAlign: 'center',
  },
});
