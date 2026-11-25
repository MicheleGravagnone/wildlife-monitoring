import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { globals: true, include: ['test/e2e/**/*.e2e-spec.ts'] },
});
