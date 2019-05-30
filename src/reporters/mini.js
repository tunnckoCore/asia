import { outputError } from '../utils';

export default ({ options }) => ({
  afterEach(item) {
    /* istanbul ignore next */
    if (item.fail) {
      options.writeLine('not ok %s - %s', item.id, item.title);
      outputError(item.reason, options);
    }
  },
});
