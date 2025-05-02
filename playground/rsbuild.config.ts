import { defineConfig } from '@rsbuild/core';
import { pluginGenerateFile } from 'rsbuild-plugin-generate-file';

export default defineConfig({
  plugins: [
    pluginGenerateFile([
      // json文件
      {
        type: 'json',
        output: 'jsonFile.json',
        data: {
          foo: 'hello',
          bar: 'world',
        },
      },
      // ejs to json
      {
        type: 'template',
        template: './version.ejs',
        output: 'latest-version.json',
        data: {
          version: '1.0.0',
        },
      },
      // raw
      {
        type: 'raw',
        output: 'rawFile.txt',
        data: 'hello rawFile',
      },
      // raw Buffer
      {
        type: 'raw',
        output: 'rawFileBuffer.txt',
        data: Buffer.from('hello rawFileBuffer'),
      },
    ]),
  ],
});
