import assert from 'node:assert/strict';
import {setTimeout as pause} from 'node:timers/promises';
import {JourneyError, sendJourney} from '../lib/journey-client.ts';

const initial = {step: 0, answers: {}, completed: false, ctaClicked: false, revision: 123};
let lastRequest;
const fetchSuccess = async (url, options) => {
  lastRequest = {url, ...options};
  return Response.json(initial, {status: 201});
};
assert.deepEqual(await sendJourney({action: 'init', source: 'qa-client', device: 'mobile'}, {fetchImpl: fetchSuccess}), initial);
assert.equal(lastRequest.url, '/tiago-gomes/api/journey');
assert.equal(lastRequest.credentials, 'same-origin');
assert.equal(lastRequest.headers['Content-Type'], 'application/json');
assert.deepEqual(JSON.parse(lastRequest.body), {action: 'init', source: 'qa-client', device: 'mobile'});
assert.deepEqual(await sendJourney({action:'init'}, {endpoint:'/daniel/api/journey',fetchImpl:fetchSuccess}), initial);
assert.equal(lastRequest.url, '/daniel/api/journey', 'The Daniel entrypoint must send requests to its own session endpoint.');

const advanceCommand = {action: 'answer', questionId: 'genero', optionId: 'mulher', expectedStep: 2, expectedRevision: 123};
assert.deepEqual(await sendJourney(advanceCommand, {fetchImpl: async (_url, options) => {
  assert.deepEqual(JSON.parse(options.body), advanceCommand);
  return Response.json({ok: true, step: 3, revision: 124});
}}), {ok: true, step: 3, revision: 124});
assert.deepEqual(await sendJourney({action: 'cta', expectedStep: 16, expectedRevision: 124}, {
  fetchImpl: async () => Response.json({ok: true, revision: 125}),
}), {ok: true, revision: 125});

const winner = {step: 3, answers: {compromisso: 'sim', genero: 'homem'}, completed: false, ctaClicked: false, revision: 124};
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => Response.json({error: 'Jornada atualizada.', ...winner}, {status: 409})}), error => {
  assert.ok(error instanceof JourneyError);
  assert.equal(error.status, 409);
  assert.deepEqual(error.snapshot, {...winner, error: 'Jornada atualizada.'});
  return true;
});
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => Response.json({error: 'Sessão expirada.'}, {status: 409})}), error => {
  assert.equal(error.snapshot, undefined);
  assert.equal(error.message, 'Sessão expirada.');
  return true;
});
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => Response.json({error: 'Conflito inválido.', ...winner, revision: -1}, {status: 409})}), error => {
  assert.equal(error.snapshot, undefined, 'An invalid conflict payload must never replace the current UI state.');
  return true;
});

let attempts = 0;
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => {
  attempts++;
  return Response.json({error: 'Não conseguimos salvar agora. Tente novamente.'}, {status: 503});
}}), error => error instanceof JourneyError && error.status === 503 && /Tente novamente/.test(error.message));
assert.equal(attempts, 1, 'A possibly committed mutation must not be retried automatically.');
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => new Response('<html>Gateway error</html>', {status: 502})}), error => {
  assert.equal(error.message, 'Não foi possível salvar agora. Tente novamente.');
  assert.equal(error.status, 502);
  return true;
});
for (const payload of [{}, {ok: true}, {ok: true, step: 3, revision: '123'}, {...initial, answers: []}]) {
  await assert.rejects(sendJourney({action: 'init'}, {fetchImpl: async () => Response.json(payload)}), JourneyError, 'Malformed success responses must not advance the journey.');
}
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => Response.json({ok: true, revision: 124})}), JourneyError);
await assert.rejects(sendJourney(advanceCommand, {fetchImpl: async () => {throw new TypeError('Failed to fetch');}}), error => {
  assert.equal(error.message, 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
  return true;
});

let timeoutCalls = 0;
let requestAborted = false;
await assert.rejects(sendJourney(advanceCommand, {timeoutMs: 15, fetchImpl: (_url, {signal}) => {
  timeoutCalls++;
  return new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
    requestAborted = true;
    reject(new DOMException('Aborted', 'AbortError'));
  }, {once: true}));
}}), error => error instanceof JourneyError && /demorou mais/.test(error.message));
assert.equal(requestAborted, true);
assert.equal(timeoutCalls, 1);
await assert.rejects(sendJourney(advanceCommand, {timeoutMs: 15, fetchImpl: async (_url, {signal}) => ({
  status: 200,
  ok: true,
  text: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted while reading', 'AbortError')), {once: true})),
})}), error => error instanceof JourneyError && /demorou mais/.test(error.message), 'The timeout also bounds reading an incomplete response body.');

let abortedAfterSuccess = false;
await sendJourney({action: 'init'}, {timeoutMs: 15, fetchImpl: async (_url, {signal}) => {
  signal.addEventListener('abort', () => {abortedAfterSuccess = true;}, {once: true});
  return Response.json(initial);
}});
await pause(30);
assert.equal(abortedAfterSuccess, false, 'Settled requests must clear their timeout.');
console.log('PASS: acknowledged writes, revision forwarding, conflict snapshots, malformed/HTML responses, unavailable service, offline errors, timeout without retries and timer cleanup.');
