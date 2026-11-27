import { http, HttpResponse } from 'msw';
import { sse } from 'msw/sse';
import type { LoginRequest, User } from '../api/types';
import { speciesFor } from '../lib/species';
import {
  deadLetters,
  deployments,
  detectionsUntil,
  findDetection,
  pastDeployments,
  pipeline,
  sensorHealth,
  sensorHealthDetail,
  sensors,
} from './db';
import {
  dailyActivity,
  hourlyActivity,
  listDetections,
  pageOf,
  parkStats,
  parseDetectionQuery,
  speciesStats,
  summary,
  toPublic,
  validateDetectionQuery,
} from './queries';

const API = '/api/v1';
const SESSION_KEY = 'trop-mock-session';

function sessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const error = (statusCode: number, message: string | string[], err: string) =>
  HttpResponse.json(
    { statusCode, message, error: err },
    { status: statusCode },
  );
const unauthorized = () => error(401, 'Sign in to see this', 'Unauthorized');
const notFound = () => error(404, 'Not found', 'Not Found');
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rangeParams(request: Request) {
  const p = new URL(request.url).searchParams;
  return {
    p,
    from: p.get('from') || undefined,
    to: p.get('to') || undefined,
    species: p.getAll('species').length ? p.getAll('species') : undefined,
    parkName: p.get('parkName') || undefined,
  };
}

