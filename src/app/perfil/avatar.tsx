import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { AVATAR_NEUTRO, AVATARES } from '@/lib/avatares';
import { useAuth } from '@/lib/auth-context';
import { radius, spacing } from '@/theme';

/**
 * Tela "Seu avatar" (`511:1045`).
 *
 * Tocar numa opção marca a escolha e volta ao perfil **como rascunho** (item
 * 07) — quem grava é o "Salvar alterações" de lá. Por isso a volta é
 * `replace`: reabrir esta tela pelo Voltar reabriria uma escolha já feita.
 */
export default function EscolherAvatarScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const { nome = '', atual = AVATAR_NEUTRO } = useLocalSearchParams<{
    nome?: string;
    atual?: string;
  }>();

  const nomeExibido = nome || perfil?.nome || user?.displayName || '';

  function escolher(id: string) {
    router.replace({ pathname: '/perfil', params: { nome, avatar: id } });
  }

  const opcoes = [{ id: AVATAR_NEUTRO, nome: 'Neutro' }, ...AVATARES];

  return (
    <Screen>
      <View style={styles.conteudo}>
        <Text variant="headingLarge" accessibilityRole="header">
          SEU AVATAR
        </Text>

        <Text>Escolha uma imagem para o seu perfil. Sem câmera ou acesso à galeria.</Text>

        <View style={styles.grade}>
          {opcoes.map((opcao) => (
            <OpcaoAvatar
              key={opcao.id}
              rotulo={opcao.nome}
              atual={opcao.id === atual}
              nome={nomeExibido}
              avatarId={opcao.id === AVATAR_NEUTRO ? null : opcao.id}
              aoEscolher={() => escolher(opcao.id)}
            />
          ))}
        </View>

        <Button
          label="VOLTAR AO PERFIL"
          type="secondary"
          size="medium"
          shape="rounded"
          onPress={() => router.replace({ pathname: '/perfil', params: { nome, avatar: atual } })}
        />
      </View>
    </Screen>
  );
}

function OpcaoAvatar({
  rotulo,
  atual,
  nome,
  avatarId,
  aoEscolher,
}: {
  rotulo: string;
  atual: boolean;
  nome: string;
  avatarId: string | null;
  aoEscolher: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: atual, checked: atual }}
      accessibilityLabel={atual ? `${rotulo}, selecionado` : rotulo}
      onPress={aoEscolher}
      style={[
        styles.opcao,
        {
          backgroundColor: colors.selected,
          borderColor: atual ? colors.accent : 'transparent',
        },
      ]}>
      <Avatar nome={nome} avatarId={avatarId} tamanho={80} />

      <Text variant="bodySmall">{atual ? `${rotulo} (atual)` : rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing['2xl'],
    gap: spacing['2xl'],
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  opcao: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
  },
});
