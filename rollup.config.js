import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const plugins = [commonjs(), nodeResolve(), terser()];

const apiUMD = {
  plugins,
  input: 'src/api.js',
  output: {
    // CJS API, from node: `const Asia = require('asia/dist/api/umd');`
    // CJS API, from browser: `window.Asia`
    file: 'dist/api/umd.js',
    format: 'umd',
    name: 'Asia',
  },
};

const apiESM = {
  plugins,
  input: 'src/api.js',
  output: {
    // ESM API, from Nodejs: `import Asia from 'asia/dist/api/es';`
    // ESM API, from browser: `import Asia from 'https://unpkg.com/asia/dist/api/es.js';`
    file: 'dist/api/es.js',
    format: 'es',
  },
};

const mainUMD = {
  plugins,
  input: 'src/index.js',
  output: {
    // CJS test, from node: `const test = require('asia');`
    // CJS test, from browser: `window.test`
    file: 'dist/index.js',
    format: 'umd',
    name: 'test',
  },
};

const mainESM = {
  plugins,
  input: 'src/index.js',
  output: {
    // ESM test, from node: `import test from 'asia';`
    // ESM test, from browser: `import test from 'https://unpkg.com/asia?module';`
    file: 'dist/index-es.js',
    format: 'es',
  },
};

export default [apiUMD, apiESM, mainUMD, mainESM];
