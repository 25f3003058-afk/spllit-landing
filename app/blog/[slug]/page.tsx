import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BLOG_POSTS, findPost } from '@/content/blog';
import { SITE } from '@/content/site';
import { ArticleStructuredData } from '@/components/shared/structured-data';
import { LegalFooter } from '@/components/shared/legal-footer';

/**
 * Pre-rendered at build time. These are the pages meant to rank, so they have
 * to be static HTML a crawler can read without executing anything.
 */
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: [...post.tags],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  return (
    <main className="px-4 py-10 sm:px-6">
      <ArticleStructuredData
        title={post.title}
        description={post.description}
        slug={post.slug}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
      />

      <article className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          ← All guides
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-ink-subtle">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h1 className="mt-3 font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[36px]">
          {post.title}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{post.excerpt}</p>

        <div className="mt-10 space-y-9">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand"
                      />
                      <span className="text-[14px] leading-relaxed text-ink-muted">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-line bg-surface p-6 text-center shadow-soft">
          <p className="font-display text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Travelling somewhere this week?
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">
            Find someone from your campus going the same way.
          </p>
          <Link
            href="/auth"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-brand-fg transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <LegalFooter className="mt-14 border-t border-line pt-6" />
      </article>
    </main>
  );
}
