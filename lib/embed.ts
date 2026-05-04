export type VideoPlatform = 'youtube' | 'vimeo' | 'tiktok' | 'instagram' | 'generic';

export type ParsedVideo = {
  platform: VideoPlatform;
  provider_id: string;
  embed_url: string;
  thumbnail: string;
};

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = (raw || '').trim();
  if (!url) return null;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) {
    const id = yt[1];
    return {
      platform: 'youtube',
      provider_id: id,
      embed_url: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    const id = vimeo[1];
    return {
      platform: 'vimeo',
      provider_id: id,
      embed_url: `https://player.vimeo.com/video/${id}`,
      thumbnail: '',
    };
  }

  const tiktok = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tiktok) {
    const id = tiktok[1];
    return {
      platform: 'tiktok',
      provider_id: id,
      embed_url: `https://www.tiktok.com/embed/v2/${id}`,
      thumbnail: '',
    };
  }

  const insta = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  if (insta) {
    const id = insta[1];
    return {
      platform: 'instagram',
      provider_id: id,
      embed_url: `https://www.instagram.com/p/${id}/embed`,
      thumbnail: '',
    };
  }

  return { platform: 'generic', provider_id: '', embed_url: url, thumbnail: '' };
}
