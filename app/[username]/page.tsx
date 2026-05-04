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
  const imageUrl = profile.avatar_url || '/Gemini_Generated_Image_i7bfh0i7bfh0i7bf_(1).png';

  return {
    title: `${name} | BioFlowzy`,
    description,
    openGraph: {
      title: name,
      description,
      type: 'profile',
      locale: 'pt_BR',
      images: [{ url: imageUrl, width: 400, height: 400, alt: name }],
    },
    twitter: {
      card: 'summary',
      title: name,
      description,
      images: [imageUrl],
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
