<script setup>
// src/components/physics/PhysicsCanvas.vue
import { formatValue, getUnitLabel } from '../../utils/measurementUtils.js'

const props = defineProps({
  scale: { type: Number, default: 40 },
  vectorScale: { type: Number, default: 6 },
  selectedId: { type: String, default: null },
  activeTool: { type: String, default: '' },
  unitSystem: { type: String, default: 'metric' },
  canvasTheme: { type: String, default: 'colorful' },
  measurements: { type: Array, default: () => [] }
})

const emit = defineEmits(['canvas-down', 'canvas-move', 'canvas-up', 'update-scale'])

const canvasRef = ref(null)
let ctx = null
let resizeObserver = null

let currentWidth = 800
let currentHeight = 480

const cameraOffsetX = ref(0)
const cameraOffsetY = ref(0)
const isPanning = ref(false)
let lastPanX = 0
let lastPanY = 0

const originX = () => currentWidth / 2 + cameraOffsetX.value
const originY = () => currentHeight - props.scale * 2.5 + cameraOffsetY.value

function worldToScreen(x, y) {
  return { sx: originX() + x * props.scale, sy: originY() - y * props.scale }
}

function screenToWorld(cx, cy) {
  const rect = canvasRef.value.getBoundingClientRect()
  const sx = cx - rect.left
  const sy = cy - rect.top
  return { x: (sx - originX()) / props.scale, y: (originY() - sy) / props.scale }
}

function handlePointerDown(e) {
  if (props.activeTool === 'pan') {
    isPanning.value = true
    lastPanX = e.clientX
    lastPanY = e.clientY
    return
  }
  emit('canvas-down', screenToWorld(e.clientX, e.clientY))
}

function handlePointerMove(e) {
  if (props.activeTool === 'pan') {
    if (isPanning.value) {
      const dx = e.clientX - lastPanX
      const dy = e.clientY - lastPanY
      cameraOffsetX.value += dx
      cameraOffsetY.value += dy
      lastPanX = e.clientX
      lastPanY = e.clientY
    }
    return
  }
  emit('canvas-move', screenToWorld(e.clientX, e.clientY))
}

function handlePointerUp(e) {
  if (props.activeTool === 'pan') {
    isPanning.value = false
    return
  }
  emit('canvas-up', screenToWorld(e.clientX, e.clientY))
}

function handleWheel(e) {
  const delta = e.deltaY < 0 ? 1.1 : 0.9
  const newScale = props.scale * delta
  if (newScale >= 10 && newScale <= 5000) {
    const rect = canvasRef.value.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const wx = (cx - originX()) / props.scale
    const wy = (originY() - cy) / props.scale

    emit('update-scale', newScale)

    cameraOffsetX.value = cx - currentWidth / 2 - wx * newScale
    cameraOffsetY.value = cy - currentHeight + newScale * 2.5 + wy * newScale
  }
}

function preventDefaultTouch(e) {
  e.preventDefault()
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      currentWidth = entry.contentRect.width
      currentHeight = entry.contentRect.height
      canvasRef.value.width = currentWidth
      canvasRef.value.height = currentHeight
    }
  })
  resizeObserver.observe(canvasRef.value)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

function drawEmpty() {
  if (!ctx) return
  ctx.clearRect(0, 0, currentWidth, currentHeight)
  drawGrid()
}

function drawGrid() {
  const isLatex = props.canvasTheme === 'latex'
  const step = props.scale
  ctx.save()
  if (isLatex) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, currentWidth, currentHeight)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  }
  ctx.lineWidth = 1
  for (let gx = originX() % step; gx < currentWidth; gx += step) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, currentHeight)
    ctx.stroke()
  }
  for (let gy = originY() % step; gy < currentHeight; gy += step) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(currentWidth, gy)
    ctx.stroke()
  }
  ctx.strokeStyle = isLatex ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.moveTo(0, originY())
  ctx.lineTo(currentWidth, originY())
  ctx.stroke()
  ctx.restore()
}

