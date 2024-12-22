export interface MakeBilibiliGreatThanEverBeforeModule {
  any?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onVideo?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onLive?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onCV?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void
}

export interface MakeBilibiliGreatThanEverBeforeHook {
  addStyle(css: string): void
};
