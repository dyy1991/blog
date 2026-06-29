'use client'

import { useState, useEffect, useMemo } from 'react'

// ── 配置：修改 USERS[1] 为你的读书伙伴姓名 ──────────────────
const USERS = ['YYDeng', 'littlelittleZhu'] as const
type UserName = (typeof USERS)[number]

// ── Types ────────────────────────────────────────────────────
interface CheckIn {
  id: string
  user: string
  date: string
  minutes: number
  note: string
}

// ── Utilities ────────────────────────────────────────────────
function localDateStr(d?: Date): string {
  const t = d ?? new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getColor(minutes: number): string {
  if (minutes === 0) return 'rgba(30,42,56,0.9)'
  if (minutes < 30)  return 'rgba(0,255,136,0.18)'
  if (minutes < 60)  return 'rgba(0,255,136,0.42)'
  if (minutes < 90)  return 'rgba(0,255,136,0.70)'
  return 'var(--green)'
}

// ── Stats ────────────────────────────────────────────────────
function calcStats(checkIns: CheckIn[]) {
  const dateMap = new Map(checkIns.map(c => [c.date, c.minutes]))
  const totalMinutes = checkIns.reduce((s, c) => s + c.minutes, 0)

  // Most active month
  const monthMap = new Map<string, number>()
  for (const c of checkIns) {
    const k = c.date.slice(0, 7)
    monthMap.set(k, (monthMap.get(k) ?? 0) + c.minutes)
  }
  let bestMonth = '—', bestMonthMins = 0
  for (const [k, m] of monthMap) {
    if (m > bestMonthMins) {
      bestMonthMins = m
      const [y, mo] = k.split('-').map(Number)
      bestMonth = new Date(y, mo - 1).toLocaleString('en', { month: 'long' })
    }
  }

  // Most active day
  let bestDay = '—', bestDayMins = 0
  for (const c of checkIns) {
    if (c.minutes > bestDayMins) {
      bestDayMins = c.minutes
      bestDay = parseLocalDate(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Longest streak
  const sorted = [...dateMap.entries()]
    .filter(([, m]) => m > 0)
    .map(([d]) => d)
    .sort()
  let longestStreak = 0, streak = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      streak = 1
    } else {
      const diff =
        (parseLocalDate(sorted[i]).getTime() - parseLocalDate(sorted[i - 1]).getTime()) / 86400000
      streak = diff === 1 ? streak + 1 : 1
    }
    longestStreak = Math.max(longestStreak, streak)
  }

  // Current streak: count back from today
  let currentStreak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  for (;;) {
    const ds = localDateStr(cur)
    if ((dateMap.get(ds) ?? 0) > 0) { currentStreak++; cur.setDate(cur.getDate() - 1) }
    else break
  }

  return { totalMinutes, bestMonth, bestDay, longestStreak, currentStreak }
}

// ── Heatmap ──────────────────────────────────────────────────
const CELL = 11
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', '']

function buildWeeks(): Date[][] {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())
  const weeks: Date[][] = []
  const cur = new Date(start)
  while (cur <= today) {
    const w: Date[] = []
    for (let d = 0; d < 7; d++) { w.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    weeks.push(w)
  }
  return weeks
}

function Heatmap({ checkIns }: { checkIns: CheckIn[] }) {
  const weeks   = useMemo(() => buildWeeks(), [])
  const dateMap = useMemo(() => new Map(checkIns.map(c => [c.date, c.minutes])), [checkIns])
  const today   = localDateStr()

  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = weeks.map(week => {
      const first = week.find(d => d.getDate() === 1)
      return first ? first.toLocaleString('en', { month: 'short' })[0] : null
    })
    if (!labels[0]) labels[0] = weeks[0][0].toLocaleString('en', { month: 'short' })[0]
    return labels
  }, [weeks])

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
      {/* Month row */}
      <div style={{ display: 'flex', paddingLeft: 18, marginBottom: 4 }}>
        {weeks.map((_, wi) => (
          <div key={wi} style={{ width: CELL, fontSize: 9, color: 'var(--text-dim)', flexShrink: 0, userSelect: 'none' }}>
            {monthLabels[wi] ?? ''}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'flex' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 4, flexShrink: 0 }}>
          {DAY_LABELS.map((lbl, i) => (
            <div key={i} style={{ height: CELL, width: 12, fontSize: 9, color: 'var(--text-dim)', lineHeight: `${CELL}px`, userSelect: 'none' }}>
              {lbl}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', marginRight: 2 }}>
            {week.map((date, di) => {
              const ds     = localDateStr(date)
              const mins   = dateMap.get(ds) ?? 0
              const future = ds > today
              const isToday = ds === today
              return (
                <div key={di}
                  title={future ? '' : mins > 0 ? `${ds}  ${mins} 分钟` : ds}
                  style={{
                    width: 9, height: 9, marginBottom: 2, borderRadius: 2,
                    background: future ? 'transparent' : getColor(mins),
                    outline: isToday ? '1px solid var(--green)' : 'none',
                    flexShrink: 0,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── User Panel ───────────────────────────────────────────────
function UserPanel({ username, checkIns }: { username: string; checkIns: CheckIn[] }) {
  const s    = useMemo(() => calcStats(checkIns), [checkIns])
  const hrs  = Math.floor(s.totalMinutes / 60)
  const mins = s.totalMinutes % 60

  const stats = [
    { label: 'Most Active Month', value: s.bestMonth },
    { label: 'Most Active Day',   value: s.bestDay },
    { label: 'Longest Streak',    value: s.longestStreak ? `${s.longestStreak}d` : '—' },
    { label: 'Current Streak',    value: s.currentStreak ? `${s.currentStreak}d` : '—' },
  ]

  return (
    <div className="terminal-card p-5">
      <div className="mb-1">
        <div className="text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>
          <span style={{ color: 'var(--green)' }}>@</span>{username}
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>
          {hrs > 0 ? `${hrs}h ${mins}m` : `${s.totalMinutes}m`}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          阅读时长 · {checkIns.length} 次打卡
        </div>
      </div>

      <div className="mt-4 mb-2">
        <Heatmap checkIns={checkIns} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {stats.map(st => (
          <div key={st.label}>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{st.label}</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-bright)' }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Fewer</span>
        {[0, 15, 45, 75, 100].map(m => (
          <div key={m} style={{ width: 9, height: 9, borderRadius: 2, background: getColor(m), flexShrink: 0 }} />
        ))}
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>More</span>
      </div>
    </div>
  )
}

// ── Check-in Form ────────────────────────────────────────────
function CheckInForm({ onSuccess }: { onSuccess: () => void }) {
  const [user,    setUser]    = useState<UserName>(USERS[0])
  const [date,    setDate]    = useState(localDateStr())
  const [minutes, setMinutes] = useState(30)
  const [note,    setNote]    = useState('')
  const [status,  setStatus]  = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')

  const submit = async () => {
    if (minutes <= 0) return
    setStatus('busy')
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, date, minutes, note }),
      })
      if (res.ok) {
        setStatus('ok')
        onSuccess()
        setTimeout(() => setStatus('idle'), 2500)
      } else {
        setStatus('err')
      }
    } catch {
      setStatus('err')
    }
  }

  const input: React.CSSProperties = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: 4,
    padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div className="terminal-card p-5 mb-6">
      <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-bright)' }}>
        <span style={{ color: 'var(--green)' }}># </span>今日打卡
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>打卡人</label>
          <select style={input} value={user} onChange={e => setUser(e.target.value as UserName)}>
            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>日期</label>
          <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>时长（分钟）</label>
          <input type="number" min={1} max={600} style={{ ...input, width: 90 }}
            value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex-1" style={{ minWidth: 160 }}>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>备注（选填）</label>
          <input type="text" style={{ ...input, width: '100%' }}
            placeholder="今天读了什么…"
            value={note} onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button
          onClick={submit}
          disabled={status === 'busy' || minutes <= 0}
          style={{
            background: status === 'ok' ? 'rgba(0,255,136,0.15)' : 'rgba(0,255,136,0.08)',
            color: 'var(--green)', border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 4, padding: '6px 18px', fontSize: 13,
            fontFamily: 'inherit', cursor: status === 'busy' ? 'wait' : 'pointer',
            opacity: minutes <= 0 ? 0.4 : 1, whiteSpace: 'nowrap',
          }}
        >
          {status === 'busy' ? '提交中…' : status === 'ok' ? '✓ 已打卡！' : status === 'err' ? '❌ 失败' : '✓ 打卡'}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function CheckInWall() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [refresh, setRefresh]   = useState(0)

  useEffect(() => {
    fetch('/api/checkin')
      .then(r => r.json())
      .then((data: CheckIn[]) => setCheckIns(data))
  }, [refresh])

  const refetch = () => setRefresh(r => r + 1)

  const user0 = checkIns.filter(c => c.user === USERS[0])
  const user1 = checkIns.filter(c => c.user === USERS[1])

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/checkinWall</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>{'> '}</span>读书打卡墙
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          互相监督，每天记录阅读时长 · 打卡热力图
        </p>
      </div>

      <CheckInForm onSuccess={refetch} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UserPanel username={USERS[0]} checkIns={user0} />
        <UserPanel username={USERS[1]} checkIns={user1} />
      </div>
    </div>
  )
}