function drawArrow(fromX, fromY, toX, toY, color, lineWidth = 3) {
  const headLen = 9
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Terreno como polilínea libre (ya no un segmento recto con ángulo fijo). */
function drawGround(entry) {
  if (!entry.points || entry.points.length < 2) return
  const isLatex = props.canvasTheme === 'latex'
  ctx.save()
  ctx.strokeStyle = isLatex ? '#000000' : (entry.color || '#9ca3af')
  ctx.lineWidth = isLatex ? 3 : 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const p0 = worldToScreen(entry.points[0].x, entry.points[0].y)
  ctx.moveTo(p0.sx, p0.sy)
  for (let i = 1; i < entry.points.length; i++) {
    const p = worldToScreen(entry.points[i].x, entry.points[i].y)
    ctx.lineTo(p.sx, p.sy)
  }
  ctx.stroke()

  ctx.strokeStyle = isLatex ? '#000000' : 'rgba(156,163,175,0.3)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < entry.points.length - 1; i++) {
    const a = worldToScreen(entry.points[i].x, entry.points[i].y)
    const b = worldToScreen(entry.points[i + 1].x, entry.points[i + 1].y)
    const steps = Math.max(1, Math.floor(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 10))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const x = a.sx + (b.sx - a.sx) * t
      const y = a.sy + (b.sy - a.sy) * t
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 7, y + 10)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** Anclaje fijo: un pequeño pin (para colgar cuerda/resorte/polea sin necesitar 2 cajas). */
function drawAnchor(entry) {
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  ctx.save()
  ctx.fillStyle = '#facc15'
  ctx.strokeStyle = '#78350f'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(sx, sy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(sx, sy, 2, 0, Math.PI * 2)
  ctx.fillStyle = '#78350f'
  ctx.fill()

  // Etiqueta "Fijo": deja explícito que este punto NO se mueve —
  // es la razón por la que una polea/cuerda/resorte funciona con 1 sola caja.
  ctx.fillStyle = '#fde68a'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('Fijo', sx, sy + 8)
  ctx.restore()
}

function drawBox(entry) {
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  const wPx = entry.width * props.scale
  const hPx = entry.height * props.scale
  const isSelected = entry.id === props.selectedId

  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(-entry.angleRad)

  // Anillo de selección: SIEMPRE visible cuando una caja es el objetivo de la
  // herramienta activa (fuerza/masa/impulso), para eliminar cualquier duda
  // sobre "a cuál caja le estoy aplicando esto".
  if (isSelected) {
    ctx.save()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    if (entry.shape === 'circle' || entry.shape === 'ring') {
      ctx.arc(0, 0, wPx / 2 + 7, 0, Math.PI * 2)
    } else if (entry.shape === 'polygon' && entry.vertices) {
      const vs = entry.vertices
      ctx.moveTo(vs[0].x * wPx, -vs[0].y * hPx)
      for (let i = 1; i < vs.length; i++) ctx.lineTo(vs[i].x * wPx, -vs[i].y * hPx)
      ctx.closePath()
      ctx.lineWidth = 14
      ctx.stroke()
      ctx.lineWidth = 3
    } else {
      ctx.roundRect(-wPx / 2 - 7, -hPx / 2 - 7, wPx + 14, hPx + 14, 6)
    }
    ctx.stroke()
    ctx.restore()
  }

  const isLatex = props.canvasTheme === 'latex'
  ctx.fillStyle = isLatex ? '#ffffff' : (entry.color || '#34d399')
  ctx.strokeStyle = isLatex ? '#000000' : (isSelected ? '#fbbf24' : 'rgba(0,0,0,0.6)')
  ctx.lineWidth = isLatex ? 2.5 : (isSelected ? 3 : 2)
  ctx.beginPath()
  if (entry.shape === 'circle') {
    ctx.arc(0, 0, wPx / 2, 0, Math.PI * 2)
    ctx.moveTo(0, 0)
    ctx.lineTo(wPx / 2, 0)
  } else if (entry.shape === 'ring') {
    ctx.arc(0, 0, wPx / 2, 0, Math.PI * 2)
    ctx.moveTo(wPx * 0.35, 0)
    ctx.arc(0, 0, wPx * 0.35, 0, Math.PI * 2, true)
  } else if (entry.shape === 'polygon' && entry.vertices) {
    const vs = entry.vertices
    ctx.moveTo(vs[0].x * wPx, -vs[0].y * hPx)
    for (let i = 1; i < vs.length; i++) {
      ctx.lineTo(vs[i].x * wPx, -vs[i].y * hPx)
    }
    ctx.closePath()
  } else {
    ctx.rect(-wPx / 2, -hPx / 2, wPx, hPx)
  }
  ctx.fill()
  ctx.stroke()

  ctx.rotate(entry.angleRad)
  const isLatexFont = props.canvasTheme === 'latex'
  ctx.fillStyle = isLatexFont ? '#000000' : 'rgba(10,10,10,0.85)'
  ctx.font = isLatexFont ? 'bold 12px serif' : 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const massVal = formatValue(entry.mass, 'mass', props.unitSystem, 1)
  const massLabel = getUnitLabel('mass', props.unitSystem)
  ctx.fillText(`${massVal} ${massLabel}`, 0, 0)
  ctx.restore()

  if (entry.hasRollers) drawRollers(entry)
  drawPeakMarkers(entry, props.unitSystem)
}

function drawRollers(entry) {
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  const hPx = entry.height * props.scale
  const wPx = entry.width * props.scale
  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(-entry.angleRad)
  ctx.fillStyle = '#64748b'
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1.5

  const r = 5
  const yOffset = hPx / 2 + r
  const xLeft = -wPx * 0.3
  const xRight = wPx * 0.3

  ctx.beginPath()
  ctx.arc(xLeft, yOffset, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(xRight, yOffset, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawPeakMarkers(entry, unitSystem) {
  if (entry.maxHeightReached === undefined || entry.maxHeightReached <= entry.position.y + 0.1) return
  const { sx, sy } = worldToScreen(entry.position.x, entry.maxHeightReached)
  const unitLabel = getUnitLabel('length', unitSystem)
  const val = formatValue(entry.maxHeightReached, 'length', unitSystem, 2)

  ctx.save()
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(sx - 35, sy)
  ctx.lineTo(sx + 35, sy)
  ctx.stroke()

  ctx.fillStyle = '#f59e0b'
  ctx.font = 'bold 9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`h_max = ${val} ${unitLabel}`, sx, sy - 6)
  ctx.restore()
}

function drawMeasurementLine(m, unitSystem) {
  if (!m || !m.p1 || !m.p2) return
  const isLatex = props.canvasTheme === 'latex'
  const p1 = worldToScreen(m.p1.x, m.p1.y)
  const p2 = worldToScreen(m.p2.x, m.p2.y)
  const dx = m.p2.x - m.p1.x
  const dy = m.p2.y - m.p1.y
  const distance = Math.hypot(dx, dy)
  const unitLabel = getUnitLabel('length', unitSystem)
  const distFormatted = formatValue(distance, 'length', unitSystem, 2)
  const dyFormatted = formatValue(Math.abs(dy), 'length', unitSystem, 2)

  ctx.save()
  const strokeColor = isLatex ? '#000000' : '#38bdf8'
  const textColor = isLatex ? '#000000' : '#7dd3fc'
  const cardBg = isLatex ? '#ffffff' : 'rgba(15, 23, 42, 0.85)'

  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2
  ctx.setLineDash([5, 3])

  ctx.beginPath()
  ctx.moveTo(p1.sx, p1.sy)
  ctx.lineTo(p2.sx, p2.sy)
  ctx.stroke()

  const angle = Math.atan2(p2.sy - p1.sy, p2.sx - p1.sx)
  drawArrowHead(p1.sx, p1.sy, angle + Math.PI, strokeColor)
  drawArrowHead(p2.sx, p2.sy, angle, strokeColor)

  const midX = (p1.sx + p2.sx) / 2
  const midY = (p1.sy + p2.sy) / 2
  const text = `d = ${distFormatted} ${unitLabel}` + (Math.abs(dy) > 0.05 ? ` | h = ${dyFormatted} ${unitLabel}` : '')

  ctx.font = isLatex ? 'bold 12px serif' : 'bold 11px monospace'
  const metrics = ctx.measureText(text)
  const tw = metrics.width + 14
  const th = 20

  ctx.fillStyle = cardBg
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.roundRect(midX - tw / 2, midY - th / 2, tw, th, 4)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, midX, midY)

  ctx.restore()
}

function drawArrowHead(x, y, angle, color) {
  const headLen = 7
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + headLen * Math.cos(angle - Math.PI / 6), y + headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x + headLen * Math.cos(angle + Math.PI / 6), y + headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Guía de ángulo (0°/90°/180°/270°) sobre la caja seleccionada mientras la
 *  herramienta de fuerza está activa — referencia visual para que arrastrar
 *  hacia una dirección sea legible en vez de "a ojo puro". */
function drawForceAngleGuide(entry) {
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  const R = 70
  ctx.save()
  ctx.strokeStyle = 'rgba(251,146,60,0.25)'
  ctx.setLineDash([2, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(sx, sy, R, 0, Math.PI * 2)
  ctx.stroke()

  const marks = [
    { deg: 0, label: '0°' },
    { deg: 90, label: '90°' },
    { deg: 180, label: '180°' },
    { deg: 270, label: '270°' }
  ]
  ctx.setLineDash([])
  ctx.font = '9px monospace'
  ctx.fillStyle = 'rgba(251,146,60,0.6)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const m of marks) {
    const rad = (m.deg * Math.PI) / 180
    const x = sx + R * Math.cos(rad)
    const y = sy - R * Math.sin(rad)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.fillText(m.label, x + 12 * Math.cos(rad), y - 12 * Math.sin(rad))
  }
  ctx.restore()
}

function drawWeightVector(entry) {
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  const lenPx = Math.min(entry.weightForce * props.vectorScale, 180)
  drawArrow(sx, sy, sx, sy + lenPx, '#ef4444', 3)
}

/** Vector de fuerza externa aplicada por el usuario, con su ángulo etiquetado en el lienzo. */
function drawAppliedForceVector(entry) {
  const f = entry.appliedForce
  if (!f || !f.enabled || !f.magnitude) return
  const { sx, sy } = worldToScreen(entry.position.x, entry.position.y)
  const rad = (f.angleDeg * Math.PI) / 180
  const lenPx = Math.min(f.magnitude * props.vectorScale, 200)
  const toX = sx + lenPx * Math.cos(rad)
  const toY = sy - lenPx * Math.sin(rad) // -sin: el canvas invierte el eje Y respecto al mundo físico

  drawArrow(sx, sy, toX, toY, '#fb923c', 3)

  ctx.save()
  ctx.fillStyle = '#fb923c'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${f.magnitude.toFixed(1)} N · ${f.angleDeg.toFixed(0)}°`, toX + 6, toY)
  ctx.restore()
}

function drawRopeLogic(rope, bodiesById) {
  const a = bodiesById.get(rope.bodyAId)
  const b = bodiesById.get(rope.bodyBId)
  if (!a || !b) return

  const pa = worldToScreen(a.position.x, a.position.y)
  const pb = worldToScreen(b.position.x, b.position.y)

  ctx.save()
  if (rope.kind === 'rope') {
    const actualDistPx = Math.hypot(pb.sx - pa.sx, pb.sy - pa.sy)
    const restLenPx = (rope.length || 0) * props.scale
    const isSlack = actualDistPx < restLenPx - 2

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(pa.sx, pa.sy)

    if (isSlack) {
      const sag = Math.sqrt(Math.abs(restLenPx ** 2 - actualDistPx ** 2)) * 0.6
      ctx.bezierCurveTo(pa.sx, pa.sy + sag, pb.sx, pb.sy + sag, pb.sx, pb.sy)
    } else {
      ctx.lineTo(pb.sx, pb.sy)
    }

    const t = rope.tension || 0
    if (t > 40) {
      ctx.strokeStyle = '#ef4444'
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 6
    } else {
      ctx.strokeStyle = '#a1a1aa'
    }
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 2
    ctx.shadowBlur = 0
    ctx.setLineDash([4, 4])
    ctx.stroke()
  } else if (rope.kind === 'spring') {
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.beginPath()
    const dx = pb.sx - pa.sx
    const dy = pb.sy - pa.sy
    const dist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)

    const zigzags = 16
    const zzWidth = dist / zigzags
    const zzHeight = 7

    ctx.translate(pa.sx, pa.sy)
    ctx.rotate(angle)
    ctx.moveTo(0, 0)
    for (let i = 1; i <= zigzags; i++) {
      const x = i * zzWidth
      const y = i % 2 === 0 ? 0 : i % 4 === 1 ? zzHeight : -zzHeight
      if (i === zigzags) ctx.lineTo(x, 0)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else if (rope.kind === 'track') {
    // rope.bodyAId = caja (collar), rope.bodyBId = centro (anclaje)
    const rPx = rope.radius * props.scale
    const t = rope.tension || 0

    // Aro guía completo: el "riel" físico por el que se desliza el collar.
    ctx.strokeStyle = 'rgba(34,211,238,0.35)'
    ctx.lineWidth = 3
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(pb.sx, pb.sy, rPx, 0, Math.PI * 2)
    ctx.stroke()

    // Varilla radial (centro → caja): visualiza la restricción rígida y
    // se colorea como una cuerda con tensión.
    ctx.strokeStyle = t > 40 ? '#ef4444' : '#22d3ee'
    ctx.lineWidth = 2.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(pb.sx, pb.sy)
    ctx.lineTo(pa.sx, pa.sy)
    ctx.stroke()
  } else if (rope.kind === 'pulley') {
    const ga = worldToScreen(rope.groundAnchorA.x, rope.groundAnchorA.y)
    const gb = worldToScreen(rope.groundAnchorB.x, rope.groundAnchorB.y)
    const radius = 12
    // Si viene de un wheelId (rueda única, físicamente correcto), ga y gb
    // son el mismo punto: se dibuja UNA sola rueda con soporte, en vez de
    // dos soportes separados con una barra arriba (el estilo "de respaldo").
    const sameWheel = Math.hypot(ga.sx - gb.sx, ga.sy - gb.sy) < 1.5

    if (sameWheel) {
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(ga.sx, ga.sy - 22)
      ctx.lineTo(ga.sx, ga.sy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ga.sx - 14, ga.sy - 22)
      ctx.lineTo(ga.sx + 14, ga.sy - 22)
      ctx.lineWidth = 6
      ctx.stroke()

      ctx.strokeStyle = '#a1a1aa'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pa.sx, pa.sy)
      ctx.lineTo(ga.sx - radius * 0.7, ga.sy - radius * 0.3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ga.sx + radius * 0.7, ga.sy - radius * 0.3)
      ctx.lineTo(pb.sx, pb.sy)
      ctx.stroke()

      ctx.fillStyle = '#27272a'
      ctx.strokeStyle = '#71717a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(ga.sx, ga.sy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#d4d4d8'
      ctx.beginPath()
      ctx.arc(ga.sx, ga.sy, 3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = '#52525b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(ga.sx, ga.sy - 25)
      ctx.lineTo(ga.sx, ga.sy)
      ctx.moveTo(gb.sx, gb.sy - 25)
      ctx.lineTo(gb.sx, gb.sy)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(ga.sx - 20, ga.sy - 25)
      ctx.lineTo(gb.sx + 20, gb.sy - 25)
      ctx.lineWidth = 8
      ctx.strokeStyle = '#3f3f46'
      ctx.stroke()

      ctx.strokeStyle = '#a1a1aa'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pa.sx, pa.sy)
      ctx.lineTo(ga.sx - radius + 2, ga.sy)
      ctx.lineTo(gb.sx + radius - 2, gb.sy)
      ctx.lineTo(pb.sx, pb.sy)
      ctx.stroke()

      ctx.fillStyle = '#27272a'
      ctx.strokeStyle = '#71717a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(ga.sx, ga.sy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(gb.sx, gb.sy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#d4d4d8'
      ctx.beginPath()
      ctx.arc(ga.sx, ga.sy, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(gb.sx, gb.sy, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Previsualización mientras se dibuja el terreno (libre o recto). */
function drawGroundPreview(points, groundInfo) {
  if (!points || points.length < 2) return
  ctx.save()
  ctx.strokeStyle = 'rgba(156,163,175,0.85)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  const p0 = worldToScreen(points[0].x, points[0].y)
  ctx.moveTo(p0.sx, p0.sy)
  for (let i = 1; i < points.length; i++) {
    const p = worldToScreen(points[i].x, points[i].y)
    ctx.lineTo(p.sx, p.sy)
  }
  ctx.stroke()
  ctx.restore()

  // Modo recto: etiqueta de ángulo/longitud junto a la línea guía, para leer
  // el valor exacto sin tener que mirar el panel lateral.
  if (groundInfo) {
    const pEnd = worldToScreen(points[points.length - 1].x, points[points.length - 1].y)
    ctx.save()
    ctx.fillStyle = '#e5e7eb'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${groundInfo.angleDeg.toFixed(1)}° · ${groundInfo.length.toFixed(2)} m`, pEnd.sx + 8, pEnd.sy - 4)
    ctx.restore()
  }
}

/** Previsualización del riel circular mientras se arrastra desde la caja
 *  hasta el punto que definirá el centro (radio = distancia actual). */
function drawCircularPreview(previewLine) {
  if (!previewLine) return
  const center = worldToScreen(previewLine.x2, previewLine.y2)
  const start = worldToScreen(previewLine.x1, previewLine.y1)
  const rPx = Math.hypot(center.sx - start.sx, center.sy - start.sy)
  ctx.save()
  ctx.strokeStyle = 'rgba(34,211,238,0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(center.sx, center.sy, rPx, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function draw(bodies, ropes, previewLine, groundPreviewPoints, groundInfo) {
  if (!ctx) return
  drawEmpty()

  const bodiesById = new Map(bodies.map((b) => [b.id, b]))
  for (const r of ropes) drawRopeLogic(r, bodiesById)

  if (previewLine) {
    const p1 = worldToScreen(previewLine.x1, previewLine.y1)
    const p2 = worldToScreen(previewLine.x2, previewLine.y2)
    ctx.save()
    if (previewLine.targetId) {
      ctx.strokeStyle = 'rgba(167,243,208,0.9)' // emerald-200
      ctx.shadowColor = 'rgba(52,211,153,0.6)'
      ctx.shadowBlur = 8
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    }
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p1.sx, p1.sy)
    ctx.lineTo(p2.sx, p2.sy)
    ctx.stroke()
    ctx.restore()

    if (props.activeTool === 'circular') drawCircularPreview(previewLine)
  }

  drawGroundPreview(groundPreviewPoints, groundInfo)

  for (const entry of bodies) if (entry.kind === 'ground') drawGround(entry)
  for (const entry of bodies) if (entry.kind === 'anchor') drawAnchor(entry)
  if (props.activeTool === 'force') {
    const target = bodies.find((b) => b.id === props.selectedId)
    if (target) drawForceAngleGuide(target)
  }
  for (const entry of bodies) if (entry.kind === 'box') drawBox(entry)

  for (const entry of bodies) {
    if (entry.kind === 'box') {
      drawWeightVector(entry)
      drawAppliedForceVector(entry)
    }
  }

  // Renderizar cotas de medición fijadas o activas
  if (props.measurements) {
    for (const m of props.measurements) {
      drawMeasurementLine(m, props.unitSystem)
    }
  }
}

function resetCamera() {
  cameraOffsetX.value = 0
  cameraOffsetY.value = 0
}

defineExpose({ draw, resetCamera })
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="[
      'block bg-gray-50 dark:bg-gray-950 touch-none rounded-xl',
      activeTool === 'pan'
        ? isPanning
          ? 'cursor-grabbing'
          : 'cursor-grab'
        : activeTool === 'drag'
          ? 'cursor-default'
          : 'cursor-crosshair'
    ]"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @wheel.prevent="handleWheel"
    @contextmenu.prevent
    @touchstart="preventDefaultTouch"
    @touchmove="preventDefaultTouch"
    @touchend="preventDefaultTouch"
    @touchcancel="preventDefaultTouch"
  ></canvas>
</template>
