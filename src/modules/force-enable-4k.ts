import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';
import { defineReadonlyProperty } from '../utils/define-readonly-property';

function hook() {
  if (localStorage.getItem('bilibili_player_force_DolbyAtmos&8K&HDR') !== '1') {
    localStorage.setItem('bilibili_player_force_DolbyAtmos&8K&HDR', '1');
  }
  if (localStorage.getItem('bilibili_player_force_hdr') !== '1') {
    localStorage.setItem('bilibili_player_force_hdr', '1');
  }

  // Bilibili use User-Agent to determine if the 4K should be avaliable, we simply overrides UA
  defineReadonlyProperty(unsafeWindow.navigator, 'userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15');
}

const forceEnable4K: MakeBilibiliGreatThanEverBeforeModule = {
  name: 'force-enable-4k',
  description: '强制启用 4K 播放',
  onVideo: hook,
  onBangumi: hook,
  onLive: hook
};

export default forceEnable4K;
