# rsbuild-plugin-generate-file

[![npm](https://img.shields.io/npm/dt/rsbuild-plugin-generate-file.svg)](https://www.npmjs.com/package/rsbuild-plugin-generate-file)  [![npm](https://img.shields.io/npm/v/rsbuild-plugin-generate-file.svg)](https://www.npmjs.com/package/rsbuild-plugin-generate-file) [![npm](https://img.shields.io/npm/l/rsbuild-plugin-generate-file.svg)](https://www.npmjs.com/package/rsbuild-plugin-generate-file)

**rsbuild-plugin-generate-file** is a rsbuild plugin which generate static file and write them to dist folder after packaging.

## Usage

Install dev dependency :

```shell
yarn add rsbuild-plugin-generate-file -D
npm install rsbuild-plugin-generate-file -D
```

Add plugin to your `rsbuild.config.ts` :

```typescript
// rsbuild.config.ts
import { pluginGenerateFile } from 'rsbuild-plugin-generate-file';

export default {
  plugins: [
    pluginGenerateFile([{
      type: 'json',
      output: './output.txt',
      data: {
        foo: 'bar'
      }
    }])
  ]
}
```

Here are the available options for configuration:

| Name          | Description                                                                                                                          | Options                   | Defaults       |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------|----------------|
| `type`        | Specifies the format type of the generated file.                                                                                     | `json`  `yaml` `template` | `json`         |
| `output`      | Defines the path to the output file that the plugin will generate. This path is relative to the `dist` folder.                       | -                         | `./output.txt` |
| `template`    | Specifies the path to the template file. Supports `ejs` format template. This option is available when `type` is set to `template`.  | -                         | -              |
| `data`        | Specifies the data to be used in the generated file or to be passed into the template.                                               | -                         | -              |
| `contentType` | Defines the Content-Type response returned from the dev server. If left empty, it will be inferred from the `output` path extension. | -                         | -              |

In dev mode, plugin will mock file by dev server.
See [localhost:8080/__generate_file_list/](http://localhost:8080/__generate_file_list/) for more detail.

## Credits

This plugin was inspired
by [Alicevia/vite-plugin-generate-config-into-dist](https://github.com/fed/webpack-version-file)
and [sumy7/vite-plugin-generate-file](https://github.com/sumy7/vite-plugin-generate-file)
and [antfu/vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect)

## License

MIT
