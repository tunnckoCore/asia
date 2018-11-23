import { normalizeError } from './utils';

export default {
  before() {
    console.log('TAP version 13');
  },
  beforeEach() {},
  afterEach(item) {
    const ok = item.reason ? 'not ok' : 'ok';
    const todo = item.todo ? '# TODO' : '';
    const type = item.skip ? '# SKIP' : todo;

    console.log(`# ${item.title}`);

    if (item.reason) {
      const { message, head, stack } = normalizeError(item.reason);
      console.log(ok, item.id, '-', item.title);
      console.log('#');
      console.log('# FAIL!', head);
      console.log(message);
      console.log(stack);
      console.log('#');
    } else {
      console.log(ok, item.id, '-', item.title, type);
    }
  },

  after(options) {
    console.log(`1..${options.stats.count}`);
    console.log('# tests', options.stats.count);
    console.log('# pass', options.stats.pass);

    if (options.stats.skip) {
      console.log('# skip', options.stats.skip);
    }

    if (options.stats.todo) {
      console.log('# todo', options.stats.todo);
    }

    if (options.stats.fail) {
      console.log('# fail', options.stats.fail);
      console.log('#');
    } else {
      console.log('#');
      console.log('# ok');
    }
  },
};
