import { Play } from 'lucide-react';
import { parseVideoUrl } from '@/lib/embed';

export function VideoEmbed({ video, preview }: { video: any; preview?: boolean }) {
  const showIframe = !preview && video.embed_url;

  if (showIframe) {
    return (
      <iframe
        src={video.embed_url}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const derivedThumb = !video.thumbnail && video.embed_url
    ? parseVideoUrl(video.embed_url)?.thumbnail || ''
    : '';
  const thumb = video.thumbnail || derivedThumb;

  if (thumb) {
    return (
      <>
        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="rounded-full bg-white/90 p-3 shadow-lg">
            <Play className="h-5 w-5 fill-black text-black" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
      <div className="rounded-full bg-white/90 p-3 shadow-lg">
        <Play className="h-5 w-5 fill-black text-black" />
      </div>
    </div>
  );
}
