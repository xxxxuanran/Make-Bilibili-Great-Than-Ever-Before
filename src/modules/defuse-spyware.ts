// 禁用叔叔日志上报和用户跟踪的无限请求风暴

import { noop, trueFn } from 'foxts/noop';
import { getUrlFromRequest } from '../utils/get-url-from-request';
import { createMockClass } from '../utils/mock-class';

declare global {
  interface Window {
    MReporter: any,
    Sentry: any
  }
}

export default function defuseSpyware() {
  (($fetch) => {
    unsafeWindow.fetch = function (...args) {
      const url = getUrlFromRequest(args[0]);

      if (typeof url === 'string' && url.includes('data.bilibili.com')) return Promise.resolve(new Response());
      return Reflect.apply($fetch, this, args);
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method -- call with Reflect.apply
  })(unsafeWindow.fetch);

  (($open) => {
    globalThis.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args) {
      let url = args[1];
      if (typeof url !== 'string') {
        url = url.href;
      }
      if (url.includes('data.bilibili.com')) {
        this.send = noop;
        return;
      }
      return Reflect.apply($open, this, args);
    } as typeof XMLHttpRequest.prototype.open;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- call with Reflect.apply
  })(globalThis.XMLHttpRequest.prototype.open);

  unsafeWindow.navigator.sendBeacon = trueFn;

  unsafeWindow.MReporter = createMockClass('MReporter');

  const SentryHub = createMockClass('SentryHub', {}, {
    bindClient: noop
  });

  const fakeSentry = {
    SDK_NAME: 'sentry.javascript.browser',
    SDK_VERSION: '0.0.1145141919810',
    BrowserClient: createMockClass('Sentry.BrowserClient'),
    Hub: SentryHub,
    Integrations: {
      Vue: createMockClass('Sentry.Integrations.Vue'),
      GlobalHandlers: createMockClass('Sentry.Integrations.GlobalHandlers'),
      InboundFilters: createMockClass('Sentry.Integrations.InboundFilters')
    },
    init: noop,
    configureScope: noop,
    getCurrentHub: () => new SentryHub(),
    setContext: noop,
    setExtra: noop,
    setExtras: noop,
    setTag: noop,
    setTags: noop,
    setUser: noop,
    wrap: noop
  };

  Object.defineProperty(unsafeWindow, 'Sentry', {
    get() {
      return fakeSentry;
    },
    set: noop,
    configurable: false,
    enumerable: true
  });

  const mReport = createMockClass('MReport');
  Object.defineProperty(unsafeWindow, 'MReport', {
    get() {
      return mReport;
    },
    set: noop,
    configurable: false,
    enumerable: true
  });

  const reporterPb = createMockClass('ReporterPb');
  Object.defineProperty(unsafeWindow, 'ReporterPb', {
    get() {
      return reporterPb;
    },
    set: noop,
    configurable: false,
    enumerable: true
  });

  const biliUserFp = createMockClass('__biliUserFp__');

  Object.defineProperty(unsafeWindow, '__biliUserFp__', {
    get() { return biliUserFp; },
    set: noop,
    configurable: false,
    enumerable: true
  });
  Object.defineProperty(unsafeWindow, '__USER_FP_CONFIG__', { get: noop, set: noop, configurable: false, enumerable: true });
  Object.defineProperty(unsafeWindow, '__MIRROR_CONFIG__', { get: noop, set: noop, configurable: false, enumerable: true });
}
