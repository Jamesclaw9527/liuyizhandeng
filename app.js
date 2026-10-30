const V = document.getElementById('player')
const titleCard = document.getElementById('titleCard')
const choiceCard = document.getElementById('choiceCard')
const endCard = document.getElementById('endCard')
const chrome = document.getElementById('chrome')
const bar = document.getElementById('bar')
const fill = document.getElementById('fill')
const timeEl = document.getElementById('time')
const chapterEl = document.getElementById('chapter')
const btnSpeed = document.getElementById('btnSpeed')
const btnMute = document.getElementById('btnMute')
const btnSkip = document.getElementById('btnSkip')
const endTag = document.getElementById('endTag')
const endTitle = document.getElementById('endTitle')
const endLine = document.getElementById('endLine')

const SRC = { open: 'assets/open.mp4', a: 'assets/a.mp4', b: 'assets/b.mp4' }
const LABEL = { open: '开场', a: '分支 A · 把灯留着', b: '分支 B · 关灯出去' }
const SPEEDS = [1, 1.25, 1.5, 0.75]
let speedIdx = 0
let state = 'title'          // title | open | choosing | branch | end
let current = null

// 预载分支，避免点选后等待
const preload = ['a', 'b'].map(k => {
  const v = document.createElement('video')
  v.src = SRC[k]; v.preload = 'auto'; v.muted = true
  return v
})

function fmt(s) {
  if (!isFinite(s)) return '00:00'
  const m = Math.floor(s / 60), x = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}

function show(el) { el.classList.add('show') }
function hide(el) { el.classList.remove('show') }
function hideAllVeils() { [titleCard, choiceCard, endCard].forEach(hide) }

function play(key) {
  current = key
  V.src = SRC[key]
  V.playbackRate = SPEEDS[speedIdx]
  V.muted = muted
  V.play().catch(() => { V.muted = true; V.play().catch(() => {}) })
  chapterEl.textContent = LABEL[key]
  state = key === 'open' ? 'open' : 'branch'
}

function toChoice() {
  if (state === 'choosing') return
  state = 'choosing'
  V.pause()
  show(choiceCard)
  chapterEl.textContent = '选择'
}

document.getElementById('btnStart').addEventListener('click', () => {
  hide(titleCard)
  play('open')
})

V.addEventListener('timeupdate', () => {
  const d = V.duration || 0
  fill.style.width = d ? `${(V.currentTime / d) * 100}%` : '0%'
  timeEl.textContent = `${fmt(V.currentTime)} / ${fmt(d)}`
  if (state === 'open' && d && V.currentTime >= d - 0.35) toChoice()
})

V.addEventListener('ended', () => {
  if (state === 'open') toChoice()
  else if (state === 'branch') showEnd()
})

document.querySelectorAll('.opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const br = btn.dataset.branch
    hideAllVeils()
    play(br)
  })
})

function showEnd() {
  state = 'end'
  const isA = current === 'a'
  endTag.textContent = isA ? 'ENDING A' : 'ENDING B'
  endTitle.textContent = isA ? '灯亮了一整夜' : '灯又亮了'
  endLine.innerHTML = isA
    ? '她没有关灯。<br>那盏灯留到天亮，信读完了，老人朝店里轻轻点了下头。'
    : '她关了灯，走出去。<br>后来灯又亮了——这一次，是让两个人坐着把信读完。'
  show(endCard)
  V.pause()
}

document.getElementById('btnAgain').addEventListener('click', () => {
  hideAllVeils()
  V.currentTime = 0
  toChoice()
})
document.getElementById('btnReplay').addEventListener('click', () => {
  hideAllVeils()
  play(current)
})

// 控制条
btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length
  V.playbackRate = SPEEDS[speedIdx]
  btnSpeed.textContent = SPEEDS[speedIdx].toFixed(2).replace(/0$/, '') + '×'
})
let muted = false
btnMute.addEventListener('click', () => {
  muted = !muted
  V.muted = muted
  btnMute.textContent = muted ? '🔇' : '🔊'
})
btnSkip.addEventListener('click', () => {
  if (state === 'title') return
  toChoice()
})

// 播放中自动隐藏控件
let idle
function bumpIdle() {
  chrome.classList.remove('hide'); bar.classList.remove('hide')
  clearTimeout(idle)
  idle = setTimeout(() => {
    if (state === 'open' || state === 'branch') {
      chrome.classList.add('hide'); bar.classList.add('hide')
    }
  }, 3200)
}
document.addEventListener('mousemove', bumpIdle)
document.addEventListener('touchstart', bumpIdle)
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault()
    if (state === 'open' || state === 'branch') {
      V.paused ? V.play() : V.pause()
    }
  }
  if (state === 'choosing' && (e.key === '1' || e.key === 'a')) document.querySelector('.opt[data-branch="a"]').click()
  if (state === 'choosing' && (e.key === '2' || e.key === 'b')) document.querySelector('.opt[data-branch="b"]').click()
  if (state === 'end' && e.key.toLowerCase() === 'r') document.getElementById('btnReplay').click()
})
bumpIdle()