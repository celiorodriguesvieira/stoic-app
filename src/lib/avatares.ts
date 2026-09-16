import type { ImageSourcePropType } from 'react-native';

/**
 * Avatares da conta — item 07 do contrato do menu (`649:987`).
 *
 * "Inicial neutra por padrão; usar a primeira letra do nome. Oferecer pixel
 * arts do acervo: Sêneca, Epicteto e Marco Aurélio. Sem câmera, galeria ou
 * upload." São três imagens fixas do acervo, exportadas do Figma — não há nada
 * que o usuário envie, então não há Storage envolvido.
 *
 * O `id` é o que fica gravado em `usuarios/{uid}.avatarId`; `null` significa a
 * inicial do nome.
 */
export type AvatarDoAcervo = {
  id: string;
  nome: string;
  imagem: ImageSourcePropType;
};

/**
 * Valor que viaja nos parâmetros de rota para dizer "sem imagem, use a
 * inicial". Existe porque parâmetro de rota não carrega `null`.
 */
export const AVATAR_NEUTRO = 'neutro';

export const AVATARES: readonly AvatarDoAcervo[] = [
  { id: 'seneca', nome: 'Sêneca', imagem: require('@/assets/images/avatares/seneca.png') },
  { id: 'epicteto', nome: 'Epicteto', imagem: require('@/assets/images/avatares/epicteto.png') },
  {
    id: 'marco-aurelio',
    nome: 'Marco Aurélio',
    imagem: require('@/assets/images/avatares/marco-aurelio.png'),
  },
];

/** Imagem do avatar escolhido, ou `null` quando é a inicial do nome. */
export function imagemDoAvatar(avatarId: string | null): ImageSourcePropType | null {
  if (!avatarId) return null;

  return AVATARES.find((avatar) => avatar.id === avatarId)?.imagem ?? null;
}

/** Inicial exibida no lugar da imagem. Uma letra, maiúscula. */
export function inicialDoNome(nome: string): string {
  return nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
}
