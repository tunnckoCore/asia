'use strict';

const fs = require('fs');
const path = require('path');
const proc = require('process');
const assert = require('assert');
const isColors = require('supports-color').stdout;
const babelCode = require('@babel/code-frame');
const argvParser = require('mri');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const isCI = require('is-ci');
const reporters = require('./reporters');

function isInstalled(name) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(name);
  } catch (err) {
    return false;
  }
  return true;
}

function getRelativePath(fp) {
  const relDir = path.basename(path.dirname(fp));
  const basename = path.basename(fp);
  return `.${path.sep}${path.join(relDir, basename)}`;
}

function getReporter(argv = {}) {
  if (isCI) {
    return reporters.codeframe;
  }

  if (typeof argv.reporter === 'string') {
    /* eslint-disable global-require, import/no-dynamic-require */

    if (argv.reporter[0] === '.') {
      return require(path.join(proc.cwd(), argv.reporter));
    }

    if (Object.keys(reporters).includes(argv.reporter)) {
      const reporterPath = path.join(__dirname, 'reporters', argv.reporter);
      return require(reporterPath);
    }

    const prefix = 'asia-reporter-';

    if (isInstalled(prefix + argv.reporter)) {
      return require(prefix + argv.reporter);
    }

    if (isInstalled(argv.reporter)) {
      return require(argv.reporter);
    }

    console.warn('warn: reporter you are trying to load is not installed');
    console.warn('warn: we automatically switching to the "mini" reporter');
  }

  return reporters.mini;
}

function getParsedArgv({ argv = [], env = {} }) {
  if (env.ASIA_ARGV) {
    return JSON.parse(env.ASIA_ARGV);
  }
  return argvParser(argv.slice(2), {
    alias: {
      u: 'update',
      m: 'match',
      r: 'require',
      R: 'reporter',
    },
    default: {
      match: null,
      reporter: null,
      min: true,
      serial: false,
      snapshots: true,
      concurrency: 100,
      color: isCI === true ? false : isColors.level,
      update: false,
      showStack: false,
      gitignore: true,
      ignore: [
        '**/.nyc_output/**',
        '**/node_modules/**',
        '**/bower_components/**',
        '**/flow-typed/**',
        '**/snapshots/**',
        '**/fixtures/**',
        '**/coverage/**',
        '**/helpers/**',
        '**/support/**',
        '**/.git',
      ],
      input: [
        'test.{js,mjs,jsx}',
        'test/**/*.{js,mjs,jsx}',
        'test/*.{js,mjs,jsx}',
        'tests/**/*.{js,mjs,jsx}',
        '**/__tests__/**/*.{js,mjs,jsx}',
        '**/*.test.{js,mjs,jsx}',
        '**/*.spec.{js,mjs,jsx}',
      ],
    },
  });
}

function createReporter(reporterOptions = {}) {
  const { parsedArgv = {} } = reporterOptions;
  return getReporter(parsedArgv)(reporterOptions);
}

function getCodeInfo({ parsedArgv = {}, content, filename, err }) {
  let parts = err.stack.split('\n');

  if (!/^(.*Error:|AssertionError)/.test(parts[0])) {
    parts = parts.slice(1);
  }

  const firstLine = parts.shift();
  const atLine = parts.filter((ln) => ln.includes(filename)).shift();

  if (atLine) {
    const filepath = atLine.slice(atLine.indexOf(' (') + 2, -1);
    const p = filepath.slice(filename.length + 1).split(':');
    const column = +p[p.length - 1];
    const line = +p[p.length - 2];

    const loc = { start: { line: +line, column: +column } };
    /* istanbul ignore next */
    const source = content || fs.readFileSync(filename, 'utf-8');
    const opts = {
      highlightCode: parsedArgv.color,
      message: firstLine,
    };

    const sourceFrame = babelCode.codeFrameColumns(source, loc, opts);
    const at = atLine.replace('file://', '').trim();

    return { ok: true, sourceFrame, atLine: at };
  }

  return { ok: false };
}

/* istanbul ignore next */
function nextTick(fn) {
  const promise = new Promise((resolve) => {
    proc.nextTick(() => {
      resolve(fn());
    });
  });

  return promise;
}

function createSnaps(parsedArgv, filename) {
  if (!parsedArgv.snapshots) {
    return null;
  }

  const stemname = path.basename(filename, path.extname(filename));
  const snapsdir = path.join(path.dirname(filename), 'snapshots');
  const filesnap = path.join(snapsdir, `${stemname}.snapshot.json`);

  let fileshots = {};

  if (parsedArgv.update) {
    rimraf.sync(snapsdir);
  }

  if (!fs.existsSync(snapsdir)) {
    mkdirp.sync(snapsdir);
  }
  if (fs.existsSync(filesnap)) {
    fileshots = JSON.parse(fs.readFileSync(filesnap, 'utf-8'));
  }

  return { filesnap, fileshots };
}

module.exports = {
  assert: Object.assign(assert, { nextTick }),
  getReporter,
  getParsedArgv,
  getRelativePath,
  getCodeInfo,
  createReporter,
  createSnaps,
  isInstalled,
};
