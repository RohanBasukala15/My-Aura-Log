/* eslint-disable no-restricted-syntax, no-param-reassign, guard-for-in */

export function defaults<T extends object>(obj: Partial<T>, ...args: Partial<T>[]) {
  args.forEach((source) => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === undefined) {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}

export function extend<T extends object>(obj: Partial<T>, ...args: Partial<T>[]) {
  args.forEach((source) => {
    if (source) {
      for (const prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
}
