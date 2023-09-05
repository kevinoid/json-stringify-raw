/**
 * @copyright Copyright 2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

/* eslint-disable no-new-wrappers, unicorn/new-for-builtins */

const assert = require('assert');
const { runInNewContext } = require('vm');

// https://github.com/import-js/eslint-plugin-import/issues/2844
// eslint-disable-next-line import/extensions
const stringify = require('..');

const { deepStrictEqual, strictEqual } = assert;

const mixed = Object.assign(Object.create({ protoKey: true }), {
  undefined,
  null: null,
  true: true,
  false: false,
  'Boolean(true)': new Boolean(true),
  'Boolean(false)': new Boolean(false),
  0: 0,
  'Number(0)': new Number(0),
  1: 1,
  'Number(1)': new Number(1),
  0.5: 0.5,
  'Number(0.5)': new Number(0.5),
  Infinity,
  'Number(Infinity)': new Number(Infinity),
  '-Infinity': -Infinity,
  'Number(-Infinity)': new Number(-Infinity),
  NaN,
  'Number(NaN)': new Number(NaN),
  emptyObj: {},
  emptyArray: [],
  // eslint-disable-next-line no-sparse-arrays
  sparseArray: [1, , undefined, null],
  foreignEmptyArray: runInNewContext('[]'), // Note: not instanceof Array
  RegExp: /pattern/,
  Error: new Error('test'),
  Date: new Date(),
  function: function identity(arg) { return arg; },
  arrowFunction: (arg) => arg,
});
(function(a, b, c) {
  mixed.arguments = arguments;  // eslint-disable-line prefer-rest-params
}(true, undefined, 1));
Object.defineProperty(mixed, 'enumerableGetter', {
  enumerable: true,
  get: () => true,
});
Object.defineProperty(mixed, 'nonEnumerable', {
  value: true,
});

function throwsSame(runActual, runExpected, mustThrow) {
  let threwActual = false;
  let errActual;
  try {
    runActual();
  } catch (err) {
    errActual = err;
    threwActual = true;
  }

  let threwExpected = false;
  let errExpected;
  try {
    runExpected();
  } catch (err) {
    errExpected = err;
    threwExpected = true;
  }

  deepStrictEqual(errActual, errExpected);
  strictEqual(threwActual, threwExpected);
  assert(!mustThrow || threwActual, `Expected ${runActual} to throw`);
}

