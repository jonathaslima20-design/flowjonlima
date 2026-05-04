export function Marquee() {
  const items = [
    'CRIE SUA BIO EM 30 SEGUNDOS',
    'SEM CÓDIGO',
    'ANALYTICS EM TEMPO REAL',
    'DOMÍNIO PRÓPRIO',
    'TEMAS PERSONALIZÁVEIS',
    'LINKS ILIMITADOS',
  ];
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className="bg-black text-white border-y-2 border-black py-4 overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap animate-marquee font-display text-2xl md:text-3xl">
        {all.map((t, i) => (
          <span key={i} className="flex items-center gap-8">
            {t}
            <span className="text-bioyellow">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
