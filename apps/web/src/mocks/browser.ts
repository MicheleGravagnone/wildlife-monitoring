import { getResponse, type RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const WORKER_TIMEOUT_MS = 4000;

export async function startMockApi(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.get('mockUser') === 'staff') {
    sessionStorage.setItem(
      'trop-mock-session',
      JSON.stringify({
        id: '00000000-0000-4000-a000-000000000001',
        name: 'Park',
        surname: 'Admin',
        email: 'park.admin@example.org',
        role: 'ADMINISTRATOR',
      }),
    );
  }
  if (params.get('mocks') === 'inpage') return mockFetchInPage();
  const worker = setupWorker(...handlers);
  const started = worker
    .start({
      quiet: true,
      onUnhandledFrame: 'bypass',
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    })
    .then(() => true)
    .catch(() => false);
  const timeout = new Promise<false>((r) =>
    setTimeout(() => r(false), WORKER_TIMEOUT_MS),
  );
  if (await Promise.race([started, timeout])) return;

  console.warn(
    'Mock service worker unavailable; mocking fetch in-page instead.',
  );
  mockFetchInPage();
}

function mockFetchInPage(): void {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = new Request(
      input instanceof Request ? input : new URL(String(input), location.href),
      init,
    );
    if (new URL(request.url).pathname.startsWith('/api/')) {
      const res = await getResponse(
        handlers as unknown as RequestHandler[],
        request,
      );
      if (res) return res;
    }
    return realFetch(input, init);
  };
}
