// 秋葉 backdrop: washi ground, an ink branch in the top corner, a few ginkgo
// leaves drifting down the side gutters, and a pile of fallen leaves in both
// bottom corners whose height follows the context fill (level 0 to 5).

const LEAF =
  'M0 0L-1 -6C-9 -8 -13 -15 -10 -20C-6 -23 -2 -20 0 -22C2 -20 6 -23 10 -20C13 -15 9 -8 1 -6Z'
const GOLDS = ['#e2ad3c', '#d99a2b', '#efc458', '#c9862a', '#b8652c', '#e8b84a']

// How many leaves lie in each corner, and how tall the mound stands, per level.
const COUNT = [6, 12, 22, 34, 50, 72]
const HEIGHT = [16, 32, 56, 86, 124, 170]

function rand(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pile(level: number, seed: number): string {
  const r = rand(seed)
  const n = COUNT[level] ?? 0
  const top = HEIGHT[level] ?? 0
  const W = 360
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const x = Math.pow(r(), 1.4) * W
    const ceiling = top * (1 - Math.pow(x / W, 1.6))
    const y = 220 - r() * ceiling - 4
    const a = Math.round(r() * 360)
    const s = (0.8 + r() * 0.6).toFixed(2)
    const c = GOLDS[Math.floor(r() * GOLDS.length)]
    out.push(
      `<path d="${LEAF}" fill="${c}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a}) scale(${s})"/>`,
    )
  }
  return out.join('')
}

export function makeScene(level: number): string {
  const lv = Math.max(0, Math.min(5, level))
  const leftPile = pile(lv, 7)
  const rightPile = pile(lv, 31)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.ground { fill: #f4ede0; }
.ink { stroke: #4a3f33; }
.leaves { opacity: 0.78; }
.pile { opacity: 0.72; }
.fall { opacity: 0.6; }
@media (prefers-color-scheme: dark) {
  .ground { fill: #1d1914; }
  .ink { stroke: #8a7a64; }
  .leaves { opacity: 0.55; }
  .pile { opacity: 0.5; }
  .fall { opacity: 0.42; }
}
.f1 { animation: drop1 26s linear infinite; }
.f2 { animation: drop2 32s linear infinite; animation-delay: -11s; }
.f3 { animation: drop1 38s linear infinite; animation-delay: -23s; }
@keyframes drop1 {
  0% { transform: translate(0px, -60px) rotate(0deg); }
  25% { transform: translate(28px, 220px) rotate(70deg); }
  50% { transform: translate(-10px, 500px) rotate(150deg); }
  75% { transform: translate(24px, 780px) rotate(230deg); }
  100% { transform: translate(0px, 1080px) rotate(320deg); }
}
@keyframes drop2 {
  0% { transform: translate(0px, -60px) rotate(20deg); }
  30% { transform: translate(-30px, 280px) rotate(-60deg); }
  60% { transform: translate(14px, 620px) rotate(-150deg); }
  100% { transform: translate(-20px, 1080px) rotate(-260deg); }
}
</style>
<rect class="ground" x="0" y="0" width="1600" height="1000"/>
<!-- branch in the top right corner -->
<svg x="0" y="0" width="1600" height="230" viewBox="0 0 420 260" preserveAspectRatio="xMaxYMin meet">
  <path class="ink" d="M430 18C360 30 300 52 236 96C206 117 182 138 160 166" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path class="ink" d="M300 52C292 78 296 100 306 120" fill="none" stroke-width="1.5" stroke-linecap="round"/>
  <path class="ink" d="M236 96C226 104 212 108 196 108" fill="none" stroke-width="1.2" stroke-linecap="round"/>
  <g class="leaves">
    <path d="${LEAF}" fill="#e2ad3c" transform="translate(306 120) rotate(170) scale(1.3)"/>
    <path d="${LEAF}" fill="#efc458" transform="translate(196 108) rotate(-110) scale(1.15)"/>
    <path d="${LEAF}" fill="#d99a2b" transform="translate(160 166) rotate(200) scale(1.25)"/>
    <path d="${LEAF}" fill="#e8b84a" transform="translate(262 78) rotate(150) scale(1.05)"/>
    <path d="${LEAF}" fill="#c9862a" transform="translate(360 36) rotate(185) scale(1.1)"/>
  </g>
</svg>
<!-- leaves drifting down the side gutters -->
<g class="fall">
  <g transform="translate(70 0) scale(1.5)"><path class="f1" d="${LEAF}" fill="#e2ad3c" transform="translate(0 120)"/></g>
  <g transform="translate(1520 0) scale(1.4)"><path class="f2" d="${LEAF}" fill="#efc458" transform="translate(0 300)"/></g>
  <g transform="translate(1440 0) scale(1.3)"><path class="f3" d="${LEAF}" fill="#c9862a" transform="translate(0 640)"/></g>
</g>
<!-- the pile, left and right corners -->
<svg x="0" y="0" width="1600" height="1000" viewBox="0 0 1200 620" preserveAspectRatio="xMinYMax meet">
  <g class="pile" transform="translate(0 400)">${leftPile}</g>
</svg>
<svg x="0" y="0" width="1600" height="1000" viewBox="0 0 1200 620" preserveAspectRatio="xMaxYMax meet">
  <g class="pile" transform="translate(1200 400) scale(-1 1)">${rightPile}</g>
</svg>
</svg>`
}
