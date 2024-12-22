// 去除叔叔去世时的全站黑白效果
export default function removeBlackBackdropFilter() {
  const head = document.head || document.getElementsByTagName('head')[0] || document.body;
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = 'html, body { -webkit-filter: none !important; filter: none !important; }';
  head.appendChild(style);
  return style;
}
