import { defineConfig } from 'tsup';
import rawPlugin from 'unplugin-raw/esbuild'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  esbuildPlugins: [rawPlugin()],
  dts: true,
  clean: true,
  shims: true,
});
