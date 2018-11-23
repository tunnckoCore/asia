import nodeInternals from './node-internals';

export const hasProcess = process && typeof process === 'object';
export function normalizeError(error) {
  const stack = [];

  if (error.stack) {
    error.stack
      .split('\n')
      .slice(1)
      .filter((line) => line.trim().startsWith('at'))
      .forEach((line) => {
        const isInternal = nodeInternals.some(
          (internal) =>
            line.includes('asia/dist') ||
            new RegExp(`\\(${internal}.+`).test(line),
        );

        if (!isInternal) {
          stack.push(`  ${line.trim()}`);
        }
      });
  }

  const lines = error.message.split('\n');

  const message = lines
    .slice(1)
    .map((line) => `# ${line}`)
    .join('\n');

  stack.unshift('', 'Stack:');

  return {
    name: error.name,
    head: lines[0],
    message,
    stack: stack.map((x) => `# ${x}`.trim()).join('\n'),
  };
}
