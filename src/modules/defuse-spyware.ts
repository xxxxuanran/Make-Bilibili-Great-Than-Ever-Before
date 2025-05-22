import { noop, trueFn } from 'foxts/noop';
import { getUrlFromRequest } from '../utils/get-url-from-request';
import { defineReadonlyProperty } from '../utils/define-readonly-property';
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { createRetrieKeywordFilter } from 'foxts/retrie';

const shouldDefuseUrl = createRetrieKeywordFilter([
  'data.bilibili.com',
  'cm.bilibili.com',
  'api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi'
]);

const defuseSpyware: MakeBilibiliGreatThanEverBeforeModule = {
  name: 'defuse-spyware',
  description: '禁用叔叔日志上报和用户跟踪的无限请求风暴',
  any({ onBeforeFetch, onXhrOpen }) {
    defineReadonlyProperty(unsafeWindow.navigator, 'sendBeacon', trueFn);

    class SentryHub {
      bindClient = noop;
    }

    class MReporter {
      appear = noop;
      click = noop;
      tech = noop;
      pv = noop;
      import = { auto: noop };
      report = noop;
    }

    class ReporterPb {
      click = {};
      custom = {};
      exposure = {};
      report = {};
      tech = {};
      pv = {};
    }

    class EmptyClass { }

    const fakeSentry = {
      SDK_NAME: 'sentry.javascript.browser',
      SDK_VERSION: '0.0.0',
      BrowserClient: EmptyClass,
      Hub: SentryHub,
      Integrations: {
        Vue: EmptyClass
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
      value: fakeSentry,
      writable: false,
      enumerable: false
    });
    Object.defineProperty(unsafeWindow, 'MReporter', {
      value: MReporter,
      writable: false,
      enumerable: false
    });
    Object.defineProperty(unsafeWindow, 'ReporterPb', {
      value: ReporterPb,
      writable: false,
      enumerable: false
    });
    Object.defineProperty(unsafeWindow, '__biliUserFp__', {
      value: {
        init: noop,
        queryUserLog() {
          return [];
        }
      },
      writable: false,
      enumerable: false
    });
    defineReadonlyProperty(unsafeWindow, '__USER_FP_CONFIG__', undefined);
    defineReadonlyProperty(unsafeWindow, '__MIRROR_CONFIG__', undefined);

    onBeforeFetch((fetchArgs) => {
      const url = getUrlFromRequest(fetchArgs[0]);

      if (typeof url === 'string' && shouldDefuseUrl(url)) {
        return new Response();
      };

      return fetchArgs;
    });

    onXhrOpen((args) => {
      let url = args[1];
      if (typeof url !== 'string') {
        url = url.href;
      }

      if (shouldDefuseUrl(url)) {
        return null;
      }

      return args;
    });
  }
};

export default defuseSpyware;
