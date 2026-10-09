import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'Terms of service | Finvest AI',
  description: 'The terms for using Finvest AI, including the investment disclaimer.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="These terms govern your use of Finvest AI, a research tool operated by Finvest Studios. By creating an account or using the service, you agree to them."
    >
      <section>
        <h2>The service</h2>
        <p>
          Finvest AI helps you read public company filings, index your own documents, ask questions about them and
          generate analysis. The service is in active development, so features may change, and it may occasionally be
          unavailable.
        </p>
      </section>

      <section>
        <h2 id="investment-disclaimer">Not investment advice</h2>
        <p>
          <strong>Nothing in Finvest AI is investment, financial, legal, accounting or tax advice,</strong> and nothing
          in it is a recommendation to buy, sell or hold any security. Answers, summaries, SWOT analyses, ratios and
          trends are generated automatically and can be incomplete, out of date or wrong, even when they cite a source.
        </p>
        <p>
          Always check important figures against the original filing, and make your own decisions or consult a
          qualified professional. You are solely responsible for any decisions you make using the service.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be at least 18 years old to use Finvest AI.</li>
          <li>Keep your login details secure. You are responsible for activity under your account.</li>
          <li>Give accurate information when you sign up, and tell us if you suspect your account has been misused.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of the documents and text you add. You give us permission to store and process that
          content only as needed to provide the service to you, including sending it to the providers described in
          our <Link href="/privacy">privacy policy</Link>. Only add content you have the right to use.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>break the law, or infringe anyone else&apos;s rights, through the service;</li>
          <li>attempt to access other users&apos; data, or probe, disrupt or overload our systems;</li>
          <li>scrape the service, or use it to make automated bulk requests to SEC EDGAR or other data sources;</li>
          <li>resell the service, or present generated output as professional advice to others.</li>
        </ul>
      </section>

      <section>
        <h2>Third-party data</h2>
        <p>
          Filings, market data and company logos come from third parties such as SEC EDGAR, Finnhub and Financial
          Modeling Prep. We do not control them and cannot guarantee their accuracy, completeness or availability.
        </p>
      </section>

      <section>
        <h2>Suspension and termination</h2>
        <p>
          You can stop using Finvest AI at any time and ask us to delete your account. We may suspend or close accounts
          that breach these terms or put the service or other users at risk.
        </p>
      </section>

      <section>
        <h2>Disclaimers and liability</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind,
          to the fullest extent the law allows. To the same extent, Finvest Studios is not liable for indirect,
          incidental or consequential losses, or for losses arising from decisions made using the service. Nothing in
          these terms limits liability that cannot be limited by law.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. If we make material changes, we will update the date at the top of this page and,
          where appropriate, let you know in the app. Continuing to use the service after that means you accept the
          updated terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
