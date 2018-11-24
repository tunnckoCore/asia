import mri from 'mri';
import Asia from './api';
import { outputError, hasProcess } from './utils';

let argv = {};

/* istanbul ignore next */
if (hasProcess) {
  /* eslint-disable no-inner-declarations */
  argv = mri(process.argv.slice(2), {
    alias: { reporter: 'R' },
  });

  const onerror = (err) => {
    const { stack } = outputError(err, {
      self: argv.self,
      writeLine: console.log,
    });

    /* istanbul ignore next */
    if (argv.showStack && stack) {
      console.log(stack);
      console.log('#');
    }

    process.exit(1);
  };
  process.on('uncaughtException', onerror);
  process.on('unhandledRejection', onerror);
}

const api = Asia(argv);

const mod = Object.assign(api.test, { Asia });

api.run();

export default mod;
