import type { BioProfile } from '@/themes/types';

export const DEMO_PROFILE: Partial<BioProfile> = {
  id: 'demo',
  username: 'maria.cria',
  display_name: '@maria.cria',
  bio: 'Criadora de conteudo - SP',
  avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=256',
  theme: 'brutalist',
  theme_settings: {},
  avatar_size: 90,
  is_pro: false,
};

export const DEMO_LINKS = [
  { id: 'l1', title: 'Meu novo curso', subtitle: 'Inscricoes abertas', url: '#', is_active: true },
  { id: 'l2', title: 'Loja oficial', subtitle: 'Frete gratis', url: '#', is_active: true },
  { id: 'l3', title: 'Newsletter semanal', subtitle: 'Assine gratis', url: '#', is_active: true },
];

export const DEMO_SOCIALS = [
  { id: 's1', platform: 'instagram', url: '#' },
  { id: 's2', platform: 'youtube', url: '#' },
  { id: 's3', platform: 'tiktok', url: '#' },
];

export const DEMO_VIDEOS = [
  {
    id: 'v1',
    platform: 'youtube',
    title: 'Como criar uma bio que converte',
    embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export const DEMO_BANNERS: any[] = [];

export const CYBER_FALLBACK_PRESET = {
  profile: {
    display_name: 'Marcos Becker',
    bio: '🛡️ Especialista em Segurança da Informação & OSINT',
    avatar_url: 'https://ghdytnynplyhugkpmhoy.supabase.co/storage/v1/object/public/theme-showcase/cyber/catalog/avatar/4d0b18fd-20af-4158-bccc-c4ec527dedb1.jpg',
    theme: 'cyber',
    theme_settings: {},
    avatar_size: 146,
  },
  links: [
    { id: 'l1', title: 'Agendamento de Consultoria', subtitle: '', url: '#', is_active: true },
    { id: 'l2', title: 'Relatórios Públicos/Cases', subtitle: '', url: '#', is_active: true },
    { id: 'l3', title: 'Certificações e Badges', subtitle: '', url: '#', is_active: true },
  ],
  socials: [
    { id: 's1', platform: 'whatsapp', url: '#' },
    { id: 's2', platform: 'linkedin', url: '#' },
    { id: 's3', platform: 'website', url: '#' },
  ],
  videos: [] as any[],
  banners: [] as any[],
  themeCore: { avatar_size: 146 },
  themeSettings: {},
};