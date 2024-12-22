import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';

// 去除叔叔去世时的全站黑白效果
export default function removeBlackBackdropFilter(): MakeBilibiliGreatThanEverBeforeModule {
  return {
    onWww({ addStyle }) {
      addStyle('html, body { -webkit-filter: none !important; filter: none !important; }');
    }
  };
}
