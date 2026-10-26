import { PLANS, type PaidPlanSlug } from '@/lib/plans';
import { FAQS } from './faq-data';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');

// Dados estruturados (schema.org) da página inicial: o produto com os preços e as perguntas frequentes
export function StructuredData() {
  const offers = [
    { '@type': 'Offer', name: PLANS.free.name, price: '0', priceCurrency: 'BRL' },
    ...(['pro', 'business'] as PaidPlanSlug[])
      .filter(slug => PLANS[slug].available)
      .map(slug => ({
        '@type': 'Offer',
        name: `${PLANS[slug].name} anual`,
        price: (PLANS[slug].prices.annual / 100).toFixed(2),
        priceCurrency: 'BRL',
      })),
  ];

  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BioFlowzy',
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'pt-BR',
      description: 'Crie sua página de link na bio com WhatsApp, captura de contatos, analytics, QR code e domínio próprio.',
      offers,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // JSON gerado no servidor a partir de constantes do código; "<" escapado para não fechar a tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
