import type { Metadata } from 'next';
import { LegalPage, Section } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Privacidade | BioFlowzy',
  description: 'Quais dados a BioFlowzy coleta, para que usa, com quem compartilha e como exercer seus direitos pela LGPD.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro={`Esta Política explica como a ${LEGAL.brand} trata dados pessoais de quem tem conta e de quem visita as páginas criadas na plataforma, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).`}
    >
      <Section title="1. Dados que coletamos">
        <p><strong>De quem cria uma conta:</strong></p>
        <ul>
          <li>e-mail, senha (guardada de forma criptografada), nome e endereço da página;</li>
          <li>o conteúdo que você publica: textos, fotos, links, banners, vídeos e configurações de tema;</li>
          <li>de onde veio o seu cadastro (por exemplo, Instagram ou o selo de outra página), para entendermos nossos canais;</li>
          <li>histórico de planos e pagamentos. <strong>Não recebemos nem guardamos dados de cartão:</strong> o pagamento é feito no ambiente do Mercado Pago;</li>
          <li>para saques do Indique e ganhe: chave PIX e nome completo do titular, visíveis só para você e para a equipe de administração.</li>
        </ul>
        <p><strong>De quem visita uma página:</strong></p>
        <ul>
          <li>para as estatísticas: origem da visita (por exemplo, Instagram ou QR code), tipo de dispositivo, país e os cliques nos links. <strong>Não armazenamos o endereço IP</strong>: usamos apenas um código irreversível derivado dele para não contar a mesma visita várias vezes;</li>
          <li>se o visitante preencher o formulário de contato: nome, e-mail e/ou WhatsApp, somente com a autorização dele marcada no formulário.</li>
        </ul>
      </Section>

      <Section title="2. Para que usamos">
        <ul>
          <li>prestar o serviço: manter sua conta, publicar sua página e mostrar suas estatísticas (execução de contrato);</li>
          <li>processar pagamentos, comissões e saques (execução de contrato e obrigações legais e fiscais);</li>
          <li>enviar avisos sobre a conta, como vencimento do plano e, no Business, o relatório mensal, que pode ser desligado nas configurações;</li>
          <li>segurança, prevenção de fraudes e de abusos, e melhoria do produto (legítimo interesse);</li>
          <li>entregar ao dono da página os contatos enviados pelo formulário (consentimento do visitante).</li>
        </ul>
        <p>Não vendemos dados pessoais.</p>
      </Section>

      <Section title="3. Contatos captados pelas páginas">
        <p>Quando um visitante envia o formulário de contato de uma página, o <strong>dono da página</strong> decide como usar esses dados e é o controlador deles; a {LEGAL.brand} apenas armazena e entrega as informações (operadora). Quem usa o formulário deve tratar os contatos de acordo com a LGPD e atender aos pedidos dos titulares.</p>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <p>Somente com fornecedores necessários para o funcionamento do serviço, que tratam os dados conforme nossas instruções:</p>
        <ul>
          <li><strong>Supabase:</strong> banco de dados, autenticação e armazenamento de arquivos;</li>
          <li><strong>Netlify:</strong> hospedagem do site e das páginas;</li>
          <li><strong>Mercado Pago:</strong> processamento de pagamentos;</li>
          <li><strong>Resend:</strong> envio de e-mails, como o relatório mensal;</li>
          <li><strong>Meta (Facebook e Instagram):</strong> no site da {LEGAL.brand}, para medir nossos anúncios, com o Meta Pixel e a API de Conversões, só para quem aceitar os cookies de marketing. Ao criar conta ou pagar, enviamos e-mail, WhatsApp e identificador da conta criptografados (hash SHA-256), junto com IP, navegador e o valor da compra;</li>
          <li><strong>Meta Pixel e Google Analytics nas páginas dos usuários:</strong> apenas nas páginas cujos donos ativaram essas integrações, sob responsabilidade deles, e só depois do consentimento do visitante.</li>
        </ul>
        <p>Alguns desses fornecedores podem armazenar dados fora do Brasil, com as garantias exigidas pela LGPD. Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.</p>
      </Section>

      <Section id="cookies" title="5. Cookies e armazenamento no navegador">
        <ul>
          <li>usamos o armazenamento do navegador para manter você conectado, lembrar a página que você está editando e registrar de onde veio a sua primeira visita (por até 30 dias);</li>
          <li><strong>essenciais</strong> (sempre ativos): login, segurança e a sua escolha de cookies;</li>
          <li><strong>estatísticas</strong> (opcionais): Google Analytics nas páginas dos usuários que ativaram essa integração;</li>
          <li><strong>marketing</strong> (opcionais): Meta Pixel no site da {LEGAL.brand} e nas páginas dos usuários que ativaram essa integração; o Meta pode usar cookies próprios, como _fbp e _fbc.</li>
        </ul>
        <p>Cookies de estatísticas e de marketing só são usados depois que você aceita no banner. Você pode mudar sua escolha a qualquer momento em &quot;Preferências de cookies&quot;, no rodapé do site, ou apagar esses dados nas configurações do seu navegador.</p>
      </Section>

      <Section title="6. Por quanto tempo guardamos">
        <ul>
          <li>dados da conta e conteúdo: enquanto a conta existir; após a exclusão, apagamos ou anonimizamos, salvo o que a lei obriga a manter;</li>
          <li>registros de pagamentos e comissões: pelo prazo exigido pela legislação fiscal;</li>
          <li>estatísticas de visitas: enquanto forem úteis para os relatórios da conta.</li>
        </ul>
      </Section>

      <Section title="7. Seus direitos">
        <p>Pela LGPD, você pode pedir a confirmação e o acesso aos seus dados, a correção, a portabilidade, a anonimização ou exclusão, informações sobre compartilhamento e a revogação de consentimentos. Muitos dados podem ser corrigidos direto no painel; para os demais pedidos, fale com a gente pelo contato abaixo. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      </Section>

      <Section title="8. Segurança">
        <p>Usamos conexão criptografada (HTTPS), controle de acesso por conta e regras no banco de dados que impedem um usuário de ver ou alterar dados de outro. Nenhum sistema é 100% seguro; se houver um incidente relevante, avisaremos os afetados e a ANPD conforme a lei.</p>
      </Section>

      <Section title="9. Crianças e adolescentes">
        <p>O serviço é destinado a maiores de 18 anos ou a menores com autorização do responsável legal. Não coletamos intencionalmente dados de crianças.</p>
      </Section>

      <Section title="10. Mudanças nesta Política">
        <p>Podemos atualizar esta Política. A data no topo indica a versão atual, e mudanças relevantes serão avisadas no site ou no painel.</p>
      </Section>
    </LegalPage>
  );
}
