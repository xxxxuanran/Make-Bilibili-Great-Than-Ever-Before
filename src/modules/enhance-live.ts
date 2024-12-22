import { addStyle } from '../utils/add-style';
import { getUrlFromRequest } from '../utils/get-url-from-request';

declare global {
  interface Window {
    disableMcdn?: boolean
  }
}

// const mcdnRegexp = /[\dxy]+\.mcdn\.bilivideo\.cn:\d+/;
const qualityRegexp = /(live-bvc\/\d+\/live_\d+_\d+)_\w+/;

export default function enhanceLive() {
  let forceHighestQuality = true;

  if (location.href.startsWith('https://live.bilibili.com/')) {
    let recentErrors = 0;
    setInterval(() => (recentErrors > 0 ? recentErrors / 2 : null), 10000);

    (($fetch) => {
      unsafeWindow.fetch = function (requestInfo: RequestInfo | URL, requestInit?: RequestInit): Promise<Response> {
        let url = getUrlFromRequest(requestInfo);
        if (url == null) {
          return Reflect.apply($fetch, this, [requestInfo, requestInit]);
        }

        try {
          // if (mcdnRegexp.test(url) && disableMcdn) {
          //   return Promise.reject();
          // }
          if (qualityRegexp.test(url) && forceHighestQuality) {
            url = url
              .replace(qualityRegexp, '$1')
              .replaceAll(/(\d+)_(?:mini|pro)hevc/g, '$1');
          }
          return Reflect.apply($fetch, this, [url, requestInit]).then(response => {
            if (response.url.endsWith('.m3u8') || response.url.endsWith('.m4s')) {
              if (!response.ok) recentErrors++;
              if (recentErrors >= 5 && forceHighestQuality) {
                recentErrors = 0;
                forceHighestQuality = false;
                GM.notification(
                  '[Make Bilibili Great Then Ever Before] 已为您自动切换至播放器上选择的清晰度.',
                  '最高清晰度可能不可用'
                );
              }
            }
            return response;
          });
        } catch {
          return Reflect.apply($fetch, this, [requestInfo, requestInit]);
        }
      };
      // eslint-disable-next-line @typescript-eslint/unbound-method -- called with Reflect.apply
    })(unsafeWindow.fetch);

    // 还得帮叔叔修 bug，唉
    addStyle('div[data-cy=EvaRenderer_LayerWrapper]:has(.player) { z-index: 999999; }');

    // 去台标
    addStyle('.web-player-icon-roomStatus { display: none !important; }');
  }
}
