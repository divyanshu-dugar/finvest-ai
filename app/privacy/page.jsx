import LegalPage from '@/components/legal/LegalPage';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'Privacy policy | Finvest AI',
  description: 'What Finvest AI collects, why, who processes it, and how to have it deleted.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This policy explains what information Finvest AI collects when you use the service, how it is used, which providers process it, and the choices you have. Finvest AI is operated by Finvest Studios."
    >
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account details.</strong> Your username and a hashed password. If you sign in with Google, we receive
            your email address, your name and a Google account identifier. We never see your Google password.
          </li>
          <li>
            <strong>Research content.</strong> The companies you add, documents you upload or paste, filings you import,
            questions you ask, and the answers generated for you.
          </li>
          <li>
            <strong>Technical data.</strong> Our hosting providers keep standard server logs, such as IP addresses,
            request times and error reports, to operate and secure the service.
          </li>
        </ul>
        <p>We do not use advertising trackers, and we do not sell your information.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide the service: indexing your documents, answering questions and generating analysis.</li>
          <li>To keep your account secure and keep the service running reliably.</li>
          <li>To respond when you contact us.</li>
        </ul>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>We rely on a small number of providers to run Finvest AI. Each receives only what it needs to do its job.</p>
        <ul>
          <li>
            <strong>OpenAI</strong> processes the text of your questions, relevant excerpts of documents and filings, and
            document text sent for search indexing, in order to generate answers and embeddings.
          </li>
          <li><strong>MongoDB Atlas</strong> stores your account, companies, documents and research sessions.</li>
          <li><strong>Qdrant Cloud</strong> stores searchable representations of your documents.</li>
          <li><strong>Vercel</strong> and <strong>Render</strong> host the website and application servers.</li>
          <li><strong>Google</strong> handles authentication if you choose to sign in with Google.</li>
          <li>
            <strong>SEC EDGAR, Finnhub and Financial Modeling Prep</strong> supply public filings, market data and company
            logos. Logo images load directly from Financial Modeling Prep, which can see your IP address when they do.
          </li>
        </ul>
      </section>

      <section>
        <h2>Storage on your device</h2>
        <p>
          We keep your sign-in token and a few interface preferences in your browser&apos;s local storage so you stay
          signed in. We do not set advertising or analytics cookies.
        </p>
      </section>

      <section>
        <h2>Retention and deletion</h2>
        <p>
          Your content is kept until you delete it. Deleting a document removes it and its search index; deleting a
          company removes the company and all of its documents. To delete your account and everything associated with
          it, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address linked to your account, or
          include your username, and we will complete the request within 30 days.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>
          You can ask for a copy of your information, ask us to correct or delete it, or object to how it is used.
          Depending on where you live, you may have additional rights under local privacy law. Contact us and we will
          respond within 30 days.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Passwords are hashed, traffic is encrypted in transit, and your research is scoped to your account so other
          users cannot see it. No system is perfectly secure, so please use a strong, unique password.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Finvest AI is not intended for anyone under 18, and we do not knowingly collect information from children.</p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If we make material changes, we will update the date at the top of this page and, where appropriate, let you
          know in the app.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
