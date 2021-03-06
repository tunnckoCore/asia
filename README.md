# asia [![npm version][npmv-img]][npmv-url] [![github release][ghrelease-img]][ghrelease-url] [![License][license-img]][license-url]

> Blazingly fast, magical and minimalist testing framework for Today and Tomorrow

Please consider following this project's author, [Charlike Mike Reagent](https://github.com/tunnckoCore), and :star: the project to show your :heart: and support.

<div id="thetop"></div>

[![Code style][codestyle-img]][codestyle-url]
[![CircleCI linux build][linuxbuild-img]][linuxbuild-url]
[![CodeCov coverage status][codecoverage-img]][codecoverage-url]
[![DavidDM dependency status][dependencies-img]][dependencies-url]
[![Renovate App Status][renovateapp-img]][renovateapp-url]
[![Make A Pull Request][prs-welcome-img]][prs-welcome-url]
[![Semantically Released][new-release-img]][new-release-url]

If you have any _how-to_ kind of questions, please read the [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) documents.  
For bugs reports and feature requests, [please create an issue][open-issue-url] or ping
[@tunnckoCore](https://twitter.com/tunnckoCore) at Twitter.

[![Become a Patron][patreon-img]][patreon-url]
[![Conventional Commits][ccommits-img]][ccommits-url]
[![NPM Downloads Weekly][downloads-weekly-img]][npmv-url]
[![NPM Downloads Monthly][downloads-monthly-img]][npmv-url]
[![NPM Downloads Total][downloads-total-img]][npmv-url]
[![Share Love Tweet][shareb]][shareu]

Project is [semantically](https://semver.org) & automatically released on [CircleCI](https://circleci.com) with [new-release][] and its [New Release](https://github.com/apps/new-release) GitHub App.

<!-- Logo when needed:

<p align="center">
  <a href="https://github.com/tunnckoCoreLabs/asia">
    <img src="./media/logo.png" width="85%">
  </a>
</p>

-->

## Highlights

- Runs tests in series or parallel, concurrently
- Fast and future-proof design, tiny footprint
- Secure environment, no implicit globals
- [TAP Specification](https://testanything.org/tap-specification.html) compliant output reporting
- Simple test syntax and enforce writing atomic tests
- Clean stacktraces, when optionally shown
- Works inside any CommonJS environment and the Browser
- Support writing your tests in latest JavaScript syntax
- Support `async/await` functions, Promises and Observables
- Assertion agnostic, works with `assert` and Jest's `expect`
- Works well with `nyc` for test coverage reporting
- Well documented, well tested and small & quality code base 

## Table of Contents

- [Installation requirements](#installation-requirements)
- [CLI Usage](#cli-usage)
  * [Passing flags](#passing-flags)
  * [Environment variables](#environment-variables)
- [Transpilation and ES Modules](#transpilation-and-es-modules)
- [Test coverage](#test-coverage)
- [Incremental testing ("watch mode")](#incremental-testing-watch-mode)
- [Testing with multiple files](#testing-with-multiple-files)
- [Regular use](#regular-use)
  * [Server Side](#server-side)
  * [In the Browser](#in-the-browser)
- [Using the API](#using-the-api)
  * [Server Side](#server-side-1)
  * [In the browsers](#in-the-browsers)
- [API](#api)
  * [src/api.js](#srcapijs)
    + [Asia](#asia)
    + [test](#test)
    + [test.skip](#testskip)
    + [test.todo](#testtodo)
    + [.run](#run)
- [See Also](#see-also)
- [Contributing](#contributing)
  * [Follow the Guidelines](#follow-the-guidelines)
  * [Support the project](#support-the-project)
  * [OPEN Open Source](#open-open-source)
  * [Wonderful Contributors](#wonderful-contributors)
- [License](#license)

_(TOC generated by [verb](https://github.com/verbose/verb) using [markdown-toc](https://github.com/jonschlinkert/markdown-toc))_

## Installation requirements

This project requires [**Node.js**](https://nodejs.org) **^8.10.0 || >=10.13.0** or compatible browser. Install it using [**yarn**](https://yarnpkg.com) or [**npm**](https://npmjs.com).  
_We highly recommend to use Yarn when you think to contribute to this project._

```
$ yarn add --dev asia
```

## CLI Usage

Eventhough we currently don't have CLI we still can control a small bits.
There are two variants, through environment variables and command line flags.

### Passing flags

We can pass flags directly to the `node` executable, because they are not conflicting whit it.

**--serial**

Allows running the tests in series.

```
node test/index.js --serial
```

**--showStack**

Shows the stack traces, because by default we don't show them in the TAP output.

```
node test/index.js --showStack
```

**--reporter / -R**

Currently there 2 available reporters: "tap" (default) and "mini".
The name should match the name of the file in `src/reporters/` folder.

```
node -r esm test/index.js -R mini
```

**--relativePaths**

When stack traces are shown (e.g. when `--showStack`) then paths will be relative to the cwd.
Defaults to `true`.

```
node -r esm test/index.js --relativePaths
# disable
node -r esm test/index.js --no-relativePaths
```

### Environment variables

_Note: This works only when there is `process.env` in the environment!_

**ASIA_SHOW_STACK**

If you want the stacktraces to be shown on the TAP output, then pass `ASIA_SHOW_STACK=1`

```
ASIA_SHOW_STACK=1 node test/index.js 
```

**ASIA_SERIAL**

_Note: This works only when there is `process.env` in the environment!_

If you want tests to be running in series (in order), then pass `ASIA_SERIAL=1`

```
ASIA_SERIAL=1 node test/index.js 
```

## Transpilation and ES Modules

By default, tests are working in CommonJS. But if you want to write with modern and latest
JavaScript features, then you may need Babel or the [esm][] loader. In this case 
you can pass a `@babel/register` or the `esm` hook to the Node.js or 

```
node -r esm test/index.js
# Babel
node -r @babel/register test/index.js
```

## Test coverage

In case you want to have test coverage, Asia works great with the [nyc][]/Istanbul.

```
nyc --reporter lcov --reporter text node test/index.js
```

When you want transpilation and still working test coverage, then you need to
pass the `require` hooks to the `nyc` instead to the `node` binary.

```
nyc --require esm node test/index.js
nyc --require @babel/register node test/index.js
```

## Incremental testing ("watch mode")

For more faster feedback loop, you may want to use [nodemon][].

The following runs tests on every file change in `src/` and `test/` folders

```
nodemon --exec 'node -r esm test/index.js' '{src,test}/**/*.js'
```

## Testing with multiple files

Because currently we don't have CLI, easy workaround to run multiple files
is to have one `test/index.js` which imports the other test file.

For example, if you have the following `test/foo.js` and `test/bar.js`

**test/foo.js**

```js
import assert from 'assert';
import test from 'asia';

test('some foo test', () => {});

test.skip('skip tests never run', () => {
  console.log('hoho');
});

test('foo second', () => {
  assert.strictEqual(1, 2);
});
```

**test/bar.js**

```js
import expect from 'expect';
import test from 'asia';

test('ok yeah', () => {
  expect(1).toBe(1);
});

test.todo('some todo test');

test('one two three', async () => {
  const val = await Promise.resolve({ a: 'b' });
  expect(val).toBe(1234); // throws
});
```

Then you just need to import all the test files one main (e.g. `test/index.js` or `test.js`) file.

```js
import './foo';
import './bar';
```

Run it with `node -r esm test/index.js` and so, it will output (correctly), the following

```
TAP version 13
ok 2 - # SKIP skip tests never run
not ok 5 - # TODO some todo test
ok 1 - some foo test
not ok 3 - foo second
# FAIL!
#
# At: _659‍.r.test (./example/foo.js:11:10)
#
# Message: Input A expected to strictly equal input B:
# + expected - actual
#
# - 1
# + 2
#
ok 4 - ok yeah
not ok 6 - one two three
# FAIL!
#
# At: _42f‍.r.test (./example/bar.js:12:15)
#
# Message: expect(received).toBe(expected) // Object.is equality
#
# Expected: 1234
# Received: {"a": "b"}
#
# Difference:
#
#   Comparing two different types of values. Expected number but received object.
#
1..6
# tests 6
# pass 2
# skip 1
# todo 1
# fail 2
#
```

## Regular use

```bash
$ yarn add --dev asia
```

### Server Side
If you want to use it in your tests, just do the following

Using ES Modules:

```js
import expect from 'expect'
import test from 'asia';

test('my awesome test title', () => {
  expect(typeof test).toBe('function');
});
```

Using inside CommonJS environment (e.g. Node.js):

```js
const assert = require('assert');
const test = require('asia');

test('some test in commonjs', () => {
  assert.strictEqual(typeof test, 'function');
  assert.strictEqual(typeof test.skip, 'function');
  assert.strictEqual(typeof test.todo, 'function');
});
```

### In the Browser

Using `type="module"`

```html
<script type="module">
  import test from 'https://unpkg.com/asia?module';

  test('foo bar', () => {
    console.log('my browser tests');
  });
</script>
```

Using the UMD bundle

```html
<script src="https://unpkg.com/asia/dist/index.js"></script>
<script type="text/javascript">
  const test = window.test;
  test('my awesome test', () => {});
</script>
```

## Using the API

```bash
$ yarn add asia
```

If you want to create something on top of it, e.g. CLI for example,
then you cannot use the default export `import 'asia'`, because it exposes
the `test()` method and runs the tests, automatically.

### Server Side

Using ES Modules:

```js
import Asia from 'asia/dist/api/es';
```

Using inside CommonJS environment (e.g. Node.js):

```js
const Asia = require('asia/dist/api/umd');
```

### In the browsers

Using `type="module"`

```html
<script type="module">
  import Asia from 'https://unpkg.com/asia/dist/api/es.js';
</script>
```

Using the UMD bundle

```html
<script src="https://unpkg.com/asia/dist/api/umd.js"></script>
<script type="text/javascript">
  const Asia = window.Asia;
</script>
```

## API

<!-- docks-start -->
_Generated using [docks](http://npm.im/docks)._

### [src/api.js](/src/api.js)

#### [Asia](/src/api.js#L49)
Constructor which can be initialized with optional `options` object.
On the `.test` method you can access the `skip` and `todo` methods.
For example `.test.skip(title, fn)` and `.test.todo(title)`.

This should be uses if you want to base something on top of the Asia API.
By default, the main export e.g. just `'asia'` exposes a default export function,
which is the `test()` method.

**Params**
- `options` **{object}** control tests `concurrency` or pass `serial: true` to run serially.

**Returns**
- `object` instance with `.test`, `.skip`, `.todo` and `.run` methods

**Examples**
```javascript
import Asia from 'asia/dist/api/es';

// or in CommonJS (Node.js)
// const Asia = require('asia/dist/api/umd');

const api = Asia({ serial: true });
console.log(api);
// => { test() {}, skip() {}, todo() {}, run() {} }

api.test('awesome test', async () => {
  await Promise.resolve(123);
});

api.test.skip('some skip test here', () => {
  console.log('this will not log');
});
api.skip('same as above', () => {
  console.log('this will not log');
});

api.test.todo('test without implementaton');
api.todo('test without implementaton');

api.run();
```

#### [test](/src/api.js#L97)
Define a regular test with `title` and `fn`.
Both `title` and `fn` params are required, otherwise it will throw.
Optionally you can pass `settings` options object, to make it a "skip"
or a "todo" test. For example `{ skip: true }`

**Params**
- `title` **{string}**
- `fn` **{function}**
- `settings` **{object}**

**Examples**
```javascript
import assert from 'assert';
import expect from 'expect';
import test from 'asia';

test('some awesome failing test', () => {
  expect(1).toBe(2);
});

test('foo passing async test', async () => {
  const res = await Promise.resolve(123);

  assert.strictEqual(res, 123);
});
```

#### [test.skip](/src/api.js#L141)
Define test with `title` and `fn` that will never run,
but will be shown in the output.

**Params**
- `title` **{string}** test title
- `fn` **{function}** test function implementaton

**Examples**
```javascript
import test from 'asia';

test.skip('should be skipped, but printed', () => {
  throw Error('test function never run');
});

test.skip('should throw, because expect test implementation');
```

#### [test.todo](/src/api.js#L165)
Define a test with `title` that will be marked as "todo" test.
Such tests do not have test implementaton function, if `fn` is given
than it will throw an error.

**Params**
- `title` **{string}** title of the "todo" test
- `fn` **{function}** do not pass test implementaton function

**Examples**
```javascript
import assert from 'assert';
import test from 'asia';

test.todo('should be printed and okey');

test.todo('should throw, because does not expect test fn', () => {
  assert.ok(true);
});
```

#### [.run](/src/api.js#L215)
Run all tests, with optional `settings` options, merged with those
passed from the constructor.
Currently the supported options are `serial` and `concurrency`.

**Params**
- `settings` **{object}** for example, pass `serial: true` to run the tests serially

**Returns**
- `Promise`

**Examples**
```javascript
import delay from 'delay';
import Asia from 'asia/dist/api/es';

const api = Asia({ serial: true });

api.test('first test', async () => {
  await delay(1000);
  console.log('one');
});

api.test('second test', () => {
  console.log('two');
});

api.run({ concurrency: 10 });
```

<!-- docks-end -->

**[back to top](#thetop)**

## See Also

Some of these projects are used here or were inspiration for this one, others are just related. So, thanks for your existance!

- [@tunnckocore/create-project](https://www.npmjs.com/package/@tunnckocore/create-project): Create and scaffold a new project, its GitHub repository and… [more](https://github.com/tunnckoCoreLabs/create-project) | [homepage](https://github.com/tunnckoCoreLabs/create-project "Create and scaffold a new project, its GitHub repository and contents")
- [@tunnckocore/scripts](https://www.npmjs.com/package/@tunnckocore/scripts): Universal and minimalist scripts & tasks runner. | [homepage](https://github.com/tunnckoCoreLabs/scripts "Universal and minimalist scripts & tasks runner.")
- [asia](https://www.npmjs.com/package/asia): Blazingly fast, magical and minimalist testing framework, for Today and… [more](https://github.com/olstenlarck/asia#readme) | [homepage](https://github.com/olstenlarck/asia#readme "Blazingly fast, magical and minimalist testing framework, for Today and Tomorrow")
- [charlike](https://www.npmjs.com/package/charlike): Small, fast and streaming project scaffolder with support for hundreds… [more](https://github.com/tunnckoCoreLabs/charlike) | [homepage](https://github.com/tunnckoCoreLabs/charlike "Small, fast and streaming project scaffolder with support for hundreds of template engines and sane defaults")
- [docks](https://www.npmjs.com/package/docks): Extensible system for parsing and generating documentation. It just freaking… [more](https://github.com/tunnckoCore/docks) | [homepage](https://github.com/tunnckoCore/docks "Extensible system for parsing and generating documentation. It just freaking works!")
- [git-commits-since](https://www.npmjs.com/package/git-commits-since): Get all commits since given period of time or by… [more](https://github.com/tunnckoCoreLabs/git-commits-since) | [homepage](https://github.com/tunnckoCoreLabs/git-commits-since "Get all commits since given period of time or by default from latest git semver tag. Understands and follows both SemVer and the Conventional Commits specification.")
- [gitcommit](https://www.npmjs.com/package/gitcommit): Lightweight and joyful `git commit` replacement. Conventional Commits compliant. | [homepage](https://github.com/tunnckoCore/gitcommit "Lightweight and joyful `git commit` replacement. Conventional Commits compliant.")
- [recommended-bump](https://www.npmjs.com/package/recommended-bump): Calculates recommended bump (next semver version) based on given array… [more](https://github.com/tunnckoCoreLabs/recommended-bump) | [homepage](https://github.com/tunnckoCoreLabs/recommended-bump "Calculates recommended bump (next semver version) based on given array of commit messages following Conventional Commits specification")

**[back to top](#thetop)**

## Contributing

### Follow the Guidelines

Please read the [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) documents for advices.  
For bugs reports and feature requests, [please create an issue][open-issue-url] or ping
[@tunnckoCore](https://twitter.com/tunnckoCore) at Twitter.

### Support the project

[Become a Partner or Sponsor?][patreon-url] :dollar: Check the **Partner**, **Sponsor** or **Omega-level** tiers! :tada: You can get your company logo, link & name on this file. It's also rendered on package page in [npmjs.com][npmv-url] and [yarnpkg.com](https://yarnpkg.com/en/package/asia) sites too! :rocket:

Not financial support? Okey! [Pull requests](https://github.com/tunnckoCoreLabs/contributing#opening-a-pull-request), stars and all kind of [contributions](https://opensource.guide/how-to-contribute/#what-it-means-to-contribute) are always
welcome. :sparkles:

### OPEN Open Source

This project is following [OPEN Open Source](http://openopensource.org) model

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is built on collective efforts and it's not strongly guarded by its founders.

There are a few basic ground-rules for its contributors

1. Any **significant modifications** must be subject to a pull request to get feedback from other contributors.
2. [Pull requests](https://github.com/tunnckoCoreLabs/contributing#opening-a-pull-request) to get feedback are _encouraged_ for any other trivial contributions, but are not required.
3. Contributors should attempt to adhere to the prevailing code-style and development workflow.

### Wonderful Contributors

Thanks to the hard work of these wonderful people this project is alive! It follows the
[all-contributors](https://github.com/kentcdodds/all-contributors) specification.  
Don't hesitate to add yourself to that list if you have made any contribution! ;) [See how,
here](https://github.com/jfmengels/all-contributors-cli#usage).

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars3.githubusercontent.com/u/5038030?v=4" width="120px;"/><br /><sub><b>Charlike Mike Reagent</b></sub>](https://tunnckocore.com)<br />[💻](https://github.com/tunnckoCoreLabs/asia/commits?author=tunnckoCore "Code") [📖](https://github.com/tunnckoCoreLabs/asia/commits?author=tunnckoCore "Documentation") [💬](#question-tunnckoCore "Answering Questions") [👀](#review-tunnckoCore "Reviewed Pull Requests") [🔍](#fundingFinding-tunnckoCore "Funding Finding") |
| :---: |

<!-- ALL-CONTRIBUTORS-LIST:END -->

Consider showing your [support](#support-the-project) to them. :sparkling_heart:

## License

Copyright (c) 2016-present, [Charlike Mike Reagent](https://tunnckocore.com) `<mameto2011@gmail.com>` & [contributors](#wonderful-contributors).  
Released under the [Apache-2.0 License][license-url].

<!-- Heading badges -->

[npmv-url]: https://www.npmjs.com/package/asia
[npmv-img]: https://badgen.net/npm/v/asia?icon=npm

[ghrelease-url]: https://github.com/tunnckoCoreLabs/asia/releases/latest
[ghrelease-img]: https://badgen.net/github/release/tunnckoCoreLabs/asia?icon=github

[license-url]: https://github.com/tunnckoCoreLabs/asia/blob/master/LICENSE
[license-img]: https://badgen.net/npm/license/asia

<!-- Front line badges -->

[codestyle-url]: https://github.com/airbnb/javascript
[codestyle-img]: https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb

[linuxbuild-url]: https://circleci.com/gh/tunnckoCoreLabs/asia/tree/master
[linuxbuild-img]: https://badgen.net/circleci/github/tunnckoCoreLabs/asia/master?label=build&icon=circleci

[codecoverage-url]: https://codecov.io/gh/tunnckoCoreLabs/asia
[codecoverage-img]: https://badgen.net/codecov/c/github/tunnckoCoreLabs/asia?icon=codecov

[dependencies-url]: https://david-dm.org/tunnckoCoreLabs/asia
[dependencies-img]: https://badgen.net/david/dep/tunnckoCoreLabs/asia?label=deps

[ccommits-url]: https://conventionalcommits.org/
[ccommits-img]: https://badgen.net/badge/conventional%20commits/v1.0.0/dfb317
[new-release-url]: https://ghub.io/new-release
[new-release-img]: https://badgen.net/badge/semantically/released/05c5ff

[downloads-weekly-img]: https://badgen.net/npm/dw/asia
[downloads-monthly-img]: https://badgen.net/npm/dm/asia
[downloads-total-img]: https://badgen.net/npm/dt/asia

[renovateapp-url]: https://renovatebot.com
[renovateapp-img]: https://badgen.net/badge/renovate/enabled/green
[prs-welcome-img]: https://badgen.net/badge/PRs/welcome/green
[prs-welcome-url]: http://makeapullrequest.com
[paypal-donate-url]: https://paypal.me/tunnckoCore/10
[paypal-donate-img]: https://badgen.net/badge/$/support/purple
[patreon-url]: https://www.patreon.com/bePatron?u=5579781
[patreon-img]: https://badgen.net/badge/patreon/tunnckoCore/F96854?icon=patreon
[patreon-sponsor-img]: https://badgen.net/badge/become/a%20sponsor/F96854?icon=patreon

[shareu]: https://twitter.com/intent/tweet?text=https://github.com/tunnckoCoreLabs/asia&via=tunnckoCore
[shareb]: https://badgen.net/badge/twitter/share/1da1f2?icon=twitter
[open-issue-url]: https://github.com/tunnckoCoreLabs/asia/issues/new

[esm]: https://github.com/standard-things/esm
[new-release]: https://github.com/tunnckoCoreLabs/new-release
[nodemon]: http://nodemon.io
[nyc]: https://github.com/istanbuljs/nyc
[semantic-release]: https://github.com/semantic-release/semantic-release