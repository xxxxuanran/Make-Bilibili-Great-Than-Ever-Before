import { noop } from 'foxts/noop';
import type { MakeBilibiliGreatThanEverBeforeModule } from '../types';

// 修复文章复制
declare global {
  interface Window {
    original?: {
      reprint: string
    }
  }
}

const fixCopyInCV: MakeBilibiliGreatThanEverBeforeModule = {
  onCV() {
    if (unsafeWindow.original) {
      Object.defineProperty(unsafeWindow.original, 'reprint', {
        get() {
          return '1';
        },
        set: noop,
        configurable: false,
        enumerable: true
      });
    }

    const holder = document.querySelector('.article-holder');
    if (holder) {
      holder.classList.remove('unable-reprint');
      holder.addEventListener('copy', e => e.stopImmediatePropagation(), true);
    }
  }
};

export default fixCopyInCV;