const latency = () =>
  new Promise((r) => setTimeout(r, 120 + Math.random() * 180));

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await latency();
    const body = (await request.json()) as Partial<LoginRequest>;
    if (!body.email || !body.password)
      return error(400, ['email and password are required'], 'Bad Request');
    if (body.password === 'wrong')
      return error(401, 'Wrong email or password', 'Unauthorized');
    const local = body.email.split('@')[0] ?? 'staff';
    const [first = 'Park', last = 'Staff'] = local.split(/[._-]/);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const user: User = {
      id: '00000000-0000-4000-a000-000000000001',
      name: cap(first),
      surname: cap(last),
      email: body.email,
      role: local.includes('dev') ? 'DEVELOPER' : 'ADMINISTRATOR',
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return HttpResponse.json(user);
  }),
  http.post(`${API}/auth/logout`, () => {
    sessionStorage.removeItem(SESSION_KEY);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/auth/me`, () => {
    const user = sessionUser();
    return user ? HttpResponse.json(user) : unauthorized();
  }),

  sse<{ detection: string }>(
    `${API}/detections/stream`,
    ({ client, request }) => {
      if (!sessionUser()) {
        client.error();
        return;
      }
      let last = Date.now();
      const lastId = request.headers.get('last-event-id');
      if (lastId) {
        const prev = findDetection(lastId);
        if (prev) last = Date.parse(prev.capturedAt);
      }
      const timer = setInterval(() => {
        const now = Date.now();
        for (const d of detectionsUntil(now)) {
          if (Date.parse(d.capturedAt) > last)
            client.send({
              id: d.id,
              event: 'detection',
              data: JSON.stringify(d),
            });
        }
        last = now;
      }, 2000);
      request.signal.addEventListener('abort', () => clearInterval(timer));
    },
  ),
  http.get(`${API}/detections`, async ({ request }) => {
    await latency();
    const q = parseDetectionQuery(new URL(request.url).searchParams);
    const errors = validateDetectionQuery(q);
    if (errors.length) return error(400, errors, 'Bad Request');
    return HttpResponse.json(
      listDetections(detectionsUntil(), q, !!sessionUser()),
    );
  }),
  http.get(`${API}/detections/:id/image`, ({ params }) => {
    if (!sessionUser()) return unauthorized();
    const d = findDetection(String(params.id));
    if (!d || !d.hasImage) return notFound();
    const url =
      speciesFor(d.speciesLabel)?.photo ?? '/assets/hab-lagiewniki.jpg';
    return HttpResponse.json({
      url,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
  }),
  http.get(`${API}/detections/:id`, ({ params }) => {
    const id = String(params.id);
    if (!UUID_RE.test(id))
      return error(400, 'Validation failed (uuid is expected)', 'Bad Request');
    const d = findDetection(id);
    const staff = !!sessionUser();
    if (!d || (!staff && d.classificationStatus !== 'IDENTIFIED'))
      return notFound();
    return HttpResponse.json(staff ? d : toPublic(d));
  }),

  http.get(`${API}/stats/summary`, async ({ request }) => {
    await latency();
    const { from, to } = rangeParams(request);
    return HttpResponse.json(summary(detectionsUntil(), from, to));
  }),
  http.get(`${API}/stats/species`, async ({ request }) => {
    await latency();
    const { from, to, parkName } = rangeParams(request);
    return HttpResponse.json({
      items: speciesStats(detectionsUntil(), from, to, parkName),
    });
  }),
  http.get(`${API}/stats/parks`, async ({ request }) => {
    await latency();
    const { from, to, species } = rangeParams(request);
    return HttpResponse.json({
      items: parkStats(detectionsUntil(), from, to, species),
    });
  }),
  http.get(`${API}/stats/daily`, async ({ request }) => {
    await latency();
    const { p, species, parkName } = rangeParams(request);
    const days = Math.min(90, Math.max(1, Number(p.get('days') ?? 30)));
    return HttpResponse.json(
      dailyActivity(detectionsUntil(), Date.now(), days, species, parkName),
    );
  }),
  http.get(`${API}/stats/hourly-activity`, async ({ request }) => {
    await latency();
    const { from, to, species, parkName } = rangeParams(request);
    return HttpResponse.json(
      hourlyActivity(detectionsUntil(), from, to, species, parkName),
    );
  }),

  http.get(`${API}/sensors/health`, async ({ request }) => {
    if (!sessionUser()) return unauthorized();
    await latency();
    const status = new URL(request.url).searchParams.getAll('status');
    const items = sensorHealth().filter(
      (s) => !status.length || status.includes(s.status),
    );
    return HttpResponse.json({ items });
  }),
  http.get(`${API}/sensors/:id/health`, ({ params }) => {
    if (!sessionUser()) return unauthorized();
    const h = sensorHealthDetail(String(params.id));
    return h ? HttpResponse.json(h) : notFound();
  }),
  http.get(`${API}/sensors`, ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const p = new URL(request.url).searchParams;
    return HttpResponse.json(
      pageOf(
        sensors,
        Number(p.get('page') ?? 1),
        Number(p.get('pageSize') ?? 50),
      ),
    );
  }),
  http.get(`${API}/sensors/:id`, ({ params }) => {
    if (!sessionUser()) return unauthorized();
    const s = sensors.find((x) => x.id === params.id);
    return s ? HttpResponse.json(s) : notFound();
  }),
  http.get(`${API}/deployments`, ({ request }) => {
    if (!sessionUser()) return unauthorized();
    const p = new URL(request.url).searchParams;
    const sensorId = p.get('sensorId');
    const all = [
      ...deployments.map(
        ({ habitat: _h, deviceId: _d, index: _i, ...dep }) => dep,
      ),
      ...pastDeployments,
    ]
      .filter((d) => !sensorId || d.sensorId === sensorId)
      .sort((a, b) => Date.parse(b.installedAt) - Date.parse(a.installedAt));
    return HttpResponse.json(
      pageOf(all, Number(p.get('page') ?? 1), Number(p.get('pageSize') ?? 50)),
    );
  }),

  http.get(`${API}/system/pipeline`, async () => {
    if (!sessionUser()) return unauthorized();
    await latency();
    return HttpResponse.json(pipeline());
  }),
  http.get(`${API}/system/dead-letters`, () => {
    if (!sessionUser()) return unauthorized();
    return HttpResponse.json(pageOf(deadLetters(), 1, 50));
  }),
  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok' })),
];
