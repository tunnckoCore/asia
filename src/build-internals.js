'use strict';

const fs = require('fs');
const path = require('path');
const mod = require('module');

// removing duplicates
const internals = mod.builtinModules
  .filter((x) => !x.startsWith('internal'))
  .filter((x) => !x.startsWith('_stream_'))
  .filter((x) => !x.startsWith('_http_'))
  .filter((x) => !x.startsWith('_tls_'))
  .filter((x) => !x.startsWith('v8'))
  .filter((x) => !x.startsWith('node-inspect'))
  .concat('internal', '_stream_', '_http_', '_tls_', 'v8', 'node-inspect');

const filepath = path.join(__dirname, 'node-internals.js');
fs.writeFileSync(filepath, `export default ${JSON.stringify(internals)}`);
