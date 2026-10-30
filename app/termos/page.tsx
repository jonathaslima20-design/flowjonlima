import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Termos de Uso | BioFlowzy',
  description: 'Regras de uso da BioFlowzy: conta, planos e pagamentos, indicações, conteúdo permitido e responsabilidades.',
  alternates: { canonical: '/termos' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro={`Estes Termos regem o uso da ${LEGAL.brand} (${LEGAL.site}), plataforma para criar páginas de link na bio. Ao criar uma conta ou usar o serviço, você concorda com eles e com a nossa Política de Privacidade.`}
    >
      <Section title="1. O serviço">
        <p>A {LEGAL.brand} permite criar páginas públicas com links, redes sociais, banners, vídeos, formulário de contato e outros recursos, além de acompanhar estatísticas de visitas e cliques. Os recursos de cada plano estão descritos na página de preços e podem evoluir com o tempo.</p>
      </Section>

      <Section title="2. Sua conta">
        <ul>
          <li>Você precisa ter 18 anos ou mais, ou autorização do seu responsável legal.</li>
          <li>As informações do cadastro devem ser verdadeiras, e você é responsável por manter sua senha em segurança e por tudo o que acontece na sua conta.</li>
          <li>O endereço da página (bioflowzy.com/seunome) é seu enquanto a conta estiver ativa. Podemos recusar ou recuperar endereços que imitem marcas, pessoas ou órgãos, ou que confundam os visitantes.</li>
          <li>Se você der acesso de edição a outras pessoas (plano Business), continua responsável pelo que elas publicarem.</li>
        </ul>
      </Section>

      <Section title="3. Planos e pagamentos">
        <ul>
          <li>O plano Free é gratuito. Os planos pagos (Pro e Business) são contratados por período, trimestral ou anual, com pagamento único processado pelo Mercado Pago (PIX, cartão ou boleto).</li>
          <li><strong>Não há renovação automática:</strong> ao fim do período, a conta volta para o Free, a menos que você pague um novo período. Antes do vencimento avisamos no painel.</li>
          <li>Ao trocar de plano com o atual ainda vigente, os dias restantes são convertidos para o novo plano, proporcionalmente ao preço anual de cada um.</li>
          <li>Ao voltar para o Free, os recursos pagos deixam de funcionar (por exemplo: domínio próprio, temas Pro, páginas extras e acesso da equipe), mas seus dados não são apagados.</li>
          <li><strong>Direito de arrependimento:</strong> você pode desistir da compra em até 7 dias após o pagamento e receber o valor integral de volta, conforme o art. 49 do Código de Defesa do Consumidor. Basta falar com o suporte.</li>
          <li>Os preços podem mudar, mas a mudança nunca afeta um período já pago.</li>
        </ul>
      </Section>

      <Section title="4. Indique e ganhe">
        <ul>
          <li>Assinantes com o recurso no plano recebem um link de indicação. Quando alguém se cadastra por ele e tem o primeiro pagamento aprovado, quem indicou recebe uma comissão de 30% desse pagamento.</li>
          <li>Comissões podem ser sacadas via PIX pelo painel, conforme as regras exibidas lá. Pagamentos estornados ou reembolsados não geram comissão.</li>
          <li>Autoindicação, contas falsas, spam ou qualquer fraude cancelam as comissões envolvidas e podem levar à suspensão da conta.</li>
        </ul>
      </Section>

      <Section title="5. Uso aceitável">
        <p>Não é permitido usar a {LEGAL.brand} para:</p>
        <ul>
          <li>publicar conteúdo ilegal, que incentive violência, ódio ou discriminação, ou que explore menores;</li>
          <li>golpes, phishing, pirâmides financeiras, venda de produtos proibidos ou links para malware;</li>
          <li>se passar por outra pessoa, marca ou órgão, ou sugerir uma verificação ou parceria que não existe;</li>
          <li>enviar spam, coletar dados de visitantes sem consentimento ou burlar os limites técnicos do serviço;</li>
          <li>violar direitos autorais, marcas ou a privacidade de terceiros.</li>
        </ul>
        <p>Podemos remover conteúdo, suspender ou encerrar contas que descumpram estas regras, com ou sem aviso prévio conforme a gravidade.</p>
      </Section>

      <Section id="direitos-autorais" title="6. Seu conteúdo e direitos autorais">
        <p>O conteúdo que você publica continua sendo seu. Você nos autoriza a armazená-lo e exibi-lo apenas para prestar o serviço (por exemplo, mostrar sua página e gerar prévias de compartilhamento).</p>
        <p>Se você acredita que uma página na {LEGAL.brand} viola seus direitos autorais ou de marca, envie uma notificação pelo contato abaixo com o endereço da página, a descrição do conteúdo e a comprovação do seu direito. Analisaremos e, se for o caso, removeremos o conteúdo.</p>
      </Section>

      <Section title="7. Domínio próprio, integrações e serviços de terceiros">
        <p>Domínios próprios, Meta Pixel, Google Analytics e links externos dependem de serviços de terceiros. Você é responsável pelo seu domínio e pelas configurações de DNS, e pelo uso dessas integrações de acordo com as regras de cada serviço e com a LGPD.</p>
      </Section>

      <Section title="8. Disponibilidade e responsabilidade">
        <ul>
          <li>Trabalhamos para manter o serviço no ar o tempo todo, mas podem ocorrer interrupções para manutenção ou por falhas de fornecedores.</li>
          <li>Não nos responsabilizamos pelo conteúdo publicado pelos usuários, pelos sites para onde os links apontam nem por negociações feitas entre você e seus visitantes ou clientes.</li>
          <li>Nada nestes Termos limita direitos que a lei garante ao consumidor.</li>
          <li>Para prestar suporte, resolver problemas técnicos ou verificar violações destes Termos, a equipe de administração pode acessar o painel da sua conta. Cada acesso é registrado internamente, com data e motivo.</li>
        </ul>
      </Section>

      <Section title="9. Encerramento da conta">
        <p>Você pode parar de usar o serviço quando quiser e pedir a exclusão da conta pelo suporte. Também podemos encerrar contas que violem estes Termos. Dados são tratados conforme a <Link href="/privacidade" className="underline font-bold">Política de Privacidade</Link>.</p>
      </Section>

      <Section title="10. Mudanças nestes Termos">
        <p>Podemos atualizar estes Termos. Mudanças relevantes serão avisadas no site ou no painel antes de entrarem em vigor. Continuar usando o serviço depois disso significa concordar com a nova versão.</p>
      </Section>

      <Section title="11. Lei aplicável">
        <p>Estes Termos seguem as leis do Brasil. Fica eleito o foro do domicílio do consumidor para resolver qualquer questão.</p>
      </Section>
    </LegalPage>
  );
}
