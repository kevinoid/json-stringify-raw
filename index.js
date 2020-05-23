/**
 * @copyright Copyright 2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

// Note: object stack is global state to handle replacer calling stringify.
const stack = [];


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


function stringifyObject(object, replacer, gap, indent) {
  const newIndent = indent + gap;
  const propSep = gap ? `,\n${newIndent}` : ',';

  let partial = '';
  Object.keys(object).forEach((key) => {
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
  });

  if (!partial) {
    return '{}';
  }

  return gap ? `{\n${newIndent}${partial}\n${indent}}`
    : `{${partial}}`;
}


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
}


module.exports = stringify;
