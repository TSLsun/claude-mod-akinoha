declare module 'claude-code' {
  interface PluginState {
    akinoha: { percent: number | null; notified: number }
  }
}
export type PileLevel = 0 | 1 | 2 | 3 | 4 | 5
