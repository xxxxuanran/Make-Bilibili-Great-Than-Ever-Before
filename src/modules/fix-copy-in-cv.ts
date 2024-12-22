import { noop } from 'foxts/noop';

// 修复文章复制
declare global {
  interface Window {
    original?: {
      reprint: string
    }
  }
}

export default function fixCopyInCV() {
  if (location.href.startsWith('https://www.bilibili.com/read/cv')) {
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

    document.querySelector('.article-holder')?.classList.remove('unable-reprint');
    document.querySelector('.article-holder')?.addEventListener('copy', e => e.stopImmediatePropagation(), true);
  }
}
