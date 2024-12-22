export interface MakeBilibiliGreatThanEverBeforeModule {
  any?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onWww?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onVideo?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onLive?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onCV?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onStory?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void,
  onBangumi?: (hook: MakeBilibiliGreatThanEverBeforeHook) => void
}

export interface MakeBilibiliGreatThanEverBeforeHook {
  addStyle(this: void, css: string): void
};
