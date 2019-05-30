import nextJob from 'next-job';
import nodeInternals from './node-internals';

export const noopReporter = {
  before: () => {},
  beforeEach: () => {},
  afterEach: () => {},
  after: () => {},
};

export const hasProcess = process && typeof process === 'object';

/* istanbul ignore next */
async function importer(reporterName) {
  let reporterFn = () => {};

  const hasTranspile =
    process.execArgv.includes('@babel/register') ||
    process.execArgv.includes('esm') ||
    false;

  const path = hasTranspile ? await import('path') : require('path'); // eslint-disable-line global-require

  const reporterPath = path.resolve('src', 'reporters', reporterName);

  reporterFn = hasTranspile
    ? await import(reporterPath)
    : require('esm')(module)(reporterPath); // eslint-disable-line global-require

  return reporterFn.default;
}
export const importReporter = importer;

export const nextTick = (fn) => {
  const promise = new Promise((resolve) => nextJob(resolve));

  return (...args) => promise.then(() => fn(...args));
};

export const relativePath = (line) => {
  /* istanbul ignore next */
  if (!hasProcess) return line;

  return line.replace(`${process.cwd()}/`, './');
};

export const outputError = (err, options) => {
  const error = normalizeError(err, options);

  options.writeLine('# FAIL!');
  options.writeLine('#');

  /* istanbul ignore next */
  if (error.at) {
    options.writeLine('# At:', error.at);
    options.writeLine('#');
  }

  options.writeLine('# Message:', error.head);

  /* istanbul ignore next */
  if (error.message) {
    options.writeLine(error.message);
    options.writeLine('#');
  }

  return error;
};

export function normalizeError(error, options) {
  let stack = [];
  let str = error.stack;

  /* istanbul ignore next */
  if (!error.stack) {
    str = '';
  }

  str
    .split('\n')
    .slice(1)
    .filter((line) => line.trim().startsWith('at'))
    .forEach((line) => {
      const isInternal = nodeInternals.some(
        (internal) =>
          (!options.self && line.includes('asia') && /src|dist/.test(line)) ||
          (line.includes('esm') && line.includes('esm.js')) ||
          new RegExp(`\\(${internal}.+`).test(line),
      );

      if (!isInternal) {
        /* istanbul ignore next */
        const ln = options.relativePaths ? relativePath(line) : line;
        stack.push(`  ${ln.trim()}`);
      }
    });

  const lines = error.message.split('\n');

  const message = lines
    .slice(1)
    .map((line) => `# ${line}`.trim())
    .join('\n');

  let at = null;

  /* istanbul ignore next */
  if (stack.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    const firstLine = stack[0];

    stack.unshift('STACK!');
    stack = stack.map((x) => `# ${x}`.trim()).join('\n');

    at = firstLine
      .slice(1)
      .trim()
      .slice(3);
  }

  return {
    name: error.name,
    head: lines[0],
    message,
    at,
    stack: /* istanbul ignore next */ stack.length > 0 ? stack : null,
  };
}
