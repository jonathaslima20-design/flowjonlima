import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BioClient } from './BioClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, username')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) return {};

  const name = profile.display_name || profile.username;
  const description = profile.bio || `Confira os links de ${name} na BioFlowzy.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com';

  const avatar = profile.avatar_url;
  const hasAvatar = typeof avatar === 'string' && avatar.length > 0;
  const imageType = hasAvatar && avatar.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
  const images = hasAvatar
    ? [{ url: avatar as string, width: 1080, height: 1080, alt: name, type: imageType }]
    : [{ url: `${siteUrl}/og-home.png`, width: 989, height: 948, alt: 'BioFlowzy', type: 'image/png' }];

  return {
    title: `${name} | BioFlowzy`,
    description,
    openGraph: {
      title: name,
      description,
      type: 'profile',
      locale: 'pt_BR',
      url: `${siteUrl}/${profile.username}`,
      siteName: 'BioFlowzy',
      images,
    },
    twitter: {
      card: hasAvatar ? 'summary_large_image' : 'summary',
      title: name,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function PublicBio({ params }: { params: { username: string } }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) return notFound();

  const [{ data: links }, { data: socials }, { data: videos }, { data: banners }] = await Promise.all([
    supabase.from('links').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
    supabase.from('social_links').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
    supabase.from('videos').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
    supabase.from('banners').select('*').eq('profile_id', profile.id).eq('is_active', true).order('position'),
  ]);

  return (
    <BioClient
      profile={profile}
      links={links ?? []}
      socials={socials ?? []}
      videos={videos ?? []}
      banners={banners ?? []}
    />
  );
}
