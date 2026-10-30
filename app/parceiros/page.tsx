import type { Metadata } from 'next';
import {
  ArrowRight, BadgePercent, Briefcase, CalendarClock, ChartLine, Check, Gift, Handshake, KeyRound, Megaphone, Repeat, Rocket, Sparkles,
  Trophy, UserRound, Users, Wallet,
} from 'lucide-react';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { AttributionCapture } from '@/components/landing/AttributionCapture';
import { PartnerSimulator } from '@/components/partners/PartnerSimulator';
import { PartnerApplyForm } from '@/components/partners/PartnerApplyForm';
import { fetchPartnerProgram, tierFor } from '@/lib/partner';
import { PLANS, brl, monthlyPrice } from '@/lib/plans';

// Página de captação de parceiros: proposta para agências, criadores, mídias e freelancers.
// Regras (Admin → Parceiros → Configurações) aparecem em até 5 minutos
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Programa de Parceiros BioFlowzy: renda recorrente para agências e criadores',
  description: 'Agências, criadores de conteúdo, mídias e freelancers ganham comissão recorrente em cada pagamento dos clientes que trazem para o BioFlowzy, ou revendem licenças com desconto.',
  alternates: { canonical: '/parceiros' },
};

export default async function PartnersPage() {
  const program = await fetchPartnerProgram();
  const tiers = [...program.tiers].sort((a, b) => a.min - b.min);
  const top = tiers[tiers.length - 1];

  const proAnnual = PLANS.pro.prices.annual;
  const bizAnnual = PLANS.business.prices.annual;
  const firstPrice = (cents: number) => Math.round(cents * (100 - program.coupon_discount_pct) / 100);
  // Ganho anual com N clientes no plano anual: 1º ano com o cupom, nível alcançado com N clientes
  const yearly = (clients: number, cents: number) => Math.round(firstPrice(cents) * tierFor(tiers, clients).current.rate / 100) * clients;
  const wholesaleUnit = Math.round(proAnnual * (100 - program.wholesale_discount_pct) / 100);

  const personas = [
    {
      icon: Briefcase,
      title: 'Agências de marketing',
      pitch: 'Seus clientes já precisam de uma bio profissional. Inclua o BioFlowzy no seu pacote, monte as páginas pelo seu painel e ganhe em cada renovação.',
      example: `30 clientes no Pro anual = ${brl(yearly(30, proAnnual))} por ano`,
      bullets: ['Edite as páginas dos clientes no seu painel', program.wholesale_enabled ? `Ou compre licenças com ${program.wholesale_discount_pct}% off e revenda` : 'Alerta de renovação dos clientes', 'Mais um serviço recorrente na sua carteira'],
    },
    {
      icon: Megaphone,
      title: 'Criadores de conteúdo',
      pitch: 'Sua audiência vende pelo Instagram e pelo WhatsApp. Um post ou story com seu link e seu cupom vira renda todo mês.',
      example: `50 assinantes no Pro anual = ${brl(yearly(50, proAnnual))} por ano`,
      bullets: [`Cupom de ${program.coupon_discount_pct}% exclusivo para seu público`, program.trial_days > 0 ? `${program.trial_days} dias de Pro grátis para quem chega por você` : 'Link que vale por ' + program.cookie_days + ' dias', 'Textos e QR code prontos para divulgar'],
    },
    {
      icon: Users,
      title: 'Mídias e comunidades',
      pitch: 'Portais, newsletters, cursos e grupos de empreendedores: ofereça uma ferramenta útil para quem te acompanha e monetize sua base.',
      example: `100 assinantes no Business anual = ${brl(yearly(100, bizAnnual))} por ano`,
      bullets: [`Chegue ao nível ${top?.name ?? 'máximo'} com ${top?.rate ?? 40}% de comissão`, 'Bônus ao bater metas de clientes', 'Painel com cliques, cadastros e vendas'],
    },
    {
      icon: UserRound,
      title: 'Social media e freelancers',
      pitch: 'Você já monta a presença digital do cliente. Entregue a bio pronta, com WhatsApp, links e analytics, e receba enquanto ele continuar assinando.',
      example: `10 clientes no Pro anual = ${brl(yearly(10, proAnnual))} por ano`,
      bullets: ['Convite de cliente gerenciado', 'O cliente continua dono da conta', 'Saque por PIX'],
    },
  ];

  const faq = [
    { q: 'Quanto custa para ser parceiro?', a: 'Nada. A parceria é gratuita e você continua usando sua conta do BioFlowzy normalmente.' },
    {
      q: 'Por quanto tempo recebo a comissão?',
      a: program.recurring_months > 0
        ? `Em todos os pagamentos do cliente durante ${program.recurring_months} meses a partir do primeiro pagamento.`
        : 'Em todos os pagamentos do cliente, enquanto ele continuar pagando e você estiver ativo na parceria. Não é só na primeira venda.',
    },
    { q: 'Quando posso sacar?', a: `Cada comissão fica ${program.hold_days} dias em carência (prazo de reembolso) e depois fica disponível. O saque é por PIX a partir de ${brl(program.min_payout_cents)}.` },
    { q: 'Como o cliente fica ligado a mim?', a: `Pelo seu link (vale por ${program.cookie_days} dias), pelo seu cupom no checkout ou pelo convite que você cria no painel. O vínculo fica definitivo no primeiro pagamento.` },
    ...(program.wholesale_enabled
      ? [{ q: 'Qual a diferença entre indicar e revender?', a: `Na indicação, o cliente paga direto ao BioFlowzy e você recebe a comissão. Na revenda, você compra licenças com ${program.wholesale_discount_pct}% de desconto (mínimo de ${program.wholesale_min_qty}), cobra o cliente como quiser e fica com a diferença.` }]
      : []),
    { q: 'Posso gerenciar a página dos meus clientes?', a: 'Sim. Com o convite de cliente gerenciado, a página do cliente aparece no seu painel para você editar, e o cliente continua dono da conta.' },
    { q: 'O que não é permitido?', a: 'Indicar a si mesmo, criar contas duplicadas, fazer spam e anunciar usando a marca BioFlowzy. Isso cancela as comissões envolvidas.' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <AttributionCapture />
      <Nav />

      <section className="pt-32 pb-16 bg-bioyellow border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold"><Handshake className="w-3 h-3" /> PROGRAMA DE PARCEIROS</span>
          <h1 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95]">Transforme seus clientes e sua audiência em renda recorrente</h1>
          <p className="mt-5 text-base md:text-lg text-black/75 max-w-2xl mx-auto">
            Indique o BioFlowzy e ganhe até {top?.rate ?? 40}% de cada pagamento dos clientes que você trouxer, todos os meses em que eles continuarem
            assinando. Para agências, criadores de conteúdo, mídias e freelancers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#candidatura" className="brutal-btn bg-black text-white px-6 py-3 gap-2 inline-flex">Quero ser parceiro <ArrowRight className="w-4 h-4" /></a>
            <a href="#ganhos" className="brutal-btn bg-white px-6 py-3 inline-flex">Simular meus ganhos</a>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            {[
              [`até ${top?.rate ?? 40}%`, 'de comissão recorrente'],
              [`${program.coupon_discount_pct}% off`, 'para seus clientes'],
              program.trial_days > 0 ? [`${program.trial_days} dias`, 'de Pro grátis pelo seu link'] : [`${program.cookie_days} dias`, 'de validade do seu link'],
              ['PIX', `saque a partir de ${brl(program.min_payout_cents)}`],
            ].map(([big, small]) => (
              <div key={small} className="brutal-card bg-white p-4">
                <p className="font-display text-2xl md:text-3xl">{big}</p>
                <p className="text-xs font-bold text-black/70">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">Uma oportunidade para cada perfil</h2>
          <p className="text-center text-black/70 mt-2 max-w-2xl mx-auto">Exemplos com o plano anual, o cupom no primeiro pagamento e o nível que cada volume alcança.</p>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            {personas.map(p => (
              <div key={p.title} className="brutal-card bg-white p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 bg-bioyellow brutal-border flex items-center justify-center"><p.icon className="w-5 h-5" /></span>
                  <h3 className="font-display text-xl">{p.title}</h3>
                </div>
                <p className="text-sm text-black/75 mt-3">{p.pitch}</p>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm flex-1">
                  {p.bullets.map(b => <li key={b} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" /> {b}</li>)}
                </ul>
                <p className="mt-5 brutal-border bg-biolime px-3 py-2 font-bold text-sm">{p.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-biolime/30 border-y-2 border-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">Duas formas de ganhar</h2>
          <div className={`mt-10 grid gap-5 ${program.wholesale_enabled ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
            <div className="brutal-card bg-white p-6">
              <Repeat className="w-8 h-8" />
              <h3 className="font-display text-2xl mt-3">Indicação com comissão recorrente</h3>
              <p className="text-sm text-black/75 mt-2">O cliente assina pelo seu link, cupom ou convite e paga direto ao BioFlowzy. Você recebe uma porcentagem de cada pagamento, inclusive nas renovações.</p>
              <p className="mt-4 text-sm font-bold">Ex.: cliente no Pro anual paga {brl(firstPrice(proAnnual))} com seu cupom → você recebe {brl(Math.round(firstPrice(proAnnual) * tiers[0].rate / 100))} ({tiers[0].rate}%) e de novo a cada renovação.</p>
            </div>
            {program.wholesale_enabled && (
              <div className="brutal-card bg-white p-6">
                <KeyRound className="w-8 h-8" />
                <h3 className="font-display text-2xl mt-3">Revenda de licenças</h3>
                <p className="text-sm text-black/75 mt-2">Compre licenças com {program.wholesale_discount_pct}% de desconto (a partir de {program.wholesale_min_qty}), inclua no seu pacote de serviços e cobre o cliente como quiser. A margem é toda sua.</p>
                <p className="mt-4 text-sm font-bold">Ex.: licença Pro anual por {brl(wholesaleUnit)} · preço de tabela {brl(proAnnual)} → margem de {brl(proAnnual - wholesaleUnit)} por cliente.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="ganhos" className="py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold"><Trophy className="w-3 h-3" /> NÍVEIS</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4">Quanto mais clientes ativos, maior a sua comissão</h2>
            <p className="mt-3 text-black/70">O nível sobe sozinho conforme o número de clientes pagantes com plano em dia, e a nova porcentagem vale para os próximos pagamentos.</p>
            <div className="mt-6 brutal-card bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black text-white text-left">
                  <tr><th className="p-3">Nível</th><th className="p-3">Clientes pagantes ativos</th><th className="p-3 text-right">Comissão</th></tr>
                </thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={t.name} className="border-t-2 border-black">
                      <td className="p-3 font-bold">{t.name}</td>
                      <td className="p-3">{tiers[i + 1] ? `${t.min} a ${tiers[i + 1].min - 1}` : `${t.min}+`}</td>
                      <td className="p-3 text-right font-display text-xl">{t.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {program.bonuses.length > 0 && (
              <p className="mt-4 text-sm font-bold inline-flex items-start gap-2">
                <Gift className="w-4 h-4 mt-0.5 shrink-0" />
                Bônus de meta: {program.bonuses.map(b => `${brl(b.cents)} ao chegar a ${b.clients} clientes`).join(' · ')}
              </p>
            )}
          </div>
          <PartnerSimulator program={program} />
        </div>
      </section>

      <section className="py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">Um produto fácil de vender</h2>
          <p className="text-center text-white/70 mt-2 max-w-2xl mx-auto">Você indica uma ferramenta que o cliente entende em 2 minutos e usa todos os dias.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Rocket, t: 'Começa grátis', d: 'O cliente cria a página sem cartão. Sem barreira para dizer sim.' },
              ...(program.trial_days > 0 ? [{ icon: Sparkles, t: `${program.trial_days} dias de Pro`, d: 'Quem chega pelo seu link testa os recursos pagos antes de decidir.' }] : []),
              { icon: BadgePercent, t: 'Preço acessível', d: `Pro a partir de ${brl(monthlyPrice('pro', 'annual'))}/mês no plano anual, com ${program.coupon_discount_pct}% off pelo seu cupom.` },
              { icon: ChartLine, t: 'Resultado visível', d: 'WhatsApp, links, captura de contatos e relatório de cliques: o cliente vê o retorno.' },
              { icon: Users, t: 'Para qualquer negócio', d: 'Lojas, restaurantes, profissionais liberais, criadores e prestadores de serviço.' },
              { icon: CalendarClock, t: 'Renovação no seu radar', d: 'Seu painel avisa quem vence nos próximos dias para você manter o cliente e a comissão.' },
            ].map(b => (
              <div key={b.t} className="border-2 border-white p-5">
                <b.icon className="w-6 h-6 text-bioyellow" />
                <h3 className="font-display text-lg mt-3">{b.t}</h3>
                <p className="text-sm text-white/70 mt-1">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">O que você recebe como parceiro</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Handshake, t: 'Link e cupom exclusivos', d: 'Seu link rastreado e um cupom com seu nome para vendas no WhatsApp ou presenciais.' },
              { icon: ChartLine, t: 'Painel do Parceiro', d: 'Cliques, cadastros, clientes pagantes, vendas e comissões em tempo real.' },
              { icon: Users, t: 'Clientes gerenciados', d: 'Convide clientes e edite as páginas deles direto do seu painel.' },
              { icon: Wallet, t: 'Saque por PIX', d: `Comissões liberadas após ${program.hold_days} dias, saque a partir de ${brl(program.min_payout_cents)}.` },
            ].map(b => (
              <div key={b.t} className="brutal-card bg-white p-5">
                <b.icon className="w-6 h-6" />
                <h3 className="font-display text-lg mt-3">{b.t}</h3>
                <p className="text-sm text-black/70 mt-1">{b.d}</p>
              </div>
            ))}
          </div>
          <ol className="mt-12 grid md:grid-cols-4 gap-4">
            {[
              ['Candidate-se', 'Preencha o formulário abaixo. Respondemos em até 2 dias úteis.'],
              ['Receba link e cupom', 'Seu painel é liberado com tudo pronto para divulgar.'],
              ['Traga clientes', 'Divulgue, convide ou monte as páginas dos seus clientes.'],
              ['Ganhe todo mês', 'Comissão em cada pagamento aprovado, com saque por PIX.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="w-9 h-9 shrink-0 bg-black text-white font-display flex items-center justify-center">{i + 1}</span>
                <div><h3 className="font-display text-lg leading-tight">{t}</h3><p className="text-sm text-black/70 mt-1">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="candidatura" className="py-20 bg-biolime/30 border-y-2 border-black scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center">Quero ser parceiro</h2>
          <p className="text-center text-black/70 mt-2 mb-8">Leva 2 minutos. Respondemos pelo WhatsApp.</p>
          <div className="brutal-card bg-white p-6">
            <PartnerApplyForm enabled={program.enabled} />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-8">Perguntas frequentes</h2>
          <div className="flex flex-col gap-3">
            {faq.map(f => (
              <details key={f.q} className="brutal-card bg-white p-4 group">
                <summary className="font-bold cursor-pointer list-none flex justify-between gap-3">{f.q}<span className="group-open:rotate-45 transition-transform">+</span></summary>
                <p className="text-sm text-black/70 mt-2">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="#candidatura" className="brutal-btn bg-black text-white px-6 py-3 gap-2 inline-flex">Quero ser parceiro <ArrowRight className="w-4 h-4" /></a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
