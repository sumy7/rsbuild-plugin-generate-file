import { moduleTools, defineConfig } from '@modern-js/module-tools';
import rawPlugin from 'esbuild-plugin-raw';

export default defineConfig({
  plugins: [moduleTools()],
  buildPreset: 'npm-library',
  buildConfig: {
    esbuildOptions: (options: any) => {
      options.plugins = [rawPlugin(), ...options.plugins];
      return options;
    },
  },
});
