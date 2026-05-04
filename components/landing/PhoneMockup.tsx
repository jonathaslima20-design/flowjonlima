import { Instagram, Youtube, Music2, ExternalLink, Play } from 'lucide-react';

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[300px] md:w-[320px] animate-float">
      <div className="relative bg-white brutal-border rounded-[40px] p-4 brutal-shadow-xl">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full" />
        <div className="pt-8 pb-4 flex flex-col items-center">
          <div className="w-20 h-20 shrink-0 aspect-square rounded-full bg-bioyellow brutal-border flex items-center justify-center overflow-hidden">
            <img
              src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="mt-3 font-display text-lg">@maria.cria</h3>
          <p className="text-xs text-black/70">Criadora de conteúdo • SP</p>
          <div className="mt-3 flex gap-2">
            {[Instagram, Youtube, Music2].map((Icon, i) => (
              <span key={i} className="w-8 h-8 bg-black text-white flex items-center justify-center brutal-border">
                <Icon className="w-4 h-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <LinkRow bg="bg-bioyellow" title="Meu novo curso" sub="Inscrições abertas" />
          <LinkRow bg="bg-white" title="Loja oficial" sub="Frete grátis" />
          <VideoCard />
          <LinkRow bg="bg-biolime" title="Newsletter semanal" sub="Assine grátis" />
        </div>

        <div className="text-center text-[10px] font-bold pb-2">
          feito com <span className="bg-black text-white px-1">BioFlowzy</span>
        </div>
      </div>
    </div>
  );
}

function LinkRow({ bg, title, sub }: { bg: string; title: string; sub: string }) {
  return (
    <div className={`${bg} brutal-border brutal-shadow px-3 py-3 flex items-center justify-between`}>
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-[11px] text-black/70">{sub}</div>
      </div>
      <ExternalLink className="w-4 h-4" />
    </div>
  );
}

function VideoCard() {
  return (
    <div className="brutal-border brutal-shadow bg-white overflow-hidden">
      <div className="relative aspect-video bg-black">
        <img
          src="https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400"
          alt="video"
          className="w-full h-full object-cover opacity-80"
        />
        <span className="absolute top-2 left-2 bg-biored text-white text-[10px] font-bold px-2 py-0.5 brutal-border">
          YOUTUBE
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-10 h-10 bg-white brutal-border flex items-center justify-center">
            <Play className="w-5 h-5" fill="black" />
          </span>
        </span>
      </div>
      <div className="p-2 text-xs font-bold">Como criar uma bio que converte</div>
    </div>
  );
}
