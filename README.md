JSON.stringify Raw
==================

[![Build Status: Linux](https://img.shields.io/travis/kevinoid/json-stringify-raw/master.svg?style=flat&label=build+on+linux)](https://travis-ci.org/kevinoid/json-stringify-raw)
[![Build Status: Windows](https://img.shields.io/appveyor/ci/kevinoid/json-stringify-raw/master.svg?style=flat&label=build+on+windows)](https://ci.appveyor.com/project/kevinoid/json-stringify-raw)
[![Coverage](https://img.shields.io/codecov/c/github/kevinoid/json-stringify-raw.svg?style=flat)](https://codecov.io/github/kevinoid/json-stringify-raw?branch=master)
[![Dependency Status](https://img.shields.io/david/kevinoid/json-stringify-raw.svg?style=flat)](https://david-dm.org/kevinoid/json-stringify-raw)
[![Supported Node Version](https://img.shields.io/node/v/json-stringify-raw.svg?style=flat)](https://www.npmjs.com/package/json-stringify-raw)
[![Version on NPM](https://img.shields.io/npm/v/json-stringify-raw.svg?style=flat)](https://www.npmjs.com/package/json-stringify-raw)

An implementation of
[`JSON.stringify`](https://tc39.es/ecma262/#sec-json.stringify) where the
value returned by the replacer function is used verbatim.  This gives callers
more control over how values are serialized, including the ability to create
JSON which is not strictly valid.


## Introductory Example

To produce JSON where all numbers have two digits after the decimal:

```js
const stringify = require('json-stringify-raw');
function replaceFixed(key, value) {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
}
stringify([1, 2, true], replaceFixed); // '[1.00,2.00,true]'
```


## Installation

[This package](https://www.npmjs.com/package/json-stringify-raw) can be
installed using [npm](https://www.npmjs.com/), either globally or locally, by
running:

```sh
npm install json-stringify-raw
```

## Recipes

### Produce Infinity and NaN

Some JSON parsers recognize `NaN` and `Infinity`, which are not permitted in
JSON (as defined by [RFC 8259](https://tools.ietf.org/html/rfc8259)).  To
produce these:

```js
const stringify = require('json-stringify-raw');
function replaceInfNaN(key, value) {
  switch (value) {
    case Infinity: return 'Infinity';
    case -Infinity: return '-Infinity';
    default: if (Number.isNaN(value)) return 'NaN';
  }
}
stringify([NaN, null, Infinity], replaceInfNaN); // '[NaN,null,Infinity]'
```

### Omit values in Arrays

Unlike array initializers in JavaScript, JSON requires every array element to
be specified.  To produce JSON which omits missing and undefined values from
arrays:

```js
const stringify = require('json-stringify-raw');
function replaceArrayUndef(key, value) {
  if (value === undefined && Array.isArray(this)) {
    return '';
  }
}
stringify([0, , undefined, null], arrayUndef); // '[0,,,null]'
```

**Warning:** The above code represents `[1,undefined]` as `[1,]` which is a
JavaScript array initializer for an array with length 1, rather than the input
value which has length 2 (and could be represented as `[1,,]`).  Consider how
a JSON parser would interpret JSON with trailing comma.

More examples can be found in the [test
specifications](https://kevinoid.github.io/json-stringify-raw/spec).


## API Docs

To use this module as a library, see the [API
Documentation](https://kevinoid.github.io/json-stringify-raw/api).


## Contributing

Contributions are appreciated.  Contributors agree to abide by the [Contributor
Covenant Code of
Conduct](https://www.contributor-covenant.org/version/1/4/code-of-conduct.html).
If this is your first time contributing to a Free and Open Source Software
project, consider reading [How to Contribute to Open
Source](https://opensource.guide/how-to-contribute/)
in the Open Source Guides.

If the desired change is large, complex, backwards-incompatible, can have
significantly differing implementations, or may not be in scope for this
project, opening an issue before writing the code can avoid frustration and
save a lot of time and effort.


## License

This project is available under the terms of the [MIT License](LICENSE.txt).
See the [summary at TLDRLegal](https://tldrlegal.com/license/mit-license).
