import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { makeScene } from './scene'

const percentAtom = atom({ plugin: 'akinoha', key: 'percent' } as const, null)
// The pile's level alone: the backdrop reads only this, so it redraws (and its
// leaves restart) only when the level changes, never on every response.
const levelAtom = atom({ plugin: 'akinoha', key: 'level' } as const, 0)

// Washi paper by day, a warm sumi room by lamplight at night.
const { theme, problems } = makeColors({
  label: '秋葉 Akinoha',
  roles: { accent: '#b8782a', danger: '#b2452f', success: '#5f7d3c', warning: '#b8862b', pro: '#7a5a86' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f1e9da',
        'surface-1': '#f6f0e4',
        'surface-2': '#fbf7ef',
        'text-primary': '#2b241c',
        'text-secondary': '#54493b',
        'text-muted': '#6b5f4f',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1d1914',
        'surface-1': '#25201a',
        'surface-2': '#2d2720',
        'surface-3': '#352e25',
        'text-primary': '#f1e8d8',
        'text-secondary': '#cfc3ae',
        'text-muted': '#aa9d88',
      },
    },
  },
})

const inputs = (theme as { inputs?: { light?: Record<string, string>; dark?: Record<string, string> } }).inputs
if (inputs?.light && inputs?.dark) {
  inputs.light['bg-user-message'] = '#f3e2bd'
  inputs.light['text-user-message'] = '#2b241c'
  inputs.dark['bg-user-message'] = '#3a2f20'
  inputs.dark['text-user-message'] = '#f1e8d8'
}

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'niwa', glass: { blur: 14, opacity: 0.55 } },
}

const LOOK: ThemeSetArgs = {
  ...BASE,
  style: {
    Text: { fontFamily: ['serif'], fontSize: 15, lineHeight: 26 },
    Heading: { fontFamily: ['serif'], fontWeight: 'semibold', letterSpacing: 1 },
    UserMessage: { backgroundColor: 'bg-user-message', radius: 14, paddingX: 16, paddingY: 10 },
    AssistantMessage: { backgroundColor: 'surface-2', radius: 14, paddingX: 18, paddingY: 12 },
    ToolUse: { backgroundColor: 'surface-1', radius: 8, paddingX: 8 },
  },
}

// Level of the leaf pile: 0 (bare) to 5 (the garden is buried).
function levelOf(pct: number | null): number {
  if (pct === null) return 0
  if (pct >= 90) return 5
  if (pct >= 75) return 4
  if (pct >= 60) return 3
  if (pct >= 40) return 2
  if (pct >= 20) return 1
  return 0
}

const WORDS = [
  '初秋 · 枝頭金黃',
  '落葉輕舞',
  '落葉漸積',
  '落葉成堆 · 可以準備整理了',
  '落葉厚厚一層 · 建議 /compact',
  '落葉滿庭 · 請盡快 /compact 或開新對話',
]

const TOASTS: Record<number, string> = {
  3: '🍂 落葉已成堆：context 用了六成，可以準備整理了',
  4: '🍂 落葉厚厚一層：context 超過 75%，建議執行 /compact',
  5: '🍁 落葉滿庭：context 超過 90%，請盡快 /compact 或開新對話',
}

function bar(pct: number): string {
  const filled = Math.round(pct / 10)
  return '▰'.repeat(filled) + '▱'.repeat(10 - filled)
}

async function record($: EngineInterface, pct: number | null): Promise<void> {
  await update($, percentAtom, () => pct)
  $.ui.status(pct === null ? undefined : `🍂 ${pct}%`)

  const level = levelOf(pct)
  const previous = await read($, levelAtom)
  if (level > previous && level >= 3) {
    const text = TOASTS[level]
    if (text) $.ui.toast(text)
  }
  if (level !== previous) await update($, levelAtom, () => level)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.log(unpainted)

    try {
      await $.theme.set(LOOK)
    } catch (error) {
      $.ui.log(String(error))
      await $.theme.set(BASE)
    }

    const { context } = await $.session.usage()
    await record($, context.percent ?? null)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      await record($, e.context.percent ?? null)
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== 'akinoha' || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const level = await read($, levelAtom)

    return (
      <Svg
        source={makeScene(level)}
        alt={`秋日庭院，地上的金黃落葉堆積程度 ${level}/5`}
      />
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const pct = await read($, percentAtom)
    if (e.props.hasSurvey) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    if (pct === null) {
      return (
        <Box>
          <Text dimColor>🍂 初秋 · 枝頭金黃，幾片葉子剛落下</Text>
        </Box>
      )
    }
    const level = levelOf(pct)
    const color = level >= 5 ? 'error' : level >= 3 ? 'warning' : undefined

    return (
      <Box>
        <Text color={color} dimColor={level < 3} weight={level >= 4 ? 'semibold' : undefined}>
          🍂 {bar(pct)} {pct}% · {WORDS[level]}
        </Text>
      </Box>
    )
  })
}
