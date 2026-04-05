import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    next: 'src/handlers/route.ts',
    react: 'src/components/index.ts',
    'adapters/sqlite': 'src/adapters/sqlite.ts',
    'adapters/postgres': 'src/adapters/postgres.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ['postgres', 'better-sqlite3'],
});