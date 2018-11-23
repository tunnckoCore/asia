import { normalizeError, hasProcess } from './utils';

/* istanbul ignore next */
if (hasProcess) {
  process.env.NODE_DISABLE_COLORS = true;
  process.env.FORCE_COLOR = 0;
}

export default ({ options }) => ({
  before() {
    options.writeLine('TAP version 13');
  },
  beforeEach() {},
  afterEach(item) {
    if (item.reason) {
      options.writeLine('not ok %s - %s', item.id, item.title);

      const { message, head, stack } = normalizeError(item.reason);

      options.writeLine('# FAIL!', head);
      options.writeLine(message);

      if (options.showStack) {
        options.writeLine(stack);
      }
      options.writeLine('#');
      return;
    }
    if (item.todo) {
      options.writeLine('not ok %s - # TODO %s', item.id, item.title);
      return;
    }
    if (item.skip) {
      options.writeLine('ok %s - # SKIP %s', item.id, item.title);
      return;
    }

    options.writeLine('ok %s - %s', item.id, item.title);
  },

  after({ stats }) {
    options.writeLine(`1..${stats.count}`);
    options.writeLine('# tests', stats.count);
    options.writeLine('# pass', stats.pass);

    if (stats.skip) {
      options.writeLine('# skip', stats.skip);
    }

    if (stats.todo) {
      options.writeLine('# todo', stats.todo);
    }

    if (stats.fail) {
      options.writeLine('# fail', stats.fail);
      options.writeLine('#');
    } else {
      options.writeLine('#');
      options.writeLine('# ok');
    }
  },
});
