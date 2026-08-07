'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Phone mockup carousel.
 *
 * The component the snippet imported was not included with it, so this is a
 * fresh implementation against the same public API — `ImageItem[]` in, a
 * carousel out — which keeps `phone-mockups-1.tsx` usable verbatim.
 *
 * Deliberately not using `cva`/`@radix-ui/react-slot`: this project is not a
 * shadcn CLI install and neither package is a dependency. Adding two runtime
 * deps for one component's class strings is not a trade worth making.
 */

export interface ImageItem {
  src: string;
  alt: string;
}

export interface PhoneCarouselProps {
  images: ImageItem[];
  className?: string;
  /** Milliseconds between automatic advances. 0 disables autoplay. */
  autoPlayMs?: number;
}

/**
 * Signed distance from `active` to `index` around a ring of `total`.
 *
 * Plain subtraction makes the last item travel the whole width backwards to
 * reach the first; this takes the short way round so the loop never visibly
 * rewinds.
 */
function ringOffset(index: number, active: number, total: number): number {
  const raw = index - active;
  const half = total / 2;
  if (raw > half) return raw - total;
  if (raw < -half) return raw + total;
  return raw;
}

function PhoneFrame({ image, priority }: { image: ImageItem; priority: boolean }) {
  return (
    <div
      className={cn(
        'relative aspect-[9/19.5] w-[165px] shrink-0 rounded-[2rem] sm:w-[210px] sm:rounded-[2.4rem] lg:w-[240px]',
        // The bezel is a real border rather than a wrapper div so the screen
        // radius and the frame radius stay concentric at every width.
        'border-[7px] border-neutral-900 bg-neutral-900',
        'shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]',
      )}
    >
      {/* Dynamic island. Sits above the screen, inside the bezel. */}
      <span className="absolute left-1/2 top-2 z-10 h-[18px] w-[74px] -translate-x-1/2 rounded-full bg-neutral-900" />

      <span className="absolute inset-0 overflow-hidden rounded-[1.9rem]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="240px"
          priority={priority}
          className="object-cover"
        />
      </span>

      {/* Screen glare — one soft diagonal highlight, which is what stops the
          frame reading as a flat rectangle with a photo in it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.9rem] bg-gradient-to-br from-white/18 via-transparent to-transparent"
      />
    </div>
  );
}

export function PhoneCarousel({ images, className, autoPlayMs = 3800 }: PhoneCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = images.length;
  const go = useCallback(
    (next: number) => setActive(((next % total) + total) % total),
    [total],
  );

  useEffect(() => {
    if (!autoPlayMs || paused || total < 2) return;
    const timer = setInterval(() => setActive((current) => (current + 1) % total), autoPlayMs);
    return () => clearInterval(timer);
  }, [autoPlayMs, paused, total]);

  if (total === 0) return null;

  return (
    <div
      className={cn('flex w-full flex-col items-center gap-5 sm:gap-7', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="App screens"
    >
      <div
        className="relative flex h-[350px] w-full items-center justify-center sm:h-[440px] lg:h-[500px]"
        style={{ perspective: 1400 }}
      >
        {images.map((image, index) => {
          const offset = ringOffset(index, active, total);
          const distance = Math.abs(offset);
          // Only the active phone and its two neighbours are drawn; anything
          // further out is hidden rather than stacked up behind, which would
          // cost layout work for pixels nobody sees.
          const hidden = distance > 2;

          return (
            <motion.button
              key={image.src}
              type="button"
              aria-label={image.alt}
              aria-current={offset === 0 ? 'true' : undefined}
              onClick={() => go(index)}
              animate={{
                x: `${offset * 62}%`,
                scale: 1 - distance * 0.13,
                rotateY: offset * -14,
                opacity: hidden ? 0 : 1 - distance * 0.28,
                filter: `blur(${distance * 1.1}px)`,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              style={{
                zIndex: 10 - distance,
                transformStyle: 'preserve-3d',
                pointerEvents: hidden ? 'none' : 'auto',
              }}
              className="absolute cursor-pointer rounded-[2.4rem] focus-visible:outline-none"
            >
              <PhoneFrame image={image} priority={index === 0} />
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => go(index)}
            aria-label={`Show ${image.alt}`}
            aria-current={index === active ? 'true' : undefined}
            className={cn(
              'h-1.5 rounded-full transition-all duration-snap',
              index === active ? 'w-6 bg-ink' : 'w-1.5 bg-line-strong hover:bg-ink-subtle',
            )}
          />
        ))}
      </div>
    </div>
  );
}
