'use client'

import { useEffect, useRef } from 'react'

/**
 * 首页两侧装饰动效(仅 ≥1280px 视口显示,见 globals.css 的 .sidefx):
 *  - 左侧:Matrix 风格代码雨(canvas)
 *  - 右侧:CI/CD 流水线动画 + 上浮的 commit hash
 * 纯装饰:pointer-events:none + aria-hidden,不参与交互与无障碍树。
 */

const RAIN_CHARS = '01{}[]<>/=+;:$#&%*!?~^|λΔ→'
const FONT_SIZE = 13

function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let cols = 0
    let drops: number[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      cols = Math.max(1, Math.floor(canvas.width / FONT_SIZE))
      drops = Array.from({ length: cols }, () =>
        Math.floor((Math.random() * canvas.height) / FONT_SIZE)
      )
    }

    const draw = () => {
      // 半透明底色扫过 → 形成拖尾
      ctx.fillStyle = 'rgba(8, 13, 20, 0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${FONT_SIZE}px monospace`
      for (let i = 0; i < cols; i++) {
        const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)]
        const head = Math.random() < 0.08
        ctx.fillStyle = head ? 'rgba(190,255,225,0.9)' : 'rgba(0,255,136,0.55)'
        ctx.fillText(ch, i * FONT_SIZE, drops[i] * FONT_SIZE)
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    let last = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (t - last < 66) return // ~15fps,视觉足够且省电
      last = t
      draw()
    }

    resize()
    if (reduced) {
      draw() // 只画一帧静态
    } else {
      raf = requestAnimationFrame(loop)
    }

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="sidefx-canvas" />
}

// 固定数据(而非随机):服务端与客户端渲染一致,避免水合不匹配
const PIPE_STAGES = ['git push', 'lint · tsc', 'docker build', 'deploy', 'online']

const FLOAT_HASHES = [
  { text: 'a3f9c21', left: 12, delay: 0,  duration: 14 },
  { text: '7b04e8d', left: 55, delay: 3,  duration: 18 },
  { text: 'f21ac90', left: 30, delay: 6,  duration: 15 },
  { text: '09d7b3e', left: 68, delay: 9,  duration: 20 },
  { text: 'c5e12af', left: 20, delay: 12, duration: 16 },
  { text: '3d8f04b', left: 48, delay: 16, duration: 19 },
]

function Pipeline() {
  return (
    <div className="pipe">
      <span className="pipe-track" />
      <span className="pipe-pulse" />
      {PIPE_STAGES.map((stage, i) => (
        <div key={stage} className="pipe-stage">
          <span className="pipe-dot" style={{ animationDelay: `${i * 0.8}s` }} />
          <span className="pipe-label">{stage}</span>
        </div>
      ))}
    </div>
  )
}

export default function SideFx() {
  return (
    <div aria-hidden="true">
      <div className="sidefx sidefx-left">
        <CodeRain />
      </div>
      <div className="sidefx sidefx-right">
        <Pipeline />
        {FLOAT_HASHES.map(h => (
          <span
            key={h.text}
            className="fx-hash"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.duration}s`,
            }}
          >
            {h.text}
          </span>
        ))}
      </div>
    </div>
  )
}
