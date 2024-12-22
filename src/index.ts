import noWebRTC from './modules/no-webtrc';
import removeBlackBackdropFilter from './modules/remove-black-backdrop-filter';
import removeUselessUrlParams from './modules/remove-useless-url-params';

(() => {
  noWebRTC();
  removeBlackBackdropFilter();
  removeUselessUrlParams();
})();
