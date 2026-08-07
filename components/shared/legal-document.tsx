import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { LEGAL_UPDATED, type LegalSection } from '@/content/legal';

/**
 * Shared renderer for the legal pages. One component so Terms and Privacy
 * cannot drift into two slightly different layouts.
 */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-2xl pb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <h1 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">
        {title}
      </h1>
      <p className="mt-1 text-[12.5px] text-ink-subtle">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">{intro}</p>

      {/* Numbered so a clause can be referred to by number in support threads. */}
      <ol className="mt-8 space-y-8">
        {sections.map((section, index) => (
          <li key={section.heading}>
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
              <span className="mr-2 text-ink-subtle">{index + 1}.</span>
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}

            {section.bullets ? (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-subtle"
                    />
                    <span className="text-[13.5px] leading-relaxed text-ink-muted">{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-10 rounded-lg border border-dashed border-line px-4 py-3 text-[12.5px] leading-relaxed text-ink-subtle">
        This document describes how Spllit actually works today rather than
        reserving rights over features that do not exist. It has not been
        reviewed by a lawyer, and should be before Spllit takes payment or opens
        beyond a pilot.
      </p>
    </div>
  );
}
