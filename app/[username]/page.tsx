import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BioClient } from './BioClient';
import { can, isPageLive } from '@/lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache de 30 s (ISR): aguenta picos de acesso sem consultar o banco a cada visita.
// O painel chama /api/revalidate-bio para refletir edições na hora.
export const revalidate = 30;

// Nenhuma página é gerada no build; cada perfil é gerado no primeiro acesso e fica em cache
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, username, suspended_at, plan, plan_expires_at, seo_title, seo_description, seo_image_url, owner_id')
    .eq('username', username)
    .maybeSingle();

  if (!profile || profile.suspended_at || !isPageLive(profile)) return {};

  const name = profile.display_name || profile.username;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com';

  // SEO personalizado é recurso Pro: com o plano vencido, volta ao padrão
  const seo = can(profile, 'seo') ? profile : null;
  const title = seo?.seo_title || `${name} | BioFlowzy`;
  const description = seo?.seo_description || profile.bio || `Confira os links de ${name} na BioFlowzy.`;

  const avatar = profile.avatar_url;
  const hasAvatar = typeof avatar === 'string' && avatar.length > 0;
  const imageType = hasAvatar && avatar.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
  const images = seo?.seo_image_url
    ? [{ url: seo.seo_image_url, width: 1200, height: 630, alt: title }]
    : hasAvatar
      ? [{ url: avatar as string, width: 1080, height: 1080, alt: name, type: imageType }]
      : [{ url: `${siteUrl}/og-home.png`, width: 989, height: 948, alt: 'BioFlowzy', type: 'image/png' }];

  return {
    title,
    description,
    // Pro/Business: a foto do perfil vira o ícone da aba (Free e sem foto seguem com o ícone do BioFlowzy)
    ...(seo && hasAvatar ? { icons: { icon: avatar as string, apple: avatar as string } } : {}),
    openGraph: {
      title: seo?.seo_title || name,
      description,
      type: 'profile',
      locale: 'pt_BR',
      url: `${siteUrl}/${profile.username}`,
      siteName: 'BioFlowzy',
      images,
    },
    twitter: {
      card: hasAvatar || seo?.seo_image_url ? 'summary_large_image' : 'summary',
      title: seo?.seo_title || name,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function PublicBio({ params }: Props) {
  const { username } = await params;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (!profile || profile.suspended_at || !isPageLive(profile)) return notFound();

  // Links agendados só aparecem dentro da janela (a página fica em cache por até 30 s)
  const now = new Date().toISOString();
  const [{ data: links }, { data: socials }, { data: videos }, { data: banners }] = await Promise.all([
    supabase.from('links').select('*').eq('profile_id', profile.id).eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('position'),
    supabase.from('social_links').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
    supabase.from('videos').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
    supabase.from('banners').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
  ]);

  // Campos internos não vão para o HTML da página pública
  const { role, referred_by, referral_code, suspended_at, owner_id, ...publicProfile } = profile;

  return (
    <BioClient
      profile={publicProfile}
      links={links ?? []}
      socials={socials ?? []}
      videos={videos ?? []}
      banners={banners ?? []}
    />
  );
}
