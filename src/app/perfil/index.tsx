import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { AVATAR_NEUTRO } from '@/lib/avatares';
import { useAuth } from '@/lib/auth-context';
import { salvarIdentidade } from '@/lib/perfil';
import { spacing } from '@/theme';

const NOME_MAXIMO = 40;

/**
 * Tela "Seu perfil" (`508:836`).
 *
 * Nome e avatar formam **um rascunho só**: "Salvar alterações persiste
 * avatarId junto com o nome; Cancelar descarta ambos" (item 07). Por isso a
 * escolha de avatar volta para cá como parâmetro em vez de gravar sozinha.
 */
export default function PerfilScreen() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const parametros = useLocalSearchParams<{ nome?: string; avatar?: string }>();

  const nomeSalvo = perfil?.nome ?? user?.displayName ?? '';
  const avatarSalvo = perfil?.avatarId ?? null;

  const [nome, setNome] = useState(parametros.nome ?? nomeSalvo);

  // O avatar não tem estado próprio: ele sempre chega da tela de escolha, por
  // parâmetro, e na falta dele vale o que está salvo no perfil. Guardar uma
  // cópia aqui só criaria uma segunda verdade para o mesmo rascunho.
  const avatarId = parametros.avatar
    ? parametros.avatar === AVATAR_NEUTRO
      ? null
      : parametros.avatar
    : avatarSalvo;

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tocado, setTocado] = useState(false);

  const limpo = nome.trim();
  const valido = limpo.length >= 1 && limpo.length <= NOME_MAXIMO;

  async function salvar() {
    setTocado(true);

    if (!user || !valido) return;

    setSalvando(true);
    setErro(null);

    try {
      await salvarIdentidade(user.uid, { nome: limpo, avatarId });
      router.back();
    } catch {
      // Item 02: manter a edição e deixar tentar de novo.
      setErro('Não foi possível salvar. Tente novamente');
      setSalvando(false);
    }
  }

  return (
    <Screen>
      <View style={styles.conteudo}>
        <Text variant="headingLarge" accessibilityRole="header">
          SEU PERFIL
        </Text>

        <Avatar nome={nome} avatarId={avatarId} tamanho={80} />

        <Button
          label="ESCOLHER AVATAR"
          type="secondary"
          size="medium"
          shape="rounded"
          onPress={() =>
            router.push({
              pathname: '/perfil/avatar',
              // O rascunho viaja junto: voltar da escolha não pode apagar o
              // nome que a pessoa acabou de digitar.
              params: { nome, atual: avatarId ?? AVATAR_NEUTRO },
            })
          }
        />

        <Text>Como podemos chamar você?</Text>

        <TextField
          label="Nome de exibição"
          placeholder="Seu nome"
          value={nome}
          onChangeText={setNome}
          maxLength={NOME_MAXIMO}
          autoCapitalize="words"
          error={
            erro ??
            (tocado && !valido ? 'Informe um nome de 1 a 40 caracteres.' : undefined)
          }
        />

        <Button
          label={salvando ? 'SALVANDO…' : 'SALVAR ALTERAÇÕES'}
          shape="rounded"
          disabled={salvando}
          onPress={salvar}
        />

        <Button
          label="CANCELAR"
          type="secondary"
          shape="rounded"
          disabled={salvando}
          // Cancelar descarta nome e avatar: nada foi gravado até aqui.
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing['2xl'],
    gap: spacing['2xl'],
  },
});
