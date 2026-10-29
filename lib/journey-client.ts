export type JourneySnapshot = {
  step: number;
  answers: Record<string, string>;
  completed: boolean;
  ctaClicked: boolean;
  revision: number;
};

type ExpectedState = {expectedStep?: number; expectedRevision?: number};
type InitCommand = {action: 'init'; source?: string; device?: 'mobile' | 'desktop'};
type AdvanceCommand = ExpectedState & (
  | {action: 'view'; step: number}
  | {action: 'answer'; questionId: string; optionId: string}
);
type CheckoutCommand = ExpectedState & {action: 'cta'};
export type JourneyCommand = InitCommand | AdvanceCommand | CheckoutCommand;
export type JourneyAdvance = {ok: true; step: number; revision: number};
export type JourneyCheckout = {ok: true; revision: number};

const unavailableMessage = 'Não foi possível salvar agora. Tente novamente.';
const timeoutMessage = 'A conexão demorou mais que o esperado. Tente novamente.';
const networkMessage = 'Não foi possível conectar. Verifique sua conexão e tente novamente.';

export class JourneyError extends Error {
  snapshot?: JourneySnapshot;
  status?: number;

  constructor(message: string, snapshot?: JourneySnapshot, status?: number) {
    super(message);
    this.name = 'JourneyError';
    this.snapshot = snapshot;
    this.status = status;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function revision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function snapshot(value: unknown): value is JourneySnapshot {
  return record(value) && revision(value.step) && revision(value.revision)
    && record(value.answers) && Object.values(value.answers).every(answer => typeof answer === 'string')
    && typeof value.completed === 'boolean' && typeof value.ctaClicked === 'boolean';
}

type RequestOptions = {timeoutMs?: number; fetchImpl?: typeof fetch};

export function sendJourney(body: InitCommand, options?: RequestOptions): Promise<JourneySnapshot>;
export function sendJourney(body: AdvanceCommand, options?: RequestOptions): Promise<JourneyAdvance>;
export function sendJourney(body: CheckoutCommand, options?: RequestOptions): Promise<JourneyCheckout>;
/** Keep server acknowledgement authoritative. A timeout never retries a possibly committed write. */
export async function sendJourney(body: JourneyCommand, options: RequestOptions = {}): Promise<JourneySnapshot | JourneyAdvance | JourneyCheckout> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 20_000;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await (options.fetchImpl ?? fetch)('/tiago-gomes/api/journey', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new JourneyError(unavailableMessage, undefined, response.status);
    }
    if (!response.ok) {
      const message = record(data) && typeof data.error === 'string' ? data.error : unavailableMessage;
      throw new JourneyError(message, response.status === 409 && snapshot(data) ? data : undefined, response.status);
    }
    if (body.action === 'init') {
      if (snapshot(data)) return data;
    } else if (record(data) && data.ok === true && revision(data.revision)) {
      if (body.action === 'cta') return {ok: true, revision: data.revision};
      if (revision(data.step)) return {ok: true, step: data.step, revision: data.revision};
    }
    throw new JourneyError(unavailableMessage, undefined, response.status);
  } catch (error) {
    if (error instanceof JourneyError) throw error;
    throw new JourneyError(timedOut ? timeoutMessage : networkMessage);
  } finally {
    clearTimeout(timeout);
  }
}
