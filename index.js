/**
 * @module json-stringify-raw
 * @copyright Copyright 2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 * @module modulename
 */

'use strict';

// Note: object stack is global state to handle replacer calling stringify.
const stack = [];

// Note: @this doesn't allow documentation beyond type.  Doc in @description.
// See https://github.com/jsdoc/jsdoc/issues/1782
//
// Note: @callback (and @param references) must declare module explicitly
// See https://github.com/jsdoc/jsdoc/issues/356

/** Function to selectively replace values in JSON output.
 *
 * Called with <code>this</code> set to the object on which the value is a
 * property.
 *
 * @callback module:json-stringify-raw~replacerFunction
 * @param {string} key Name of property value to replace, or empty string for
 * a value which was not passed as a property.
 * @param {*} value Value to replace.
 * @returns {?string|boolean} A string which represents the value in the JSON,
 * a boolean to include or exclude the property from the JSON, or
 * {@link null} or {@link undefined} to indicate that the value should be
 * stringified normally, without replacement.  Any other value will cause
 * {@link TypeError} to be thrown.
 */

/** Converts a given array to a JSON string, using a given replacer, gap, and
 * indent.
 *
 * @private
 * @param {!Array} array Array to be converted to JSON.
 * @param {module:json-stringify-raw~replacerFunction} replacer Value replacer.
 * @param {string} gap String added to indent each array element.
 * @param {string} indent String used to indent the array as a whole.
 * @returns {string} JSON representing value.
 */
function stringifyArray(array, replacer, gap, indent) {
  const newIndent = indent + gap;
  const propSep = gap ? `,\n${newIndent}` : ',';

  let partial;
  for (let i = 0; i < array.length; i += 1) {
    // eslint-disable-next-line no-use-before-define
    const strP = stringifyProperty(array, `${i}`, replacer, gap, newIndent);
    if (partial === undefined) {
      partial = '';
    } else {
      partial += propSep;
    }
    partial += strP === undefined ? 'null' : strP;
  }

  if (!partial) {
    return '[]';
  }

  return gap ? `[\n${newIndent}${partial}\n${indent}]`
    : `[${partial}]`;
}

/** Converts a given object to a JSON string, using a given replacer, gap, and
 * indent.
 *
 * @private
 * @param {!object} object Object to be converted to JSON.
 * @param {module:json-stringify-raw~replacerFunction} replacer Value replacer.
 * @param {string} gap String added to indent each object property.
 * @param {string} indent String used to indent the object as a whole.
 * @returns {string} JSON representing value.
 */
function stringifyObject(object, replacer, gap, indent) {
  const newIndent = indent + gap;
  const propSep = gap ? `,\n${newIndent}` : ',';

  let partial = '';
  for (const key of Object.keys(object)) {
    // eslint-disable-next-line no-use-before-define
    const strP = stringifyProperty(object, key, replacer, gap, newIndent);
    if (strP !== undefined) {
      if (partial) {
        partial += propSep;
      }
      partial += JSON.stringify(key);
      partial += gap ? ': ' : ':';
      partial += strP;
    }
  }

  if (!partial) {
    return '{}';
  }

  return gap ? `{\n${newIndent}${partial}\n${indent}}`
    : `{${partial}}`;
}

/** Converts a given property of a given object to a JSON string, using a given
 * replacer, gap, and indent.
 *
 * @private
 * @param {!object} holder Object holding property to be converted to JSON.
 * @param {string} key Name of property to be converted to JSON.
 * @param {module:json-stringify-raw~replacerFunction} replacer Value replacer.
 * @param {string} gap String added to indent each child properties.
 * @param {string} indent String used to indent subsequent values.
 * @returns {string=} JSON for value, or {@link undefined} if not representable.
 */
function stringifyProperty(holder, key, replacer, gap, indent) {
  let value = holder[key];

  if (value !== null
    && (typeof value === 'object' || typeof value === 'bigint')) {
    const { toJSON } = value;
    if (typeof toJSON === 'function') {
      value = toJSON.call(value, key);
    }
  }

  const replaced = replacer.call(holder, key, value);
  // Replacer can act as value filter by returning boolean.
  // Note: JSON.stringify uses undefined for this, but it's so convenient
  // to treat undefined as "don't replace", that false was chosen instead.
  if (replaced === false) {
    return undefined;
  }
  if (typeof replaced === 'string') {
    return replaced;
  }
  if (replaced !== undefined && replaced !== null && replaced !== true) {
    throw new TypeError(
      `replacer returned non-string, non-boolean value: ${replaced}`,
    );
  }

  if (value === null) {
    return 'null';
  }

  // Unwrap primitive wrapper objects
  if (value instanceof BigInt
    || value instanceof Boolean
    || value instanceof Number
    || value instanceof String) {
    value = value.valueOf();
  }

  switch (typeof value) {
    case 'undefined': return undefined;
    case 'function': return undefined;
    case 'boolean': return `${value}`;
    case 'number': return Number.isFinite(value) ? `${value}` : 'null';
    case 'object': break;
    default: return JSON.stringify(value);
  }

  if (stack.includes(value)) {
    throw new TypeError('Converting circular structure to JSON');
  }
  stack.push(value);
  try {
    return Array.isArray(value)
      ? stringifyArray(value, replacer, gap, indent)
      : stringifyObject(value, replacer, gap, indent);
  } finally {
    stack.pop();
  }
}

/** Converts a given value to a JSON string, optionally using a given
 * replacer function and spacing.
 *
 * @see {@link https://tc39.es/ecma262/#sec-numeric-types-number-tostring}
 * @param {*} value Value to be converted to JSON.
 * @param {?(module:json-stringify-raw~replacerFunction|Array<string|number>)=
 * } replacer Optional function to selectively replace values in the JSON, or
 * array of property names which will be converted to JSON.
 * @param {?(number|string)=} space Number of spaces, or string added to each
 * nesting level during output.  If no indent is added, line breaks and
 * spacing between elements is omitted.  Indents are limited to 10
 * characters, negatives values are ignored.
 * @returns {string=} JSON for value, or {@link undefined} if not representable.
 * @throws {TypeError} If value contains circular references.
 * @throws {TypeError} If value contains a bigint and BigInt.prototype.toJSON
 * has not been defined.
 * @throws {TypeError} If replacer returns a value which is not a stirng,
 * boolean, null, or undefined.
 */
module.exports =
function stringify(value, replacer, space) {
  if (typeof replacer !== 'function') {
    return JSON.stringify(value, replacer, space);
  }

  if (space instanceof Number) {
    space = Number(space);
  } else if (space instanceof String) {
    space = String(space);
  }

  let gap = '';
  if (typeof space === 'number') {
    if (space >= 1) {
      gap = '          '.slice(0, space);
    }
  } else if (typeof space === 'string') {
    gap = space.slice(0, 10);
  }

  return stringifyProperty({ '': value }, '', replacer, gap, '');
};
