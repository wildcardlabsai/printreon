import { createFileRoute } from "@tanstack/react-router";

const SECTIONS = [
  { id: "eligibility", n: "1", title: "Account eligibility & responsibilities" },
  { id: "ip", n: "2", title: "Intellectual property rights & ownership" },
  { id: "quality", n: "3", title: "File quality, mesh standards & AI policy" },
  { id: "licences", n: "4", title: "Merchant licences & dynamic verification" },
  { id: "payouts", n: "5", title: "Fees, payouts & Stripe Connect" },
  { id: "prohibited", n: "6", title: "Prohibited content & termination" },
  { id: "liability", n: "7", title: "Limitation of liability & indemnification" },
  { id: "changes", n: "8", title: "Amendments & governing law" },
] as const;

export const Route = createFileRoute("/legal/creator-agreement")({
  head: () => ({
    meta: [
      { title: "Creator Agreement — Printreon" },
      { name: "description", content: "The Printreon Creator Agreement: ownership, mesh quality standards, AI policy, merchant licences, fees and payouts via Stripe Connect." },
      { property: "og:title", content: "Creator Agreement — Printreon" },
      { property: "og:description", content: "Terms for creators publishing 3D model drops and subscriber tiers on Printreon." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorAgreementPage,
});

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-8">
      <h2 className="!mb-4 flex items-baseline gap-3">
        <span className="font-mono text-sm text-primary">{n}</span>
        <span>{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Clause({ n, title, children }: { n: string; title?: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="font-mono text-sm text-primary">{n}</span>{" "}
      {title ? <strong>{title}</strong> : null}
      {title ? " " : null}
      {children}
    </p>
  );
}

function CreatorAgreementPage() {
  return (
    <article className="text-ink">
      <h1>Creator Agreement</h1>
      <p className="!mt-1 text-sm text-ink-soft">Last updated: 3 September 2026</p>

      <p>
        This Creator Agreement ("Agreement") forms a legally binding contract between Printreon ("Platform", "we",
        "us", or "our") and you ("Creator", "Designer", or "User"). By creating a Creator Account, uploading 3D
        digital assets, or offering subscriber tiers on Printreon.com, you agree to comply with and be bound by the
        terms outlined below.
      </p>

      <nav className="not-prose my-8 rounded-2xl border border-border bg-surface p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">On this page</div>
        <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-sm text-ink-soft hover:text-primary">
                <span className="font-mono text-xs text-primary">{s.n}.</span> {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        <Section id="eligibility" n="1" title="Account eligibility & responsibilities">
          <Clause n="1.1" title="Age requirement.">
            You must be at least 18 years old, or the age of legal majority in your jurisdiction, to register as a
            Creator on Printreon.
          </Clause>
          <Clause n="1.2" title="Account security.">
            You are solely responsible for maintaining the confidentiality of your account credentials and for all
            activities, drops and payouts that occur under your account.
          </Clause>
          <Clause n="1.3" title="Identity & payout verification.">
            To receive payouts, Creators must complete identity and bank verification via our payment processor,
            Stripe Connect Express. You agree to provide accurate legal and financial details.
          </Clause>
        </Section>

        <Section id="ip" n="2" title="Intellectual property rights & ownership">
          <Clause n="2.1" title="Creator retains ownership.">
            You retain full ownership, copyright and intellectual property (IP) rights to all 3D digital files
            (.stl, .3mf, .obj, etc.), images, models and metadata uploaded to Printreon. Printreon does not claim
            ownership over your digital assets.
          </Clause>
          <Clause n="2.2" title="Licence to Printreon.">
            By uploading assets to the Platform, you grant Printreon a non-exclusive, worldwide, royalty-free licence
            to host, store, display, index, render and distribute your content solely for the purposes of operating
            the Platform, rendering previews, enabling subscriber downloads and marketing your drops.
          </Clause>
          <Clause n="2.3" title="Non-infringement & originality.">
            You warrant and guarantee that all uploaded content is your original work, or that you hold all necessary
            legal licences, permissions and rights to distribute it commercially. Uploading copyrighted fan-art
            without proper permission, or unauthorised re-uploads of third-party IP, is strictly prohibited and
            subject to immediate account termination.
          </Clause>
        </Section>

        <Section id="quality" n="3" title="File quality, mesh standards & anti-AI policy">
          <p>
            To maintain high platform standards for print farms and individual makers, all Creators agree to adhere to
            Printreon's quality gatekeeping requirements.
          </p>
          <Clause n="3.1" title="Mesh quality & manifold standards.">
            All 3D model files uploaded must be properly retopologised, manifold (watertight), and free of flipped
            normals or unclosed geometry that causes slicer errors.
          </Clause>
          <Clause n="3.2" title="Physical print proof & badging." children={null} />
          <ul className="!mt-0">
            <li>
              <strong>Print-Tested badge (green).</strong> May only be applied to drops if the model has been
              physically printed, verified, and accompanied by real-world physical print photos.
            </li>
            <li>
              <strong>Digital Sculpt badge (blue).</strong> Must be applied to drops that have only been digitally
              rendered and have not yet been physically test-printed.
            </li>
          </ul>
          <Clause n="3.3" title="Raw AI mesh policy.">
            The direct uploading of raw, unedited, auto-generated AI mesh dumps without manual cleanup, retopology,
            manifold verification and physical print testing is strictly prohibited. Printreon reserves the right to
            remove any file drop that fails fundamental slicing or printability standards.
          </Clause>
          <Clause n="3.4" title="Native .3mf & profile versioning.">
            Creators updating print profiles or multi-colour AMS/MMU layer maps agree to use Printreon's native file
            versioning system under the original drop, rather than publishing duplicate uploads or breaking existing
            subscriber download links.
          </Clause>
        </Section>

        <Section id="licences" n="4" title="Merchant licences & dynamic licence verification">
          <Clause n="4.1" title="Commercial tiers.">
            Creators offering Commercial / Merchant Subscription Tiers grant active tier subscribers a non-exclusive,
            non-transferable licence to print and sell physical 3D prints of the Creator's specified digital models.
          </Clause>
          <Clause n="4.2" title="Automated licence validation.">
            Creators acknowledge that Printreon issues Dynamic Merchant Keys and live verification badges to
            commercial subscribers.
          </Clause>
          <Clause n="4.3" title="Licence revocation upon churn.">
            If a commercial subscriber cancels, pauses or fails to renew their subscription, their Dynamic Merchant
            Key will automatically invalidate. Creators agree that Printreon's automated key system serves as the
            legal source of truth for active commercial licence verification.
          </Clause>
          <Clause n="4.4" title="Digital file protection.">
            Commercial merchant licences permit the sale of physical prints only. Under no circumstances may a
            merchant subscriber resell, share, redistribute or remix the Creator's underlying digital files (.3mf,
            .stl, etc.).
          </Clause>
        </Section>

        <Section id="payouts" n="5" title="Fees, payouts & Stripe Connect">
          <Clause n="5.1" title="Platform take-rate.">
            Printreon charges a standard platform fee on subscription payouts and single-file purchases, as detailed
            in your Creator Dashboard. Discounted rates apply during the Public Beta cohort.
          </Clause>
          <Clause n="5.2" title="Payment processing.">
            All payments are processed directly via Stripe Connect Express. Processing fees levied by Stripe (for
            example card transaction fees and currency conversion fees) are deducted prior to net payout distribution.
          </Clause>
          <Clause n="5.3" title="Chargebacks & refunds.">
            Digital files are non-refundable once downloaded. In the event of a buyer chargeback or dispute, Printreon
            reserves the right to deduct the disputed amount and associated chargeback fees from the Creator's Stripe
            balance.
          </Clause>
        </Section>

        <Section id="prohibited" n="6" title="Prohibited content & account termination">
          <Clause n="6.1" title="Prohibited assets." children={null} />
          <p className="!mt-0">Creators may not upload or distribute:</p>
          <ul className="!mt-0">
            <li>Content that violates local or international laws.</li>
            <li>Weapons, dangerous items, or illegal components prohibited by regulatory authorities.</li>
            <li>Malicious software, viruses, or corrupted archive drops.</li>
            <li>Assets that infringe upon the trademark, patent or copyright of third parties.</li>
          </ul>
          <Clause n="6.2" title="Termination.">
            Printreon reserves the right to suspend or terminate any Creator account, revoke access to the Platform,
            and remove drops without prior notice if the Creator violates this Agreement, engages in fraudulent
            activity, or repeatedly uploads unprintable or infringing files.
          </Clause>
        </Section>

        <Section id="liability" n="7" title="Limitation of liability & indemnification">
          <Clause n="7.1" title="Indemnification.">
            You agree to indemnify, defend and hold harmless Printreon, its founders, directors and affiliates from
            any claims, damages, losses, liabilities and expenses (including legal fees) arising from your uploaded
            content, breach of third-party copyright, or violation of this Agreement.
          </Clause>
          <Clause n="7.2" title="Disclaimer.">
            Printreon provides the Platform on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee uninterrupted
            server uptime, or that subscribers will not attempt to illegally redistribute your digital files, though
            we employ reasonable technical safeguards to protect your assets.
          </Clause>
        </Section>

        <Section id="changes" n="8" title="Amendments & governing law">
          <Clause n="8.1" title="Changes to terms.">
            Printreon reserves the right to modify this Agreement at any time. Material changes will be communicated
            via the Platform dashboard or email. Continued use of the Platform after changes are posted constitutes
            acceptance of the modified terms.
          </Clause>
          <Clause n="8.2" title="Governing law.">
            This Agreement shall be governed by and construed in accordance with the laws of the United Kingdom,
            without regard to its conflict of law principles.
          </Clause>
        </Section>
      </div>

      <p className="mt-10 text-sm text-ink-soft">
        This Agreement sits alongside our <a href="/legal/terms">Terms of Service</a>.
      </p>
    </article>
  );
}
