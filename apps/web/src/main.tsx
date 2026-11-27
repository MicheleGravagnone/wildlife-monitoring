import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { BubbleProvider } from './components/Bubble';
import { SignInProvider } from './components/SignIn';
import { Layout } from './shell/Layout';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

async function boot() {
  if (import.meta.env.VITE_API_MOCKS !== 'false') {
    try {
      const { startMockApi } = await import('./mocks/browser');
      await startMockApi();
    } catch (e) {
      console.error(
        'Mock API failed to start; requests go to the real API.',
        e,
      );
    }
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BubbleProvider>
            <SignInProvider>
              <Layout />
            </SignInProvider>
          </BubbleProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void boot();
