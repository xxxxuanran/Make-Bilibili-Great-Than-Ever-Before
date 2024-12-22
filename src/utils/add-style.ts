export function addStyle(css: string) {
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = css;
  head.appendChild(style);
  return style;
}
