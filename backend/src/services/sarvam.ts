import OpenAI from 'openai';
import { z } from 'zod';

/**
 * Sarvam, the language model used for anything the user writes in their own
 * words — Hindi, Tamil, romanised, or code-mixed with English.
 *
 * Separate from `aiService.ts`, which talks to OpenAI for admin email drafting.
 * That is not indecision about a vendor. The two do different jobs: OpenAI
 * writes English prose for a staff-only screen, Sarvam reads "kal IIT Madras
 * jaana hai Velachery se" and is trained for exactly that. Collapsing them onto
 * one provider would mean picking which of those two jobs to do worse.
 *
 * No new dependency: Sarvam serves an OpenAI-compatible
 * `POST /v1/chat/completions`, so the `openai` client already in this project
 * reaches it by changing `baseURL`.
 *
 * The key is read here and nowhere else, and nothing in this module is
 * reachable from the browser — every caller is an Express route behind
 * `identify`. That is the whole reason this file exists on the server: a key
 * shipped to the client is a key anyone can spend.
 */

const SARVAM_BASE_URL = 'https://api.sarvam.ai/v1';

/**
 * The chat model. There is deliberately no cheaper tier beside it.
 *
 * `sarvam-30b` exists and is still callable, and it would be the obvious pick
 * for a latency-sensitive path like this one. It is also **deprecated** —
 * Sarvam's own page says "Sarvam-30B has been deprecated, please migrate to
 * Sarvam-105B" and marks the rest of that page as retained for reference only,
 * while the chat-completions reference lists just `sarvam-105b` and
 * `sarvam-105b-conversations` as permitted values. Starting a new feature on a
 * model the vendor is retiring buys a few seconds now and a forced migration
 * later.
 *
 * If a supported smaller model ships, this is the one line that changes.
 */
const MODEL = 'sarvam-105b';

/**
 * Ceiling on generated tokens.
 *
 * This must cover the model's *reasoning*, not just its answer. `sarvam-105b`
 * is a reasoning model: it fills `reasoning_content` before it writes a single
 * character of `content`, and on a trivial one-field extraction that came to
 * between 1,200 and 2,100 tokens.
 *
 * The first version of this was 600, chosen from what the JSON output needed.
 * Every live call came back with `finish_reason: "stop"`, a full token bill,
 * and an empty `content` — the budget was spent thinking and there was nothing
 * left to answer with. It reads as a total failure and is really an accounting
 * mistake, so the number is stated here in terms of the thing that actually
 * consumes it.
 *
 * 3000 leaves room for reasoning over the six-field prompt and stays under the
 * 4096 that Starter caps `max_tokens` at.
 */
const MAX_TOKENS = 3000;

/**
 * Wall-clock ceiling for one call, including the SDK's internal retries.
 *
 * Twenty seconds, and it is the reasoning above that sets it rather than
 * anyone's patience. Measured round trips run 4–6s on a one-field prompt and
 * longer on the six-field one, because the model writes its whole reasoning
 * pass before answering. Twelve seconds was the first value here and it cut
 * off calls that were already paid for and about to succeed — the worst
 * possible moment to give up.
 *
 * Every caller must still work without an answer: see `squadIntent.ts`, where
 * a timeout means the create form simply opens as it always has.
 */
const TIMEOUT_MS = 20_000;

/**
 * Retries on top of the first attempt.
 *
 * The SDK already retries 429 and 5xx with exponential backoff, which is what
 * Sarvam's own guidance asks for. Two rather than the default because the
 * per-minute allowance on this model is small — 40 requests on Starter, 60 on
 * Pro — so an aggressive retry policy spends the very budget it is contending
 * for and turns one slow minute into a rolling outage.
 */
const MAX_RETRIES = 2;

const apiKey = process.env.SARVAM_API_KEY ?? '';

/**
 * Null when unconfigured rather than throwing at import.
 *
 * A missing key must not stop the server booting. Every feature built on this
 * is an accelerator over a flow that already works by hand, so the correct
 * behaviour without a key is that those flows carry on unaided — not that the
 * API fails to start and takes squads, chat and maps down with it.
 */
const client = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: SARVAM_BASE_URL,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
      /**
       * Sarvam's native scheme is `api-subscription-key`; it also accepts
       * `Authorization: Bearer` for OpenAI-compatible clients, which is what
       * the SDK sends. Both are set so the call does not depend on which of
       * the two they keep honouring.
       */
      defaultHeaders: { 'api-subscription-key': apiKey },
    })
  : null;

export function isSarvamConfigured(): boolean {
  return client !== null;
}

/**
 * Calls per minute this process will make, across every feature.
 *
 * Sarvam limits `sarvam-105b` by account, not by endpoint — 40 requests a
 * minute on Starter, 60 on Pro. That allowance is shared by everything built on
 * this module, so a per-route or per-IP limiter cannot protect it: ten users on
 * ten addresses, each within their own limit, still exhaust one account
 * together. This is the only place that can hold the account-wide line, so it
 * holds it here.
 *
 * Deliberately under the Starter allowance. The headroom absorbs the SDK's
 * retries, which spend from the same budget without asking this counter.
 *
 * In-process, with the same caveat as `middleware/rateLimit.ts`: correct while
 * the container runs as a single instance, and something that must move to a
 * shared store before it is scaled out — at which point the effective ceiling
 * multiplies by the instance count and the account starts returning 429s.
 */
const CALLS_PER_MINUTE = Number(process.env.SARVAM_CALLS_PER_MINUTE ?? 30);

let windowStartedAt = 0;
let callsThisWindow = 0;

/**
 * True when there is budget for one more call, which it then claims.
 *
 * Claimed before the request rather than counted after it, so concurrent calls
 * cannot both see room for the last slot.
 */
