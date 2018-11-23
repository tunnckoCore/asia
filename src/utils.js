import nextJob from 'next-job';
import nodeInternals from './node-internals';

export const noopReporter = {
  before: () => {},
  beforeEach: () => {},
  afterEach: () => {},
  after: () => {},
};

export const nextTick = (fn) => {
  const promise = new Promise((resolve) => nextJob(resolve));

  return (...args) => promise.then(() => fn(...args));
};

export const hasProcess = process && typeof process === 'object';
export function normalizeError(error) {
  const stack = [];
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
          (line.includes('asia') && /src|dist/.test(line)) ||
          (line.includes('esm') && line.includes('esm.js')) ||
          new RegExp(`\\(${internal}.+`).test(line),
      );

      if (!isInternal) {
        stack.push(`  ${line.trim()}`);
      }
    });

  const lines = error.message.split('\n');

  const message = lines
    .slice(1)
    .map((line) => `# ${line}`.trim())
    .join('\n');

  stack.unshift('', 'STACK!');

  return {
    name: error.name,
    head: lines[0],
    message,
    stack: stack.map((x) => `# ${x}`.trim()).join('\n'),
  };
}