describe('stringify', () => {
  describe('behaves like JSON.stringify', () => {
    it('has same .name', () => {
      strictEqual(
        stringify.name,
        JSON.stringify.name,
      );
    });

    it('has same .length', () => {
      strictEqual(
        stringify.length,
        JSON.stringify.length,
      );
    });

    it('for no arguments', () => {
      strictEqual(
        stringify(),
        JSON.stringify(),
      );
    });

    it('for one argument', () => {
      strictEqual(
        stringify(mixed),
        JSON.stringify(mixed),
      );
    });

    it('for empty Array replacer', () => {
      strictEqual(
        stringify(mixed, []),
        JSON.stringify(mixed, []),
      );
    });

    it('for non-empty Array replacer', () => {
      strictEqual(
        stringify(mixed, ['true']),
        JSON.stringify(mixed, ['true']),
      );
    });

    it('for number space', () => {
      strictEqual(
        stringify(mixed, () => undefined, 2),
        JSON.stringify(mixed, null, 2),
      );
    });

    it('for Number space', () => {
      strictEqual(
        stringify(mixed, () => undefined, new Number(2)),
        JSON.stringify(mixed, null, new Number(2)),
      );
    });

    it('for non-integer space', () => {
      strictEqual(
        stringify(mixed, () => undefined, 2.6),
        JSON.stringify(mixed, null, 2.6),
      );
    });

    it('for space larger than 10', () => {
      strictEqual(
        stringify(mixed, () => undefined, 15),
        JSON.stringify(mixed, null, 15),
      );
    });

    it('for negative space', () => {
      strictEqual(
        stringify(mixed, () => undefined, -1),
        JSON.stringify(mixed, null, -1),
      );
    });

    it('for string space', () => {
      strictEqual(
        stringify(mixed, () => undefined, 'X'),
        JSON.stringify(mixed, null, 'X'),
      );
    });

    it('for String space', () => {
      strictEqual(
        stringify(mixed, () => undefined, new String('X')),
        JSON.stringify(mixed, null, new String('X')),
      );
    });

    it('for empty string space', () => {
      strictEqual(
        stringify(mixed, () => undefined, ''),
        JSON.stringify(mixed, null, ''),
      );
    });

    it('for empty String space', () => {
      strictEqual(
        stringify(mixed, () => undefined, new String('')),
        JSON.stringify(mixed, null, new String('')),
      );
    });

    it('for string space longer than 10', () => {
      strictEqual(
        stringify(mixed, () => undefined, 'XXXXXXXXXXXXXXX'),
        JSON.stringify(mixed, null, 'XXXXXXXXXXXXXXX'),
      );
    });

    it('for Array with non-numeric keys', () => {
      const arr = [];
      arr.key1 = true;
      arr.key2 = 1;
      strictEqual(
        stringify(arr, () => undefined),
        JSON.stringify(arr),
      );
    });

    it('calls replacer with same arguments', () => {
      const actualArgs = [];
      const actualThis = [];
      stringify(mixed, function() {
        actualThis.push(this);
        actualArgs.push(arguments); // eslint-disable-line prefer-rest-params
      });

      const expectedArgs = [];
      const expectedThis = [];
      JSON.stringify(mixed, function(k, v) {
        expectedThis.push(this);
        expectedArgs.push(arguments); // eslint-disable-line prefer-rest-params
        return v;
      });

      deepStrictEqual(actualArgs, expectedArgs);
      deepStrictEqual(actualThis, expectedThis);
    });

    it('omitting first value in object', () => {
      const obj = { a: 1, b: 2 };
      strictEqual(
        stringify(obj, (k) => k !== 'a', 2),
        JSON.stringify(obj, (k, v) => (k === 'a' ? undefined : v), 2),
      );
    });

    it('omitting last value in object', () => {
      const obj = { a: 1, b: 2 };
      strictEqual(
        stringify(obj, (k) => k !== 'b', 2),
        JSON.stringify(obj, (k, v) => (k === 'b' ? undefined : v), 2),
      );
    });

    it('omitting only value in object', () => {
      const obj = { a: 1 };
      strictEqual(
        stringify(obj, (k) => k !== 'a', 2),
        JSON.stringify(obj, (k, v) => (k === 'a' ? undefined : v), 2),
      );
    });

    it('omitting first value in Array', () => {
      const arr = [1, 2];
      strictEqual(
        stringify(arr, (k) => k !== '0', 2),
        JSON.stringify(arr, (k, v) => (k === '0' ? undefined : v), 2),
      );
    });

    it('omitting last value in Array', () => {
      const arr = [1, 2];
      strictEqual(
        stringify(arr, (k) => k !== '1', 2),
        JSON.stringify(arr, (k, v) => (k === '1' ? undefined : v), 2),
      );
    });

    it('omitting only value in Array', () => {
      const arr = [1];
      strictEqual(
        stringify(arr, (k) => k !== '0', 2),
        JSON.stringify(arr, (k, v) => (k === '0' ? undefined : v), 2),
      );
    });

    it('for directly cyclic object', () => {
      const obj = {};
      obj.obj = obj;

      let errActual;
      try {
        stringify(obj, () => undefined);
      } catch (err) {
        errActual = err;
      }

      let errExpected;
      try {
        JSON.stringify(obj);
      } catch (err) {
        errExpected = err;
      }

      // Error message contains circular path since Node 12.
      // Only check that our message is a prefix of built-in message
      if (errActual
        && errExpected
        && errExpected.message.startsWith(errActual.message)) {
        errActual.message = errExpected.message;
      }

      deepStrictEqual(errActual, errExpected);
    });

    it('for indirectly cyclic object', () => {
      const obj1 = {};
      obj1.obj2 = { obj1 };

      let errActual;
      try {
        stringify(obj1, () => undefined);
      } catch (err) {
        errActual = err;
      }

      let errExpected;
      try {
        JSON.stringify(obj1);
      } catch (err) {
        errExpected = err;
      }

      // Error message contains circular path since Node 12.
      // Only check that our message is a prefix of built-in message
      if (errActual
        && errExpected
        && errExpected.message.startsWith(errActual.message)) {
        errActual.message = errExpected.message;
      }

      deepStrictEqual(errActual, errExpected);
    });

    it('for repeated object', () => {
      const obj = {};
      const arr = [obj, obj];
      strictEqual(
        stringify(arr, () => undefined),
        JSON.stringify(arr),
      );
    });

    for (const obj of [
      new Boolean(true),
      new Number(1),
      new String('test'),
    ]) {
      const { name, prototype } = obj.constructor;
      it(`for .toJSON on ${name} prototype`, () => {
        prototype.toJSON = () => 'HERE';
        try {
          strictEqual(
            stringify(obj, () => undefined),
            JSON.stringify(obj),
          );
        } finally {
          delete prototype.toJSON;
        }
      });

      it(`for .toJSON on ${name}`, () => {
        obj.toJSON = () => 'HERE';
        strictEqual(
          stringify(obj, () => undefined),
          JSON.stringify(obj),
        );
      });
    }

    (typeof BigInt === 'function' ? describe : xdescribe)('BigInt', () => {
      it('for bigint', () => {
        throwsSame(
          () => stringify(BigInt(2), () => undefined),
          () => JSON.stringify(BigInt(2)),
          true,
        );
      });

      it('for BigInt', () => {
        throwsSame(
          () => stringify(Object(BigInt(2)), () => undefined),
          () => JSON.stringify(Object(BigInt(2))),
          true,
        );
      });

      it('for bigint with BigInt.prototype.toJSON', () => {
        // eslint-disable-next-line no-extend-native
        BigInt.prototype.toJSON = (k, v) => `${v}n`;
        try {
          strictEqual(
            stringify(BigInt(2), () => undefined),
            JSON.stringify(BigInt(2)),
          );
        } finally {
          delete BigInt.prototype.toJSON;
        }
      });

      it('for BigInt with BigInt.prototype.toJSON', () => {
        // eslint-disable-next-line no-extend-native
        BigInt.prototype.toJSON = (k, v) => `${v}n`;
        try {
          strictEqual(
            stringify(Object(BigInt(2)), () => undefined),
            JSON.stringify(Object(BigInt(2))),
          );
        } finally {
          delete BigInt.prototype.toJSON;
        }
      });
    });

    (typeof Symbol === 'function' ? describe : xdescribe)('Symbol', () => {
      const symbol = Symbol('symbol');
      const symbolObj = Object(symbol);

      it('for symbol', () => {
        strictEqual(
          stringify(symbol, () => undefined),
          JSON.stringify(symbol),
        );
      });

      it('for Symbol', () => {
        strictEqual(
          stringify(symbolObj, () => undefined),
          JSON.stringify(symbolObj),
        );
      });

      it('for symbol with Symbol.prototype.toJSON', () => {
        // eslint-disable-next-line no-extend-native
        Symbol.prototype.toJSON = (k, v) => `${v}`;
        try {
          strictEqual(
            stringify(symbol, () => undefined),
            JSON.stringify(symbol),
          );
        } finally {
          delete Symbol.prototype.toJSON;
        }
      });

      it('for Symbol with Symbol.prototype.toJSON', () => {
        // eslint-disable-next-line no-extend-native
        Symbol.prototype.toJSON = (k, v) => `${v}`;
        try {
          strictEqual(
            stringify(symbolObj, () => undefined),
            JSON.stringify(symbolObj),
          );
        } finally {
          delete Symbol.prototype.toJSON;
        }
      });

      it('for symbol properties', () => {
        const obj = { [symbol]: true };
        strictEqual(
          stringify(obj, () => undefined),
          JSON.stringify(obj),
        );
      });
    });
  });

  it('ignores undefined from replacer', () => {
    strictEqual(
      stringify(1, () => undefined),
      '1',
    );
  });

  it('ignores null from replacer', () => {
    strictEqual(
      stringify(1, () => null),
      '1',
    );
  });

  for (const val of [1, {}]) {
    it(`throws TypeError if replacer returns ${typeof val}`, () => {
      assert.throws(
        () => stringify(1, () => val),
        TypeError,
      );
    });
  }

  it('can replace undefined', () => {
    strictEqual(
      stringify(undefined, () => 'TEST'),
      'TEST',
    );
  });

  it('can replace with empty string', () => {
    strictEqual(
      stringify(1, () => ''),
      '',
    );
  });

  it('can replace with empty string in Array', () => {
    strictEqual(
      stringify([1, 2], (k, v) => (typeof v === 'number' ? '' : undefined)),
      '[,]',
    );
  });

  it('does not call replacer on replaced values', () => {
    const child = {};
    const parent = { child };
    let callCount = 0;
    function replacer(k, v) {
      callCount += 1;
      strictEqual(callCount, 1);
      strictEqual(v, parent);
      return 'TEST';
    }
    strictEqual(
      stringify(parent, replacer),
      'TEST',
    );
  });

  describe('false from replacer', () => {
    it('produces undefined for top value', () => {
      strictEqual(
        stringify({}, () => false),
        undefined,
      );
    });

    it('omits key from object', () => {
      strictEqual(
        stringify({ a: true, b: true }, (k) => k !== 'a'),
        '{"b":true}',
      );
    });

    it('produces null in array', () => {
      strictEqual(
        stringify([1, 2, 3], (k) => k !== '1'),
        '[1,null,3]',
      );
    });
  });
});
