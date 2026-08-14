'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useAiStatus, useDraftSquadFromText } from '@/lib/hooks/queries';
import { cn } from '@/lib/utils';
import type { AiSquadDraft } from '@/lib/services/ai';
import type { LngLat } from '@/types';

/**
 * "Tomorrow 9am, Velachery to IIT Madras for my Maths exam" — one box above the
 * create form that fills the rest of it in.
 *
 * A shortcut, never a replacement. Everything it produces lands in the same
 * fields, editable, with the same Create button underneath; a leader who
 * ignores this box entirely gets the form exactly as it was. That is the whole
 * design: this can be wrong, and being wrong has to cost one correction rather
 * than a squad going to the wrong place.
 *
 * Renders nothing at all when the server has no model configured. An input that
 * accepts a sentence and always fails is worse than no input.
 */
export function DescribeTrip({
  near,
  onDraft,
  className,
}: {
  /** Biases place resolution to where the user is. */
  near?: LngLat | null;
  /** Called with a draft the caller applies to its own form state. */
  onDraft: (draft: AiSquadDraft) => void;
  className?: string;
}) {
  const status = useAiStatus();
  const draft = useDraftSquadFromText();
  const [text, setText] = useState('');

  /**
   * Held so Cancel can abort the request in flight. A ref rather than state:
   * changing it must not re-render, and the value only ever matters at the
   * moment somebody presses the button.
   */
  const abort = useRef<AbortController | null>(null);

  /**
   * Seconds spent waiting, used only to change what the wait says.
   *
   * Measured calls run 10s to 35s — the model writes a full reasoning pass
   * before it answers anything. A spinner alone over that long is
   * indistinguishable from a hang, and the honest fix is to say so rather than
   * to pretend it will be quick.
   */
  const [waited, setWaited] = useState(0);
  const pending = draft.isPending;

  /**
   * The counter is started here and zeroed in `submit`, not in this effect.
   * Resetting it in the effect body would be a setState during render-commit
   * for a value no external system owns — the request start is a user event,
   * so that is where the reset belongs.
   */
  useEffect(() => {
    if (!pending) return;
    const started = Date.now();
    const tick = setInterval(() => setWaited(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(tick);
  }, [pending]);

  /** Abandons an in-flight request on unmount, so a left page stops waiting. */
  useEffect(() => () => abort.current?.abort(), []);

  if (!status.data?.squadDraft) return null;

  const trimmed = text.trim();

  const submit = () => {
    if (trimmed.length < 2 || draft.isPending) return;
    setWaited(0);
    abort.current = new AbortController();
    draft.mutate(
      { text: trimmed, near: near ?? null, signal: abort.current.signal },
      {
        onSuccess: (result) => {
          // A sentence that produced nothing leaves the box alone, so the user
          // can edit what they wrote rather than retype it from memory.
          if (result.understood) onDraft(result);
        },
      },
    );
  };

  /**
   * Gives the form back immediately.
   *
   * `reset` as well as `abort`, so the withdrawn request leaves no error behind
   * it — the rejection lands after this runs, and without the reset the box
   * would sit there reporting a failure for something the user chose.
   */
  const cancel = () => {
    abort.current?.abort();
    abort.current = null;
    draft.reset();
  };

  const result = draft.data;
  const understoodNothing = draft.isSuccess && result && !result.understood;
  /** A cancelled request is not an error and must not be reported as one. */
  const failed =
    draft.isError && !(draft.error instanceof ApiError && draft.error.code === 'aborted');

  return (
    <div className={cn('rounded-xl border border-line bg-surface-sunken p-3.5', className)}>
      <label
        htmlFor="describe-trip"
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink"
      >
        <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
        Describe your trip
      </label>

      <textarea
        id="describe-trip"
        value={text}
        onChange={(event) => setText(event.target.value)}
        /**
         * Enter submits, Shift+Enter breaks the line.
         *
         * This is one sentence, not a paragraph, and the keyboard's Return key
         * is the obvious way to finish it. The escape hatch stays because a
         * textarea that cannot take a newline is a surprising textarea.
         */
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={2}
        maxLength={500}
        placeholder="Tomorrow 9am, Velachery to IIT Madras for my Maths exam"
        className={cn(
          'mt-2 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5',
          'text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle',
          'focus:border-brand disabled:cursor-not-allowed disabled:opacity-60',
        )}
        disabled={draft.isPending}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[12px] leading-relaxed text-ink-subtle" aria-live="polite">
          {pending
            ? waited >= 8
              ? 'Still reading — you can stop and fill the form yourself.'
              : 'Reading your trip…'
            : /* Said plainly and up front, because the alternative is a user
                 who types a sentence and expects a squad to exist afterwards. */
              'Fills the form below. Nothing is created until you press Create squad.'}
        </p>

        {pending ? (
          /*
            A real way out, not a disabled button with a spinner on it.
            The request can run half a minute, and for most of that the form
            underneath is perfectly usable — so the wait has to be something a
            person can leave, or the shortcut becomes the slowest route.
          */
          <Button size="sm" variant="secondary" onClick={cancel} className="shrink-0">
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={submit}
            disabled={trimmed.length < 2}
            className="shrink-0"
          >
            Fill form
          </Button>
        )}
      </div>

      {/*
        Place names that were in the sentence but are not on the map.

        Named rather than silently dropped: a leader who wrote "Fortune Tower"
        and got an empty destination field would read that as the feature being
        broken. Telling them which word failed turns it into one search.
      */}
      {result?.unresolved.length ? (
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink-muted">
          Couldn&apos;t find{' '}
          {result.unresolved.map((name, index) => (
            <span key={name}>
              {index > 0 ? ' or ' : ''}
              <span className="font-medium text-ink">{name}</span>
            </span>
          ))}{' '}
          on the map. Search for it below.
        </p>
      ) : null}

      {understoodNothing ? (
        <p role="status" className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
          Couldn&apos;t read a trip out of that. Try naming where you&apos;re going and when —
          or just fill the form below.
        </p>
      ) : null}

      {/*
        Every failure says the same thing, because the user's next move is the
        same for all of them: the form underneath still works. No retry button —
        the model call is metered, and a person who wants to try again can press
        the button that is already there.
      */}
      {failed ? (
        <p role="alert" className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
          That didn&apos;t work. Fill the form below instead.
        </p>
      ) : null}
    </div>
  );
}
