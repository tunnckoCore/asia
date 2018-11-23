import Asia from './api';
import { normalizeError, hasProcess } from './utils';

/* istanbul ignore next */
if (hasProcess) {
  const onerror = (err) => {
    const { message, stack } = normalizeError(err);
    console.log(message);
    console.log(stack);
    process.exit(1);
  };
  process.on('uncaughtException', onerror);
  process.on('unhandledRejection', onerror);
}

const api = Asia();

const mod = Object.assign(api.test, { Asia });

api.run();

export default mod;
