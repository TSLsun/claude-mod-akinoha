declare module 'claude-code' {
  interface PluginState {
    akinoha: { percent: number | null; level: number }
  }
}
export type PileLevel = 0 | 1 | 2 | 3 | 4 | 5
