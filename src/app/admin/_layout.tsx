import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Carregando } from '@/components/admin/Estados';
import { PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/**
 * Painel administrativo — porteiro.
 *
 * Contrato `618:18`:
 *   04 · "Login → servidor valida papel → Editor ou Administrador entra em
 *         Conteúdos. Usuário comum/visitante recebe Acesso não autorizado."
 *         "No retorno ao painel, revalidar sessão e autorização; sessão
 *         expirada exige login."
 *   05 · "Falha de rede não significa conta inexistente ou ausência de
 *         permissão."
 *
 * Por isso há quatro respostas distintas, e não duas: carregando, erro de
 * leitura, não autorizado e autorizado. Colapsar as duas primeiras em "não
 * autorizado" expulsaria um administrador por causa de wi-fi ruim.
 *
 * Nada disto é segurança — é explicação. Quem protege os dados são as Security
 * Rules em `firestore.rules`.
 */
export default function AdminLayout() {
  const { colors } = useTheme();
  const { user, isSignedIn, podeEditar, papelIndefinido, erroDePerfil } = useAuth();

  // Sessão expirada ou inexistente: o contrato manda voltar ao login.
  // `isSignedIn` e não `user`, senão o atalho de desenvolvimento (sem usuário
  // do Firebase) seria mandado para o login que ele justamente pula.
  if (!isSignedIn) {
    return <PrecisaEntrar />;
  }

  if (user && erroDePerfil) {
    return <FalhaAoValidar mensagem={erroDePerfil} />;
  }

  if (papelIndefinido) {
    return (
      <PaginaAdmin titulo="PAINEL" apoio="Validando seu acesso…">
        <Carregando rotulo="Conferindo permissões…" />
      </PaginaAdmin>
    );
  }

  if (!podeEditar) {
    return <AcessoNaoAutorizado />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    />
  );
}

function VoltarAoApp() {
  const router = useRouter();

  return (
    <Button
      label="VOLTAR AO APP"
      type="secondary"
      size="medium"
      onPress={() => router.replace('/')}
      style={styles.botao}
    />
  );
}

/**
 * Acesso não autorizado — nó `626:31` do Figma.
 *
 * Item 06: "Entrar com outra conta encerra a sessão e abre Login mantendo o
 * destino painel." Daí o `?destino=/admin`: depois de entrar, a pessoa volta
 * para onde estava tentando ir, e não para a Home.
 */
function AcessoNaoAutorizado() {
  const router = useRouter();
  const { sair } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function entrarComOutraConta() {
    if (saindo) return;
    setSaindo(true);

    try {
      await sair();
      router.replace('/entrar?destino=/admin');
    } catch {
      setSaindo(false);
    }
  }

  return (
    <PaginaAdmin titulo="ACESSO NÃO AUTORIZADO">
      <View style={styles.bloco}>
        <Text variant="supportSemibold">
          Sua conta não tem permissão para acessar o painel administrativo. Se você precisa desse
          acesso, entre em contato com o administrador responsável.
        </Text>

        <Button
          label={saindo ? 'Saindo…' : 'ENTRAR COM OUTRA CONTA'}
          size="medium"
          disabled={saindo}
          onPress={entrarComOutraConta}
          style={styles.botao}
        />

        {/* Pedido pelo contrato do acesso ao painel: "logado sem role admin:
            mostrar 'Acesso restrito' e ação 'Voltar ao app'" (`646:107`). Sem
            ele, quem não tem permissão fica parado nesta tela. */}
        <VoltarAoApp />
      </View>
    </PaginaAdmin>
  );
}

/**
 * Sem sessão em `/admin`.
 *
 * O login leva `?destino=/admin` porque o contrato manda voltar para onde a
 * pessoa estava tentando ir: "sem login em /admin: abrir login e retornar a
 * /admin após autenticação válida" (`646:107`). Sem o parâmetro — que foi o
 * que aconteceu até 16/09 — quem abria o painel no navegador entrava e caía
 * na Home do app, sem nada explicando por quê.
 */
function PrecisaEntrar() {
  const router = useRouter();

  return (
    <PaginaAdmin titulo="ENTRE PARA CONTINUAR" apoio="O painel exige uma sessão válida.">
      <View style={styles.bloco}>
        <Text>Sua sessão expirou ou você ainda não entrou nesta conta.</Text>

        <Button
          label="IR PARA O LOGIN"
          size="medium"
          onPress={() => router.replace('/entrar?destino=/admin')}
          style={styles.botao}
        />
      </View>
    </PaginaAdmin>
  );
}

/** Falha ao ler o perfil. Nunca tratada como ausência de permissão (item 05). */
function FalhaAoValidar({ mensagem }: { mensagem: string }) {
  return (
    <PaginaAdmin titulo="PAINEL" apoio="Não foi possível validar seu acesso.">
      <View style={styles.bloco}>
        <Text color="error" accessibilityLiveRegion="polite">
          {mensagem}
        </Text>

        <Text color="textSecondary">
          Isto é uma falha de conexão, não uma negativa de permissão. A validação é refeita
          sozinha assim que a conexão voltar.
        </Text>

        <VoltarAoApp />
      </View>
    </PaginaAdmin>
  );
}

const styles = StyleSheet.create({
  bloco: {
    gap: spacing.lg,
    alignItems: 'flex-start',
    maxWidth: 640,
  },
  botao: {
    paddingHorizontal: spacing['3xl'],
  },
});
