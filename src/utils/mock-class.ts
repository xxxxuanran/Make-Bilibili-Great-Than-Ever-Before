import { noop } from 'foxts/noop';
import { logger } from '../logger';

export function createMockClass(
  className: string,
  instanceMethods: Record<string | symbol, (this: never) => any> = {},
  staticMethods: Record<string | symbol, (this: never) => any> = {}
) {
  const fakeClassInstance = new Proxy(noop, {
    get(target, prop) {
      if (prop in instanceMethods) {
        return instanceMethods[prop];
      }
      return (...args: unknown[]) => {
        logger.log(`(new ${className})[${String(prop)}] called with arguments:`, args);
      };
    }
  });

  return new Proxy(class {}, {
    construct() {
      return fakeClassInstance;
    },
    get(target, prop) {
      if (prop in staticMethods) {
        return staticMethods[prop];
      }
      return (...args: unknown[]) => {
        logger.log(`window.${className}[${String(prop)}] called with arguments:`, args);
      };
    }
  });
}
