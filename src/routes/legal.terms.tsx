import { createFileRoute } from "@tanstack/react-router";

const SECTIONS = [
  { id: "overview", n: "1", title: "Overview & platform role" },
  { id: "eligibility", n: "2", title: "Account eligibility & registration" },
  { id: "quality", n: "3", title: "Creator content, quality & AI policy" },
  { id: "ip", n: "4", title: "Intellectual property & commercial licensing" },
  { id: "payments", n: "5", title: "Payments, fees & payouts" },
  { id: "conduct", n: "6", title: "Prohibited conduct" },
  { id: "dmca", n: "7", title: "Copyright infringement & DMCA" },
  { id: "warranties", n: "8", title: "Disclaimer of warranties" },
  { id: "liability", n: "9", title: "Limitation of liability" },
  { id: "changes", n: "10", title: "Modifications & termination" },
  { id: "contact", n: "11", title: "Contact information" },
] as const;

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service & Creator Agreement — Printreon" },
      { name: "description", content: "Printreon's Terms of Service and Creator Agreement: badge system, AI policy, licensing, fees, payouts and DMCA." },
      { property: "og:title", content: "Terms of Service & Creator Agreement — Printreon" },
      { property: "og:description", content: "The rules for creators and supporters on Printreon, including our quality standards and strict ban on raw AI mesh dumps." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
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

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="!mb-0 text-base font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function TermsPage() {
  return (
    <article className="text-ink">
      <h1>Terms of Service &amp; Creator Agreement</h1>
      <p className="!mt-1 text-sm text-ink-soft">Last updated: 1 September 2026</p>

      <p>
        Welcome to Printreon ("Platform", "we", "us", or "our"), accessible at printreon.com. These Terms of Service
        ("Terms") govern your access to and use of our website, services, applications and tools. By creating an
        account, subscribing to a creator, or publishing content on Printreon, you agree to be legally bound by these
        Terms.
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
        <Section id="overview" n="1" title="Overview & platform role">
          <p>
            Printreon is a specialised membership and file-hosting platform designed for 3D model creators
            ("Creators") to offer recurring subscriptions, digital 3D model drops (e.g. STL, 3MF, OBJ, CAD files),
            slicer profiles and commercial print licences to their supporters ("Supporters").
          </p>
          <p>
            Printreon acts solely as a venue and technical service provider. We are not a party to any contract,
            commercial licence or transaction between Creators and Supporters, except as explicitly outlined regarding
            platform fees and payment routing.
          </p>
        </Section>

        <Section id="eligibility" n="2" title="Account eligibility & registration">
          <ul>
            <li>
              <strong>Age requirement.</strong> You must be at least 18 years old (or the legal age of majority in
              your jurisdiction) to create an account, sell content or subscribe on Printreon.
            </li>
            <li>
              <strong>Account security.</strong> You are responsible for maintaining the confidentiality of your
              account credentials and for all activity that occurs under your account.
            </li>
            <li>
              <strong>Accurate information.</strong> You agree to provide accurate, current and complete information
              during registration, and to keep your payout and profile details up to date.
            </li>
          </ul>
        </Section>

        <Section id="quality" n="3" title="Creator content, quality & AI policy">
          <p>
            To maintain a high standard for our maker community and protect Supporters from unprintable or misleading
            digital files, all Creators must adhere to our Quality &amp; File Integrity Standards.
          </p>

          <Sub title="A. Badge system & representation">
            <p>When publishing a file drop, Creators must accurately assign one of the following verification badges:</p>
            <ul>
              <li>
                <strong>Print-Tested</strong> — the model has been successfully physically 3D printed by the Creator or
                an authorised test printer.
              </li>
              <li>
                <strong>Digital Sculpt</strong> — the model is hand-crafted digitally, watertight (manifold) and scaled
                for slicers, but has not yet been physically test-printed.
              </li>
              <li>
                <strong>AI-Assisted</strong> — the model was developed using 3D AI generation tools and subsequently
                retopologised, repaired and refined manually.
              </li>
            </ul>
            <p>
              Falsifying a file's badge status, or misrepresenting unprinted files as "Print-Tested", constitutes a
              violation of these Terms and may result in content removal or account suspension.
            </p>
          </Sub>

          <Sub title="B. Strict prohibition on raw AI mesh dumps">
            <p>
              Direct, unedited or automated outputs from text-to-3D or image-to-3D AI software ("Raw AI Output") are
              strictly prohibited on Printreon. Any file published on the Platform must undergo manual mesh repair,
              retopology, manifold verification and scale optimisation.
            </p>
          </Sub>

          <Sub title="C. Digital sculptors without physical printers">
            <p>
              Creators who do not own physical 3D printers may publish under the Digital Sculpt badge, provided all
              geometry is watertight (manifold), free of non-manifold edges or inverted normals, and properly scaled
              for standard 3D slicer software.
            </p>
          </Sub>
        </Section>

        <Section id="ip" n="4" title="Intellectual property & commercial licensing">
          <Sub title="A. Ownership">
            <p>
              Creators retain all intellectual property rights, copyrights and ownership over the original 3D models,
              images and files they upload to Printreon.
            </p>
          </Sub>
          <Sub title="B. Licence to Printreon">
            <p>
              By uploading content, Creators grant Printreon a worldwide, non-exclusive, royalty-free licence to host,
              display, resize, thumbnail and distribute the content solely for the purpose of operating, marketing and
              promoting the Platform and Creator profiles.
            </p>
          </Sub>
          <Sub title="C. Licensing to Supporters (personal vs commercial)">
            <ul>
              <li>
                <strong>Personal use tier.</strong> Unless explicitly stated otherwise by the Creator, subscriptions
                grant Supporters a non-exclusive, non-transferable, personal-use licence to download and 3D print the
                models for private use. Supporters may not resell, redistribute, share or sub-licence the digital files
                or physical prints.
              </li>
              <li>
                <strong>Commercial / merchant tiers.</strong> Creators offering commercial tiers grant active
                commercial subscribers a limited, non-exclusive licence to sell physical 3D prints of specified models
                for as long as their commercial subscription remains active.
              </li>
              <li>
                <strong>Automated licence verification.</strong> Printreon provides automated licence verification keys
                and badges. Upon cancellation or expiry of a commercial subscription, the Supporter's commercial licence
                to produce and sell physical prints terminates immediately.
              </li>
            </ul>
          </Sub>
        </Section>

        <Section id="payments" n="5" title="Payments, fees & payouts">
          <Sub title="A. Stripe Connect">
            <p>All financial transactions on Printreon are processed via Stripe Connect.</p>
            <ul>
              <li>Creators must complete Stripe's onboarding process to receive payouts.</li>
              <li>By using Printreon, Creators agree to Stripe's Connected Account Agreement and terms of service.</li>
            </ul>
          </Sub>
          <Sub title="B. Platform fees">
            <p>
              Printreon deducts a platform fee (as specified in the Creator Dashboard at the time of creation or tier
              setup) directly from each transaction prior to payout. Third-party payment processing fees (e.g. Stripe
              processing fees) are deducted from transaction proceeds as outlined in the Creator fee schedule.
            </p>
          </Sub>
          <Sub title="C. Subscriptions & billing">
            <p>
              Supporter subscriptions are billed on a recurring basis (monthly or annually) until cancelled. Supporters
              may cancel their subscription at any time via their account settings.
            </p>
          </Sub>
          <Sub title="D. Refund policy">
            <p>
              Due to the immediate digital delivery of downloadable 3D files (STLs, 3MFs), subscription payments are
              generally non-refundable once file access has been granted. Exceptions may be made at Printreon's sole
              discretion in cases of fraudulent transactions, major platform outages or proven non-delivery of service.
              Creator-specific refund requests must be handled between the Supporter and the Creator.
            </p>
          </Sub>
        </Section>

        <Section id="conduct" n="6" title="Prohibited conduct">
          <p>Users agree not to:</p>
          <ul>
            <li>
              Upload, share or distribute copyrighted models, re-scanned files or derivative works without explicit
              written permission from the original rights holder.
            </li>
            <li>Distribute malicious software, corrupt STL files or embedded exploits.</li>
            <li>Share or leak paid Creator file drops, download links or access credentials outside the Platform.</li>
            <li>Harass, stalk or exploit other Creators or Supporters.</li>
            <li>Attempt to bypass platform fees or trick automated commercial licence verification systems.</li>
          </ul>
        </Section>

        <Section id="dmca" n="7" title="Copyright infringement & DMCA policy">
          <p>
            Printreon respects intellectual property rights and complies with the Digital Millennium Copyright Act
            (DMCA). If you believe your copyrighted work has been infringed on Printreon, submit a DMCA takedown notice
            to our designated agent at <a href="mailto:copyright@printreon.com">copyright@printreon.com</a> including:
          </p>
          <ul>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material claimed to be infringing, and its location/URL on Printreon.</li>
            <li>Your contact information (email address, telephone number).</li>
            <li>
              A statement made under penalty of perjury that the information in the notification is accurate and that
              you are authorised to act on behalf of the copyright owner.
            </li>
          </ul>
          <p>
            Printreon reserves the right to remove infringing content and terminate the accounts of repeat infringers.
          </p>
        </Section>

        <Section id="warranties" n="8" title="Disclaimer of warranties">
          <p>
            Printreon is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by law,
            Printreon disclaims all warranties, express or implied, including fitness for a particular purpose,
            merchantability, mesh accuracy or physical printability of user-uploaded models. Printreon does not
            guarantee that files will slice or print without errors on every specific 3D printer hardware or software
            setup.
          </p>
        </Section>

        <Section id="liability" n="9" title="Limitation of liability">
          <p>
            To the fullest extent permitted by applicable law, Printreon, its founders, directors and employees shall
            not be liable for any indirect, incidental, special, consequential or punitive damages, including loss of
            profits, data, hardware damage (e.g. 3D printer failures or nozzle clogs), or unauthorised access to user
            accounts resulting from your use of the Platform.
          </p>
        </Section>

        <Section id="changes" n="10" title="Modifications & termination">
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by
            updating the "Last updated" date at the top of this page, or via email or platform notification. Your
            continued use of Printreon after changes take effect constitutes acceptance of the revised Terms.
          </p>
          <p>
            Printreon reserves the right to suspend or terminate accounts that violate these Terms or pose security,
            legal or financial risks to the Platform or its community.
          </p>
        </Section>

        <Section id="contact" n="11" title="Contact information">
          <p>If you have questions or concerns regarding these Terms, please contact us at:</p>
          <ul>
            <li>
              Email: <a href="mailto:printreon@gmail.com">printreon@gmail.com</a>
            </li>
            <li>
              Website: <a href="https://printreon.com">https://printreon.com</a>
            </li>
          </ul>
        </Section>
      </div>
    </article>
  );
}
