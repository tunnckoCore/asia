import nextTick from 'next-job';
import Asia from './api';
import { normalizeError, hasProcess } from './utils';

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

nextTick(() => api.run());

export default mod;
