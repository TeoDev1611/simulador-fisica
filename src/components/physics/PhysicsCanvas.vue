<script setup>
// src/components/physics/PhysicsCanvas.vue
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  scale: { type: Number, default: 40 },
  vectorScale: { type: Number, default: 6 },
  selectedId: { type: String, default: null },
  activeTool: { type: String, default: '' }
})

const emit = defineEmits(['canvas-down', 'canvas-move', 'canvas-up'])

const canvasRef = ref(null)
let ctx = null
let resizeObserver = null

let currentWidth = 800
let currentHeight = 480

const originX = () => currentWidth / 2
const originY = () => currentHeight * 0.82

function worldToScreen(x, y) {
  return { sx: originX() + x * props.scale, sy: originY() - y * props.scale }
}

function screenToWorld(cx, cy) {
  const rect = canvasRef.value.getBoundingClientRect()
  const sx = cx - rect.left
  const sy = cy - rect.top
  return { x: (sx - originX()) / props.scale, y: (originY() - sy) / props.scale }
}

function handlePointerDown(e) { emit('canvas-down', screenToWorld(e.clientX, e.clientY)) }
function handlePointerMove(e) { emit('canvas-move', screenToWorld(e.clientX, e.clientY)) }
function handlePointerUp(e) { emit('canvas-up', screenToWorld(e.clientX, e.clientY)) }

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')

  resizeObserver = new ResizeObserver(entries => {
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
  const step = props.scale
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let gx = originX() % step; gx < currentWidth; gx += step) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, currentHeight); ctx.stroke()
  }
  for (let gy = originY() % step; gy < currentHeight; gy += step) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(currentWidth, gy); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath(); ctx.moveTo(0, originY()); ctx.lineTo(currentWidth, originY()); ctx.stroke()
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
  ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

/** Terreno como polilínea libre (ya no un segmento recto con ángulo fijo). */
function drawGround(entry) {
  if (!entry.points || entry.points.length < 2) return
  ctx.save()
  ctx.strokeStyle = entry.color || '#9ca3af'
  ctx.lineWidth = 5
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

  ctx.strokeStyle = 'rgba(156,163,175,0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < entry.points.length - 1; i++) {
    const a = worldToScreen(entry.points[i].x, entry.points[i].y)
    const b = worldToScreen(entry.points[i + 1].x, entry.points[i + 1].y)
    const steps = Math.max(1, Math.floor(Math.hypot(b.sx - a.sx, b.sy - a.sy) / 12))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const x = a.sx + (b.sx - a.sx) * t
      const y = a.sy + (b.sy - a.sy) * t
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 10); ctx.stroke()
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
  ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fillStyle = '#78350f'; ctx.fill()

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
    ctx.roundRect(-wPx / 2 - 7, -hPx / 2 - 7, wPx + 14, hPx + 14, 6)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = entry.color || '#34d399'
  ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(0,0,0,0.6)'
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.beginPath(); ctx.rect(-wPx / 2, -hPx / 2, wPx, hPx); ctx.fill(); ctx.stroke()

  ctx.rotate(entry.angleRad)
  ctx.fillStyle = 'rgba(10,10,10,0.85)'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${entry.mass} kg`, 0, 0)
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
  ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.stroke()

  const marks = [
    { deg: 0, label: '0°' }, { deg: 90, label: '90°' },
    { deg: 180, label: '180°' }, { deg: 270, label: '270°' }
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
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke()
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
          const sag = Math.sqrt(Math.abs(restLenPx**2 - actualDistPx**2)) * 0.6
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
          const y = (i % 2 === 0) ? 0 : (i % 4 === 1 ? zzHeight : -zzHeight)
          if (i === zigzags) ctx.lineTo(x, 0)
          else ctx.lineTo(x, y)
      }
      ctx.stroke()

  } else if (rope.kind === 'pulley') {
      const ga = worldToScreen(rope.groundAnchorA.x, rope.groundAnchorA.y)
      const gb = worldToScreen(rope.groundAnchorB.x, rope.groundAnchorB.y)
      const radius = 12

      ctx.strokeStyle = '#52525b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(ga.sx, ga.sy - 25); ctx.lineTo(ga.sx, ga.sy)
      ctx.moveTo(gb.sx, gb.sy - 25); ctx.lineTo(gb.sx, gb.sy)
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
      ctx.beginPath(); ctx.arc(ga.sx, ga.sy, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(gb.sx, gb.sy, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke()

      ctx.fillStyle = '#d4d4d8'
      ctx.beginPath(); ctx.arc(ga.sx, ga.sy, 3, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(gb.sx, gb.sy, 3, 0, Math.PI*2); ctx.fill()
  }
  ctx.restore()
}

/** Previsualización mientras se dibuja el terreno a mano libre. */
function drawGroundPreview(points) {
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
}

function draw(bodies, ropes, previewLine, groundPreviewPoints) {
  if (!ctx) return
  drawEmpty()

  const bodiesById = new Map(bodies.map(b => [b.id, b]))
  for (const r of ropes) drawRopeLogic(r, bodiesById)

  if (previewLine) {
      const p1 = worldToScreen(previewLine.x1, previewLine.y1)
      const p2 = worldToScreen(previewLine.x2, previewLine.y2)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(p1.sx, p1.sy)
      ctx.lineTo(p2.sx, p2.sy)
      ctx.stroke()
      ctx.restore()
  }

  drawGroundPreview(groundPreviewPoints)

  for (const entry of bodies) if (entry.kind === 'ground') drawGround(entry)
  for (const entry of bodies) if (entry.kind === 'anchor') drawAnchor(entry)
  if (props.activeTool === 'force') {
    const target = bodies.find(b => b.id === props.selectedId)
    if (target) drawForceAngleGuide(target)
  }
  for (const entry of bodies) if (entry.kind === 'box') drawBox(entry)

  for (const entry of bodies) {
    if (entry.kind === 'box') {
      drawWeightVector(entry)
      drawAppliedForceVector(entry)
    }
  }
}

defineExpose({ draw })
</script>

<template>
  <canvas
    ref="canvasRef"
    class="block bg-gray-950 cursor-crosshair touch-none rounded-xl"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
  ></canvas>
</template>