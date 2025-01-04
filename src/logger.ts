/* eslint-disable no-restricted-globals -- logger */
/* eslint-disable no-console -- logger */
export const logger = {
  log: console.log.bind(console, '[make-bilibili-great-than-ever-before]'),
  error: console.error.bind(console, '[make-bilibili-great-than-ever-before]'),
  warn: console.warn.bind(console, '[make-bilibili-great-than-ever-before]'),
  info: console.info.bind(console, '[make-bilibili-great-than-ever-before]'),
  debug: console.debug.bind(console, '[make-bilibili-great-than-ever-before]'),
  trace: console.trace.bind(console, '[make-bilibili-great-than-ever-before]')
};