function claimBudget(): boolean {
  const now = Date.now();
  if (now - windowStartedAt >= 60_000) {
    windowStartedAt = now;
    callsThisWindow = 0;
  }
  if (callsThisWindow >= CALLS_PER_MINUTE) return false;
  callsThisWindow += 1;
  return true;
}

/** Raised when the model answered, but not with something usable. */
export class SarvamUnusableError extends Error {}

export interface ChatJsonOptions<T extends z.ZodTypeAny> {
  /** Short label for logs and metrics. Never contains user text. */
  label: string;
  system: string;
  user: string;
  /** Validated against the reply. The reply is discarded if it does not fit. */
  schema: T;
  /**
   * JSON Schema handed to the model so it constrains its own output.
   *
   * Belt and braces with `schema` above, and not redundant: this makes the
   * right shape likely, `schema` makes the wrong shape harmless. Only the
   * second of those is a guarantee — a model told to emit a schema can still
   * emit something else, and the day it does must not be the day a malformed
   * object reaches a database write.
   */
  jsonSchema: Record<string, unknown>;
  /**
   * Zero unless there is a reason. Extraction is a parsing job with a right
   * answer, and sampling variation here shows up as the same sentence
   * producing a different squad on two consecutive tries.
   */
  temperature?: number;
}

/**
 * One structured call: text in, validated object out, `null` on any failure.
 *
 * Null rather than a thrown error because every caller has a real fallback and
 * none of them should be writing a try/catch to reach it. "The model was no
 * help" is an ordinary outcome of this function, not an exception.
 */
export async function chatJson<T extends z.ZodTypeAny>(
  options: ChatJsonOptions<T>,
): Promise<z.infer<T> | null> {
  if (!client) return null;

  /**
   * One retry, for unusable *content* only.
   *
   * Separate from the SDK's retries, which cover transport — 429s, 5xx, a
   * dropped connection. This covers the case measured against the live API: a
   * 200 response, `finish_reason: "stop"`, a token count nowhere near the cap,
   * and JSON that stops mid-object anyway. It is not deterministic, so the same
   * sentence sent twice frequently succeeds on the second attempt.
   *
   * Two attempts, not more. Each costs a metered call and ten seconds of
   * someone's time, and the caller degrades to a blank form perfectly well —
   * spending a third call to avoid that trade is the wrong way round.
   */
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await attemptChatJson(options, attempt);
    if (result !== null) return result;
  }
  return null;
}

async function attemptChatJson<T extends z.ZodTypeAny>(
  options: ChatJsonOptions<T>,
  attempt: number,
): Promise<z.infer<T> | null> {
  const startedAt = Date.now();
  const label = attempt === 1 ? options.label : `${options.label}#${attempt}`;

  // Claimed per attempt, not per call: a retry spends from the same account
  // allowance as anything else, and a budget that only counted first tries
  // would understate real usage by however often this path is taken.
  if (!claimBudget()) {
    logFailure(label, startedAt, 'budget-exhausted');
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: options.temperature ?? 0,
      response_format: {
        type: 'json_schema',
        json_schema: { name: options.label, strict: true, schema: options.jsonSchema },
      },
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ],
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new SarvamUnusableError('empty completion');

    const parsed = options.schema.safeParse(JSON.parse(unfence(content)));
    if (!parsed.success) throw new SarvamUnusableError('schema mismatch');

    /**
     * What is logged, and what is deliberately not.
     *
     * Latency, token counts and the label — enough to see cost and whether the
     * thing is working. Not the prompt, not the completion. People describe
     * where they are going and when they will be there; that is a movement
     * record, and writing it to a log ships it to whatever aggregates logs,
     * for a debugging convenience that is not worth it.
     */
    logOk(label, startedAt, completion.usage);

    return parsed.data;
  } catch (error) {
    logFailure(label, startedAt, describe(error));
    return null;
  }
}

/**
 * Strips a markdown code fence from around a JSON body.
 *
 * `response_format` is set on every call and the model honours it, so this
 * should never fire. It exists because the same model asked *without* that
 * parameter answers with ```json … ``` — meaning fenced output is a shape it
 * readily produces, and the only thing standing between us and it is a request
 * parameter continuing to be respected. `JSON.parse` on a fence throws, so the
 * cost of being wrong is a total failure and the cost of this guard is one
 * regex that normally does nothing.
 */
function unfence(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

/**
 * A failure in terms safe to write down.
 *
 * Error objects from the SDK can carry the request body, and the request body
 * is the user's sentence — so the message is never included, only the class of
 * failure and the status code.
 */
function describe(error: unknown): string {
  if (error instanceof SarvamUnusableError) return error.message;
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) return 'rate-limited';
    if (error.status === 401 || error.status === 403) return 'auth';
    return `http-${error.status ?? 'unknown'}`;
  }
  if (error instanceof SyntaxError) return 'invalid-json';
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  return 'unknown';
}

/**
 * Two functions rather than one taking a discriminated union: this project
 * compiles with `strict: false`, and without `strictNullChecks` TypeScript does
 * not narrow a union on a boolean discriminant, so the tidier version does not
 * type-check here.
 */
function logOk(
  label: string,
  startedAt: number,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
): void {
  const ms = Date.now() - startedAt;
  console.info(
    `[sarvam/${label}] ok ${ms}ms in=${usage?.prompt_tokens ?? '?'} out=${usage?.completion_tokens ?? '?'}`,
  );
}

function logFailure(label: string, startedAt: number, reason: string): void {
  console.warn(`[sarvam/${label}] failed ${Date.now() - startedAt}ms reason=${reason}`);
}
