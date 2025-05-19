import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  platform: 'browser',
  outDir: 'dist/browser',
  sourcemap: false,
  dts: false,
  clean: true,
  splitting: false,
  external: ['fs', 'path'],
});