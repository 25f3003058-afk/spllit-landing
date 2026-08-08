import Link from 'next/link';

import { SITE, SOCIALS } from '@/content/site';

/**
 * Copyright line, statutory links and the social profiles.
 *
 * Terms and Privacy have to be reachable from anywhere, not only from the
 * cookie banner — which disappears for good once it is answered, taking the
 * only route to the privacy policy with it.
 *
 * The social links are not decoration: they are the on-page half of the
 * `sameAs` claim in the JSON-LD graph. A crawler that sees the site assert a
 * profile *and* link to it treats the two as the same entity far more readily
 * than one that only sees the assertion.
 */
export function LegalFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            /**
             * `me` alongside noopener: rel="me" is the microformats convention
             * for "this profile is the same entity as this site", and is read
             * by several verification systems.
             */
            rel="me noopener noreferrer"
            className="font-medium text-ink-muted transition-colors hover:text-ink"
          >
            {social.label}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-ink-subtle">
        <span>© {year} {SITE.name}. All rights reserved.</span>
        <Link href="/about" className="transition-colors hover:text-ink">
          About
        </Link>
        <Link href="/blog" className="transition-colors hover:text-ink">
          Guides
        </Link>
        <Link href="/legal/safety" className="transition-colors hover:text-ink">
          Safety
        </Link>
        <Link href="/legal/terms" className="transition-colors hover:text-ink">
          Terms
        </Link>
        <Link href="/legal/privacy" className="transition-colors hover:text-ink">
          Privacy
        </Link>
        {/*
          Refunds is linked from the footer rather than buried in the Terms
          because it has to be reachable from any page for a payment provider's
          compliance review — and because someone chasing ₹2 back should not
          have to read a contract to find out how.
        */}
        <Link href="/legal/refunds" className="transition-colors hover:text-ink">
          Refunds
        </Link>
        <Link href="/legal" className="transition-colors hover:text-ink">
          All policies
        </Link>
        <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-ink">
          Contact
        </a>
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-subtle">
        Spllit connects students travelling the same way. It is not a transport
        provider and does not employ drivers or operate vehicles.
      </p>
    </footer>
  );
}
