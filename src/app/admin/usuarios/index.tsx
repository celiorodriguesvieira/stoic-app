import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/campos';
import { Carregando, ErroRecuperavel, Vazio } from '@/components/admin/estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/navegacao';
import { CaixaSecao, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { observarUsuarios } from '@/lib/admin/repositorio';
import { useAuth } from '@/lib/auth-context';
import { ROTULO_PAPEL, type PerfilUsuario } from '@/lib/perfil';
import { spacing } from '@/theme';

export default function AdminUsuariosScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<PerfilUsuario[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () => observarUsuarios(setUsuarios, (falha) => setErro(falha.message)),
    [tentativa],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return usuarios ?? [];

    return (usuarios ?? []).filter((pessoa) =>
      `${pessoa.nome} ${pessoa.email}`.toLocaleLowerCase('pt-BR').includes(termo),
    );
  }, [usuarios, busca]);

  return (
    <PaginaAdmin
      titulo="USUÁRIOS E PERMISSÕES"
      apoio="Acesso exclusivo de administradores."
      topo={<EtiquetaAdmin />}
      nota="O último administrador não pode perder o acesso. Toda alteração registra responsável, data e permissões anterior e nova.">
      <NavegacaoAdmin atual="usuarios" />

      <CampoTexto
        rotulo="Buscar usuário"
        placeholder="Buscar por nome ou e-mail…"
        value={busca}
        onChangeText={setBusca}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <CaixaSecao>
        <View style={styles.linha}>
          <Text variant="supportSemibold" style={styles.colNome}>
            USUÁRIO
          </Text>
          <Text variant="supportSemibold" style={styles.colEmail}>
            E-MAIL
          </Text>
          <Text variant="supportSemibold" style={styles.colPapel}>
            PERMISSÃO
          </Text>
          <View style={styles.colAcao} />
        </View>

        {erro ? (
          <ErroRecuperavel mensagem={erro} aoTentarDeNovo={() => {
              setErro(null);
              setTentativa((n) => n + 1);
            }} />
        ) : usuarios === null ? (
          <Carregando rotulo="Carregando as pessoas…" />
        ) : usuarios.length === 0 ? (
          <Vazio titulo="Nenhum perfil cadastrado ainda." />
        ) : filtrados.length === 0 ? (
          <Vazio titulo="Ninguém corresponde à busca." apoio={`Termo: “${busca}”`} />
        ) : (
          filtrados.map((pessoa) => {
            const souEu = pessoa.uid === user?.uid;

            return (
              <View key={pessoa.uid} style={styles.linha}>
                <Text style={styles.colNome}>{pessoa.nome || 'Sem nome'}</Text>
                <Text style={styles.colEmail} color="textSecondary">
                  {pessoa.email}
                </Text>
                <Text style={styles.colPapel}>{ROTULO_PAPEL[pessoa.papel]}</Text>

                {/* Ninguém altera o próprio papel por aqui — regra do nó `600:75`. */}
                <Button
                  label={souEu ? 'SEU ACESSO' : 'ALTERAR'}
                  type="secondary"
                  size="medium"
                  disabled={souEu}
                  onPress={() => router.push(`/admin/usuarios/${pessoa.uid}`)}
                  style={styles.colAcao}
                  accessibilityLabel={
                    souEu ? 'Seu próprio acesso' : `Alterar permissão de ${pessoa.nome || pessoa.email}`
                  }
                />
              </View>
            );
          })
        )}
      </CaixaSecao>
    </PaginaAdmin>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 48,
  },
  colNome: {
    flex: 2,
  },
  colEmail: {
    flex: 3,
  },
  colPapel: {
    flex: 2,
  },
  colAcao: {
    width: 160,
  },
});
