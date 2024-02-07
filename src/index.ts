import { readFileSync, mkdirSync, existsSync, writeFile } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { type RsbuildPlugin } from '@rsbuild/core';
import * as mime from 'mime-types';
import pc from 'picocolors';
import { dump as yamlDump } from 'js-yaml';
import ejs from 'ejs';
import { type RequestHandler, type RsbuildPluginAPI } from '@rsbuild/shared';
// @ts-expect-error
import listTemplate from './view.ejs?raw';

/**
 * 文件输出配置
 */
export interface GenerateFile {
  /**
   * 文件输出位置，相对于输出目录，默认 ./output.txt
   */
  output?: string;
  /**
   * 文件输出格式，json-将data转换成JSON格式输出，yaml-将data转换成yaml格式输出，template-使用自定义模板，
   * 默认json格式
   */
  type?: 'json' | 'yaml' | 'template';
  /**
   * devServer访问时返回的ContentType，默认根据output路径扩展名进行猜测
   */
  contentType?: string;
  /**
   * 输出使用的模板文件，在type为template时有效，无默认值
   */
  template?: string;
  /**
   * 输出使用的data
   */
  data?: Record<string, any>;
}

/**
 * 处理后的配置项
 */
interface NormalizeGenerateFile extends GenerateFile {
  fullPath: string;
  relativePath: string;
}

export type PluginGenerateFileOptions = GenerateFile | GenerateFile[];

/**
 * 解析后的全局配置项
 */
// let config: ResolvedConfig;
/**
 * 文件生成根路径
 */
let distPath: string;
/**
 * 文件生成配置，相同路径保留最后一个
 */
const generateFileMap = new Map<string, NormalizeGenerateFile>();

/**
 * 参数默认值
 * @param option 参数
 */
function normalizeOption(option: GenerateFile): NormalizeGenerateFile {
  const generateFileOption: GenerateFile = {
    output: './output.txt',
    type: 'json',
    template: '',
    ...option,
  };
  const fullPath = resolve(distPath, generateFileOption.output!);
  const relativePath = `/${relative(distPath, fullPath)}`;
  const contentType =
    generateFileOption.contentType ||
    mime.lookup(generateFileOption.output || '') ||
    'text/plain';
  return {
    ...generateFileOption,
    contentType,
    fullPath,
    relativePath,
  };
}

/**
 * 根据路径，递归创建文件夹
 * https://stackoverflow.com/a/34509653/3671444
 *
 * @param filePath 文件路径
 */
export function ensureDirectoryExistence(filePath: string) {
  const directoryName = dirname(filePath);
  if (existsSync(directoryName)) {
    return;
  }
  ensureDirectoryExistence(directoryName);
  mkdirSync(directoryName);
}

/**
 * 获取生成的文件内容
 * @param option 生成文件选项
 */
function generateContent(option: NormalizeGenerateFile): string {
  if (!option.type) {
    return '';
  }
  if (option.type === 'json') {
    if (option.data) {
      return JSON.stringify(option.data);
    }
    return '';
  }
  if (option.type === 'yaml') {
    if (option.data) {
      return yamlDump(option.data);
    }
    return '';
  }
  if (option.type === 'template') {
    const templatePath = resolve(option.template!);
    const templateContent = readFileSync(templatePath, { encoding: 'utf8' });
    return ejs.render(templateContent, option.data);
  }
  console.warn(`Unknown type [${option.type}]`);
  return '';
}

/**
 * 生成文件
 * @param option 文件选项
 */
function generateFile(option: NormalizeGenerateFile) {
  const filePath = option.fullPath;
  const fileContent = generateContent(option);
  ensureDirectoryExistence(filePath);
  writeFile(filePath, fileContent, { flag: 'w' }, error => {
    if (error) {
      throw error;
    }

    console.log(`Generate File to ${pc.green(filePath)}`);
  });
}

/**
 * 调试服务器中间件，用于开发环境下预览生成的文件内容
 */
function devServerMiddleware(): RequestHandler {
  return (req, res, next) => {
    const uri = new URL(req.url || '', `http://${req.headers.host}`);
    const { pathname } = uri;

    if (pathname.startsWith('/__generate_file_list')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(
        ejs.render(listTemplate, {
          generateFiles: Object.fromEntries(generateFileMap),
        }),
      );
      res.end();
    } else if (generateFileMap.has(pathname)) {
      const file = generateFileMap.get(pathname)!;
      res.writeHead(200, { 'Content-Type': file.contentType });
      res.write(generateContent(file));
      res.end();
    } else {
      next();
    }
  };
}

/**
 * 生成文件插件
 */
export const pluginGenerateFile = (
  options?: PluginGenerateFileOptions,
): RsbuildPlugin => ({
  name: 'rsbuild-plugin-generate-file',
  setup(api: RsbuildPluginAPI) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      return mergeRsbuildConfig(config, {
        dev: {
          setupMiddlewares: [
            middlewares => middlewares.unshift(devServerMiddleware()),
          ],
        },
      });
    });
    api.onAfterCreateCompiler(() => {
      const resolvedConfig = api.getNormalizedConfig();
      distPath = resolve(resolvedConfig.output.distPath.root!);
      if (!options) {
        return;
      }
      if (Array.isArray(options)) {
        options.forEach(option => {
          const simpleOption = normalizeOption(option);
          generateFileMap.set(simpleOption.relativePath, simpleOption);
        });
      } else {
        const simpleOption = normalizeOption(options);
        generateFileMap.set(simpleOption.relativePath, simpleOption);
      }
    });
    api.onAfterStartDevServer(() => {
      const resolvedConfig = api.getNormalizedConfig();
      const host = `${
        resolvedConfig.server.https ? 'https' : 'http'
      }://localhost:${resolvedConfig.server.port || '80'}`;
      const colorUrl = (url: string) =>
        pc.green(url.replace(/:(\d+)\//, (_, port) => `:${pc.bold(port)}/`));
      console.log(
        `  ${pc.green('>')} ${pc.bold('Generate File List')}: ${colorUrl(
          `${host}/__generate_file_list/`,
        )}`,
      );
    });
    api.onAfterBuild(() => {
      // 按顺序生成文件
      Array.from(generateFileMap.values()).forEach(option => {
        generateFile(option);
      });
    });
  },
});
