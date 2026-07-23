<script setup>
// src/components/physics/PhysicsSandbox2D.vue
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlanckWorld } from '../../composables/usePlanckWorld.js'
import PhysicsCanvas from './PhysicsCanvas.vue'
import ToolRail from './ToolRail.vue'
import ContextPanel from './ContextPanel.vue'
import PhysicsDataPanel from './PhysicsDataPanel.vue'
import ShapeEditorModal from './ShapeEditorModal.vue'
import {
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  CircleDot,
  Square,
  Info,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  MousePointer2,
  Box,
  Ruler,
  Link,
  Spline,
  Disc,
  CircleDashed,
  ArrowUpToLine,
  Trash2,
  Magnet,
  BarChart2,
  Library
} from 'lucide-vue-next'

const GRAVITY = 9.81
const {
  bodies,
  ropes,
  addBox,
  updateBoxMass,
  updateBoxFriction,
  updateBoxAngle,
  updateBoxVelocity,
  updateBoxDimensions,
  updateTrackRadius,
  setAppliedForce,
  applyImpulse,
  addGround,
  setGroundFriction,
  getGroundIds,
  addAnchor,
  moveAnchor,
  addRope,
  addSpring,
  setSpringStiffness,
  addPulley,
  addCircularTrack,
  removeBody,
  reset,
  step,
  queryPoint,
  startMouseDrag,
  updateMouseDrag,
  stopMouseDrag,
  exportState,
  importState
} = usePlanckWorld(GRAVITY)

const canvasRef = ref(null)
const containerRef = ref(null)
const isRunning = ref(true)
const showDataPanel = ref(false)
const activeTool = ref('drag')
const toolLabels = {
  drag: 'SELECCIONAR OBJETO',
  pan: 'MOVER CÁMARA',
  box: 'CREAR CAJA',
  ground: 'DIBUJAR SUELO',
  rope: 'CUERDA',
  spring: 'RESORTE',
  pulley: 'POLEA',
  circular: 'RIEL CIRCULAR',
  force: 'FUERZA / IMPULSO',
  anchor: 'FIJADOR / ANCLAJE',
  delete: 'BORRAR'
}

const history = ref([])
const historyIndex = ref(-1)

function saveHistoryState() {
  const json = exportState()
  if (historyIndex.value < history.value.length - 1) {
    history.value.splice(historyIndex.value + 1)
  }
  history.value.push(json)
  if (history.value.length > 50) history.value.shift()
  historyIndex.value = history.value.length - 1
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    importState(history.value[historyIndex.value])
    colorIdx = bodies.length // approximate
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    importState(history.value[historyIndex.value])
  }
}

function exportSceneFile() {
  const json = exportState()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'escena_newton.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importSceneFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (importState(ev.target.result)) {
        saveHistoryState()
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
// La explicación detallada (objetivo, ventajas) ahora vive en la página de
// bienvenida (HomePage.vue), así que aquí ya no se abre sola al entrar.
// "Ayuda" solo muestra una referencia rápida de herramientas.
const showWelcomeModal = ref(false)
const showShapeEditorModal = ref(false)

function handleApplyShapeToSelected({ id, width, height, shape, vertices }) {
  updateBoxDimensions(id, width, height, shape, vertices)
  saveHistoryState()
}

function handleApplyShapeToDefault({ shape, vertices, width, height }) {
  nextBoxShape.value = shape
  nextBoxVertices.value = vertices
  if (width) nextBoxWidth.value = width
  if (height) nextBoxHeight.value = height
}

const boxEntries = computed(() => bodies.filter((b) => b.kind === 'box'))

const BOX_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#2dd4bf']
let colorIdx = 0
function nextColor() {
  return BOX_COLORS[colorIdx++ % BOX_COLORS.length]
}

const groundFriction = ref(0.3)
const groundMode = ref('free')
const groundAngleDeg = ref(0)
const canvasScale = ref(40)

function zoomIn() {
  const newScale = canvasScale.value * 1.2
  if (newScale <= 5000) canvasScale.value = newScale
}

function zoomOut() {
  const newScale = canvasScale.value / 1.2
  if (newScale >= 10) canvasScale.value = newScale
}
const springFreq = ref(2.0)
const springDamping = ref(0.1)

// UX: Propiedades del próximo objeto a crear
const nextBoxShape = ref('box')
const nextBoxVertices = ref(null)
const nextBoxMass = ref(2.0)
const nextBoxWidth = ref(1.0)
const nextBoxHeight = ref(1.0)
const nextBoxFriction = ref(0.3)
const nextBoxVx = ref(0)
const nextBoxVy = ref(0)

const selectedBoxId = ref(null)
const selectedBox = computed(() => boxEntries.value.find((b) => b.id === selectedBoxId.value) || null)

// Suelo seleccionado con la herramienta "Mover/Seleccionar" (para editar su
// fricción individual, ahora que puede haber varios trozos de suelo).
const selectedGroundId = ref(null)
const selectedGround = computed(
  () => bodies.find((b) => b.id === selectedGroundId.value && b.kind === 'ground') || null
)

// Estado de "polea en 2 pasos": el primer cable define dónde queda la rueda
// (un anclaje); el segundo cable debe soltarse sobre esa misma rueda para
// que ambos cables compartan un único punto de giro, como una polea real.
const pendingPulley = ref(null) // { idA, wheelId } | null

const groundLiveInfo = computed(() => {
  const pts = groundDrawPoints.value
  if (!pts || pts.length < 2) return null
  const a = pts[0]
  const b = pts[pts.length - 1]
  const dx = b.x - a.x
  const dy = b.y - a.y
  return { angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI, length: Math.hypot(dx, dy) }
})

function buildInitialScene() {
  addGround(
    [
      { x: -14, y: -2 },
      { x: 14, y: -2 }
    ],
    groundFriction.value
  )
  addBox({ x: -3, y: 2, width: 1, height: 1, mass: 2, friction: 0.3, color: nextColor(), label: 'Caja 1' })
  addBox({ x: 0, y: 4, width: 1, height: 1, mass: 1.5, friction: 0.3, color: nextColor(), label: 'Caja 2' })
}

// Si el usuario abandona la herramienta "polea" a medio camino (dejó
// pendiente un primer cable), se descarta para no dejar estado fantasma.
// Lo mismo si suelta la herramienta "Mover" en medio de un arrastre.
watch(activeTool, (tool) => {
  if (tool !== 'pulley') pendingPulley.value = null
  if (tool !== 'drag') {
    if (isDragging) {
      stopMouseDrag()
      isDragging = false
    }
    isDraggingAnchor = false
    draggedAnchorId = null
  }
})

watch(
  () => bodies.map((b) => b.id),
  (newIds) => {
    if (selectedBoxId.value && !newIds.includes(selectedBoxId.value)) {
      selectedBoxId.value = null
    }
    if (selectedGroundId.value && !newIds.includes(selectedGroundId.value)) {
      selectedGroundId.value = null
    }
  }
)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    containerRef.value
      ?.requestFullscreen()
      .then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {
            // Ignorar error si el dispositivo no soporta bloqueo de orientación
          })
        }
      })
      .catch((err) => console.error(err))
  } else {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock()
    }
    document.exitFullscreen()
  }
}

function handleToggleRun() {
  isRunning.value = !isRunning.value
}
function handleReset() {
  reset()
  colorIdx = 0
  selectedBoxId.value = null
  selectedGroundId.value = null
  pendingPulley.value = null
  buildInitialScene()
  history.value = []
  historyIndex.value = -1
  saveHistoryState()
}

// Fricción del PRÓXIMO suelo que se dibuje (mientras la herramienta activa
// es "ground"). Cuando hay un suelo ya seleccionado con "drag", en vez se
// llama a handleUpdateSelectedGroundFriction (ver abajo).
function handleUpdateGroundFriction(v) {
  groundFriction.value = v
}
function handleUpdateSelectedGroundFriction(v) {
  if (!selectedGroundId.value) return
  setGroundFriction(selectedGroundId.value, v)
}
function handleUpdateGroundMode(mode) {
  groundMode.value = mode
}
function handleUpdateGroundAngle(deg) {
  groundAngleDeg.value = deg
}

function handleSpringPreset(freq) {
  springFreq.value = freq
  for (const r of ropes) if (r.kind === 'spring') setSpringStiffness(r.id, springFreq.value, springDamping.value)
}
function handleSpringDamping(damping) {
  springDamping.value = damping
  for (const r of ropes) if (r.kind === 'spring') setSpringStiffness(r.id, springFreq.value, springDamping.value)
}

function handleUpdateForce({ magnitude, angleDeg, enabled }) {
  if (!selectedBoxId.value) return
  setAppliedForce(selectedBoxId.value, { enabled, magnitude, angleDeg })
}
function handleApplyImpulse({ magnitude, angleDeg }) {
  if (!selectedBoxId.value) return
  applyImpulse(selectedBoxId.value, magnitude, angleDeg)
}

let isDragging = false
let isDraggingAnchor = false
let draggedAnchorId = null
let jointStartBodyId = null
const previewLine = ref(null)

let forceDragBodyId = null
let forceDragOrigin = null

const groundDrawPoints = ref(null)

function distSq(a, b) {
  const dx = a.x - b.x,
    dy = a.y - b.y
  return dx * dx + dy * dy
}

function handleCanvasDown({ x, y }) {
  const bodyId = queryPoint(x, y)

  if (activeTool.value === 'drag') {
    if (bodyId) {
      selectedBoxId.value = bodyId
      selectedGroundId.value = null
      startMouseDrag(bodyId, x, y, !isRunning.value)
      isDragging = true
    } else {
      // No hay caja bajo el cursor: revisa si hay un anclaje (ej. la rueda
      // de una polea) para poder arrastrarlo con precisión, o un suelo para
      // editar su fricción.
      const staticId = queryPoint(x, y, { includeStatic: true })
      const entry = staticId ? bodies.find((b) => b.id === staticId) : null
      if (entry && entry.kind === 'anchor') {
        draggedAnchorId = staticId
        isDraggingAnchor = true
        selectedGroundId.value = null
        selectedBoxId.value = null
      } else {
        selectedGroundId.value = entry && entry.kind === 'ground' ? staticId : null
        selectedBoxId.value = null
      }
    }
  } else if (activeTool.value === 'box') {
    const id = addBox({
      x,
      y,
      width: nextBoxWidth.value,
      height: nextBoxHeight.value,
      mass: nextBoxMass.value,
      friction: nextBoxFriction.value,
      shape: nextBoxShape.value,
      vertices: nextBoxVertices.value,
      vx: nextBoxVx.value,
      vy: nextBoxVy.value,
      color: nextColor(),
      label: `Objeto ${boxEntries.value.length + 1}`
    })
    selectedBoxId.value = id
    saveHistoryState()
  } else if (activeTool.value === 'anchor') {
    const targetId = queryPoint(x, y, { includeStatic: false })
    const anchorId = addAnchor(x, y)
    if (targetId) {
      addRope(anchorId, targetId)
    }
    selectedBoxId.value = anchorId
    saveHistoryState()
  } else if (activeTool.value === 'delete') {
    // includeStatic: ahora "Borrar" también funciona sobre suelos y anclajes,
    // no solo sobre cajas — necesario para poder quitar un trozo de suelo
    // mal trazado cuando ya se pueden tener varios a la vez.
    const targetId = queryPoint(x, y, { includeStatic: true })
    if (targetId) {
      removeBody(targetId)
      if (selectedBoxId.value === targetId) selectedBoxId.value = null
      if (selectedGroundId.value === targetId) selectedGroundId.value = null
      saveHistoryState()
    }
  } else if (activeTool.value === 'ground') {
    groundDrawPoints.value = [{ x, y }]
  } else if (activeTool.value === 'force') {
    if (bodyId) {
      selectedBoxId.value = bodyId
      const b = bodies.find((bx) => bx.id === bodyId)
      if (b) {
        forceDragBodyId = bodyId
        forceDragOrigin = { x: b.position.x, y: b.position.y }
        previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
      }
    }
  } else if (['rope', 'spring', 'pulley', 'circular'].includes(activeTool.value)) {
    let targetId = queryPoint(x, y, { includeStatic: true, includeGround: false })

    // Permitir crear anclaje desde el vacío (pared) para cuerdas, resortes y rieles
    if (!targetId && ['rope', 'spring', 'circular'].includes(activeTool.value)) {
      targetId = addAnchor(x, y)
      saveHistoryState()
    }

    if (targetId) {
      jointStartBodyId = targetId
      const b = bodies.find((bx) => bx.id === targetId)
      if (b) {
        previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
      }
    }
  } else if (activeTool.value === 'circular') {
    // Obsoleto, integrado arriba
  }
}

function handleCanvasMove({ x, y }) {
  if (activeTool.value === 'drag' && isDragging) {
    updateMouseDrag(x, y, !isRunning.value)
  } else if (activeTool.value === 'drag' && isDraggingAnchor && draggedAnchorId) {
    moveAnchor(draggedAnchorId, x, y)
  } else if (activeTool.value === 'ground' && groundDrawPoints.value) {
    if (groundMode.value === 'straight') {
      // Modo recto: el segundo punto queda SIEMPRE sobre la recta que pasa
      // por el punto inicial con el ángulo elegido en el panel — así se
      // puede fijar, por ejemplo, una rampa a exactamente 30°, sin depender
      // del pulso del mouse. La longitud sí sigue libremente al arrastre.
      const start = groundDrawPoints.value[0]
      const rad = (groundAngleDeg.value * Math.PI) / 180
      const dirX = Math.cos(rad)
      const dirY = Math.sin(rad)
      const proj = (x - start.x) * dirX + (y - start.y) * dirY
      groundDrawPoints.value = [start, { x: start.x + proj * dirX, y: start.y + proj * dirY }]
    } else {
      const pts = groundDrawPoints.value
      const last = pts[pts.length - 1]
      if (distSq(last, { x, y }) > 0.15 * 0.15) pts.push({ x, y })
    }
  } else if (previewLine.value) {
    const hoverId = queryPoint(x, y, { includeStatic: true })
    if (hoverId && hoverId !== jointStartBodyId && activeTool.value !== 'force') {
      const entry = bodies.find((b) => b.id === hoverId)
      if (entry) {
        let center = { x: entry.position.x, y: entry.position.y }
        if (entry.kind === 'anchor') {
          center = { x: entry.position.x, y: entry.position.y }
        } else if (entry.body) {
          const wc = entry.body.getWorldCenter()
          center = { x: wc.x, y: wc.y }
        }
        previewLine.value.x2 = center.x
        previewLine.value.y2 = center.y
        previewLine.value.targetId = hoverId
        return
      }
    }
    previewLine.value.x2 = x
    previewLine.value.y2 = y
    previewLine.value.targetId = null
  }
}

function handleCanvasUp({ x, y }) {
  if (activeTool.value === 'drag' && isDragging) {
    stopMouseDrag()
    isDragging = false
    saveHistoryState()
  } else if (activeTool.value === 'drag' && isDraggingAnchor) {
    isDraggingAnchor = false
    draggedAnchorId = null
    saveHistoryState()
  } else if (activeTool.value === 'ground' && groundDrawPoints.value) {
    // AGREGA un trozo de suelo nuevo, sin borrar los que ya existían — así
    if (groundDrawPoints.value.length >= 2) {
      addGround(groundDrawPoints.value, groundFriction.value)
      saveHistoryState()
    }
    groundDrawPoints.value = null
  } else if (activeTool.value === 'force' && forceDragBodyId) {
    const dx = x - forceDragOrigin.x
    const dy = y - forceDragOrigin.y
    const magnitude = Math.hypot(dx, dy) * 8
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (magnitude > 0.3) {
      setAppliedForce(forceDragBodyId, { enabled: true, magnitude, angleDeg })
    }
    forceDragBodyId = null
    forceDragOrigin = null
    previewLine.value = null
  } else if (jointStartBodyId && activeTool.value === 'pulley') {
    // Polea en 1 solo paso intuitivo
    let endBodyId = queryPoint(x, y, { includeStatic: true })
    if (endBodyId && endBodyId !== jointStartBodyId) {
      const startEntry = bodies.find((b) => b.id === jointStartBodyId)
      const endEntry = bodies.find((b) => b.id === endBodyId)
      if (startEntry && endEntry) {
        const midX = (startEntry.position.x + endEntry.position.x) / 2
        const maxY = Math.max(startEntry.position.y, endEntry.position.y) + 5
        const wheelId = addAnchor(midX, maxY)
        addPulley(jointStartBodyId, endBodyId, wheelId)
        saveHistoryState()
      }
    }
    jointStartBodyId = null
    previewLine.value = null
  } else if (jointStartBodyId) {
    let endBodyId = queryPoint(x, y, { includeStatic: true })
    if (!endBodyId) {
      endBodyId = addAnchor(x, y)
    }
    if (endBodyId !== jointStartBodyId) {
      if (activeTool.value === 'rope') addRope(jointStartBodyId, endBodyId)
      if (activeTool.value === 'spring')
        addSpring(jointStartBodyId, endBodyId, { frequencyHz: springFreq.value, dampingRatio: springDamping.value })
      if (activeTool.value === 'circular') {
        const startEntry = bodies.find((b) => b.id === jointStartBodyId)
        const rTrack = startEntry ? Math.hypot(x - startEntry.position.x, y - startEntry.position.y) : 1
        const ringSize = Math.max(0.05, rTrack * 0.25)

        // Anillo en riel: creamos la masa de 1.5kg (anilla) automáticamente en el extremo soltado
        const newBoxId = addBox({
          x,
          y,
          width: ringSize,
          height: ringSize,
          mass: 1.5,
          shape: 'ring',
          color: '#f59e0b',
          label: `Anillo ${boxEntries.value.length + 1}`
        })
        addCircularTrack(newBoxId, jointStartBodyId)
      }
      saveHistoryState()
    }
    jointStartBodyId = null
    previewLine.value = null
  }
}

let rafId = null
const FIXED_DT = 1 / 60

// Telemetría 2D
const isRecordingTelemetry = ref(false)
let telemetryData = []
let telemetryTime = 0
let frameCounter = 0

function startTelemetry() {
  isRecordingTelemetry.value = true
  telemetryData = []
  telemetryTime = 0
  frameCounter = 0
  if (!isRunning.value) togglePlay()
}

function stopAndExportTelemetry() {
  isRecordingTelemetry.value = false
  if (telemetryData.length === 0) return

  let csv =
    'Tiempo (s),Caja,Posicion X (m),Posicion Y (m),Velocidad X (m/s),Velocidad Y (m/s),Aceleracion X (m/s2),Aceleracion Y (m/s2),Angulo (deg),Velocidad Ang (deg/s)\n'
  for (const row of telemetryData) {
    csv += `${row.t.toFixed(4)},${row.id},${row.px.toFixed(4)},${row.py.toFixed(4)},${row.vx.toFixed(4)},${row.vy.toFixed(4)},${row.ax.toFixed(4)},${row.ay.toFixed(4)},${row.aDeg.toFixed(4)},${row.vaDeg.toFixed(4)}\n`
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'telemetria_2d.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function recordTelemetrySample() {
  for (const entry of bodies) {
    if (entry.kind === 'box' && entry.body) {
      try {
        const p = entry.body.getPosition()
        const v = entry.body.getLinearVelocity()
        const aRad = entry.body.getAngle()
        const vaRad = entry.body.getAngularVelocity()

        telemetryData.push({
          t: telemetryTime,
          id: entry.label || entry.id,
          px: p.x || 0,
          py: p.y || 0,
          vx: v.x || 0,
          vy: v.y || 0,
          ax: entry.acceleration?.x || 0,
          ay: entry.acceleration?.y || 0,
          aDeg: ((aRad || 0) * 180) / Math.PI,
          vaDeg: ((vaRad || 0) * 180) / Math.PI
        })
      } catch (e) {}
    }
  }
}

function loop() {
  try {
    if (isRunning.value) {
      step(FIXED_DT)
      if (isRecordingTelemetry.value) {
        telemetryTime += FIXED_DT
        frameCounter++
        // Guardar 1 de cada 2 frames (~30 fps) para no hacer el CSV inmanejable
        if (frameCounter % 2 === 0) {
          recordTelemetrySample()
        }
      }
    }
    canvasRef.value?.draw(bodies, ropes, previewLine.value, groundDrawPoints.value, groundLiveInfo.value)
  } catch (err) {
    console.error('[Sandbox] Error crítico recuperado en el bucle principal', err)
  }
  rafId = requestAnimationFrame(loop)
}

function handleGlobalKeyDown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    handleToggleRun()
  } else if (e.key === '1' || e.key.toLowerCase() === 'v') {
    activeTool.value = 'drag'
  } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
    activeTool.value = 'box'
  } else if (e.key === '3' || e.key.toLowerCase() === 'g') {
    activeTool.value = 'ground'
  } else if (e.key === '4' || e.key.toLowerCase() === 'c') {
    activeTool.value = 'rope'
  } else if (e.key === '5' || e.key.toLowerCase() === 'r') {
    activeTool.value = 'spring'
  } else if (e.key === '6' || e.key.toLowerCase() === 'p') {
    activeTool.value = 'pulley'
  } else if (e.key === '7' || e.key.toLowerCase() === 't') {
    activeTool.value = 'track'
  } else if (e.key === '8' || e.key.toLowerCase() === 'f') {
    activeTool.value = 'force'
  } else if (e.key.toLowerCase() === 'h') {
    activeTool.value = 'pan'
  } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '9') {
    activeTool.value = 'delete'
  } else if (e.key === '+' || e.key === '=') {
    zoomIn()
  } else if (e.key === '-') {
    zoomOut()
  } else if (e.ctrlKey && e.key.toLowerCase() === 'r') {
    e.preventDefault()
    if (isRecordingTelemetry.value) stopAndExportTelemetry()
    else startTelemetry()
  } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

const isFullscreen = ref(false)
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  buildInitialScene()
  saveHistoryState()
  rafId = requestAnimationFrame(loop)
  window.addEventListener('keydown', handleGlobalKeyDown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', handleGlobalKeyDown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div class="flex flex-col flex-1">
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col">
      <div
        ref="containerRef"
        class="relative select-none flex-1 min-h-[320px] md:min-h-[560px] bg-gray-50 dark:bg-gray-950 border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] shadow-[0_0_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300"
      >
        <!-- Overlay para forzar fullscreen en móviles -->
        <div
          v-if="!isFullscreen"
          class="absolute inset-0 z-50 flex md:hidden items-center justify-center bg-gray-900/90 backdrop-blur-md p-6 text-center"
        >
          <div
            class="bg-white/10 dark:bg-gray-800/40 p-8 rounded-[2rem] border border-white/20 shadow-2xl max-w-xs backdrop-blur-xl"
          >
            <Maximize class="w-16 h-16 text-emerald-400 mx-auto mb-4 drop-shadow-md" />
            <h3 class="text-xl font-bold text-white mb-2 tracking-wide">Mejor en horizontal</h3>
            <p class="text-sm text-gray-200 mb-8 leading-relaxed">
              Newton Lab requiere espacio. Maximiza la pantalla para rotar tu dispositivo y usar el simulador
              cómodamente.
            </p>
            <button
              @click="toggleFullscreen"
              class="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-4 rounded-xl shadow-[0_5px_15px_rgba(16,185,129,0.4)] transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              <Maximize class="w-5 h-5" />
              Maximizar Ahora
            </button>
          </div>
        </div>

        <PhysicsCanvas
          ref="canvasRef"
          class="absolute inset-0 w-full h-full"
          :scale="canvasScale"
          :vector-scale="6"
          :selected-id="selectedBoxId"
          :active-tool="activeTool"
          @canvas-down="handleCanvasDown"
          @canvas-move="handleCanvasMove"
          @canvas-up="handleCanvasUp"
          @update-scale="(s) => (canvasScale = s)"
        />

        <div
          class="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-between p-3 gap-2 flex-wrap z-20"
        >
          <span
            class="pointer-events-auto text-[10px] font-mono bg-white/90 dark:bg-gray-950/90 backdrop-blur px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400"
          >
            Herramienta:
            <span class="text-emerald-700 dark:text-emerald-300 font-bold">{{
              toolLabels[activeTool] || activeTool.toUpperCase()
            }}</span>
            <template v-if="activeTool === 'ground' && groundLiveInfo">
              &nbsp;·&nbsp;θ =
              <span class="text-emerald-700 dark:text-emerald-300 font-bold"
                >{{ groundLiveInfo.angleDeg.toFixed(1) }}°</span
              >
              &nbsp;L =
              <span class="text-emerald-700 dark:text-emerald-300 font-bold"
                >{{ groundLiveInfo.length.toFixed(2) }} m</span
              >
            </template>
            <template v-if="activeTool === 'pulley' && pendingPulley">
              &nbsp;·&nbsp;<span class="text-yellow-700 dark:text-yellow-300 font-bold"
                >Rueda lista — arrastra la 2ª caja hasta el punto amarillo</span
              >
            </template>
          </span>
          <div class="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
            <!-- BOTONES DE DESHACER / REHACER / ZOOM -->
            <button
              type="button"
              @click="zoomOut"
              class="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-gray-700 dark:text-gray-300 p-2.5 rounded-[14px] shadow-md border border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Alejar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-zoom-out"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
                <line x1="8" x2="14" y1="11" y2="11" />
              </svg>
            </button>
            <button
              type="button"
              @click="zoomIn"
              class="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-gray-700 dark:text-gray-300 p-2.5 rounded-[14px] shadow-md border border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Acercar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-zoom-in"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
                <line x1="11" x2="11" y1="8" y2="14" />
                <line x1="8" x2="14" y1="11" y2="11" />
              </svg>
            </button>

            <button
              type="button"
              @click="undo"
              :disabled="historyIndex <= 0"
              class="w-8 h-8 rounded-lg border shadow-lg transition-colors duration-150 flex items-center justify-center disabled:opacity-50"
              :class="'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="redo"
              :disabled="historyIndex >= history.length - 1"
              class="w-8 h-8 rounded-lg border shadow-lg transition-colors duration-150 flex items-center justify-center disabled:opacity-50"
              :class="'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 class="w-4 h-4" />
            </button>

            <!-- BOTONES DE ARCHIVO -->
            <button
              type="button"
              @click="exportSceneFile"
              class="w-8 h-8 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-colors flex items-center justify-center"
              title="Exportar Escena"
            >
              <Download class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="importSceneFile"
              class="w-8 h-8 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-colors flex items-center justify-center"
              title="Cargar Escena"
            >
              <FolderOpen class="w-4 h-4" />
            </button>
            <a
              href="https://github.com/TeoDev1611/simulador-fisica/tree/main/ejemplos"
              target="_blank"
              class="w-8 h-8 rounded-lg border bg-emerald-500 hover:bg-emerald-400 border-emerald-600 text-white shadow-lg transition-colors flex items-center justify-center"
              title="Descargar Ejemplos"
            >
              <Library class="w-4 h-4" />
            </a>

            <!-- BOTONES DE GRABACIÓN DE DATOS -->
            <button
              v-if="!isRecordingTelemetry"
              type="button"
              @click="startTelemetry"
              class="w-8 h-8 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-lg transition-colors flex items-center justify-center"
              title="Grabar telemetría a Excel (CSV)"
            >
              <CircleDot class="w-4 h-4" />
            </button>
            <button
              v-else
              type="button"
              @click="stopAndExportTelemetry"
              class="w-8 h-8 rounded-lg border bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 shadow-lg transition-colors flex items-center justify-center animate-pulse"
              title="Detener y Exportar CSV"
            >
              <Square class="w-4 h-4" />
            </button>

            <!-- BOTÓN DATOS EN VIVO -->
            <button
              type="button"
              @click="showDataPanel = !showDataPanel"
              class="w-8 h-8 rounded-lg border shadow-lg transition-colors duration-150 flex items-center justify-center"
              :class="
                showDataPanel
                  ? 'bg-purple-200 dark:bg-purple-900/80 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-300'
                  : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              title="Alternar Panel de Datos"
            >
              <BarChart2 class="w-4 h-4" />
            </button>

            <button
              type="button"
              @click="showWelcomeModal = true"
              class="w-8 h-8 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-350/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-300/80 dark:bg-blue-900/80 shadow-lg transition-colors duration-150 flex items-center justify-center"
              title="Ayuda"
            >
              <Info class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="handleToggleRun"
              class="w-8 h-8 rounded-lg border shadow-lg transition-colors duration-150 flex items-center justify-center"
              :class="
                isRunning
                  ? 'bg-yellow-300/90 dark:bg-yellow-700/90 border-yellow-200 dark:border-yellow-600 text-yellow-100 hover:bg-yellow-300 dark:bg-yellow-700'
                  : 'bg-emerald-300/90 dark:bg-emerald-700/90 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white hover:bg-emerald-200 dark:bg-emerald-600'
              "
              :title="isRunning ? 'Pausar' : 'Reproducir'"
            >
              <Pause v-if="isRunning" class="w-4 h-4" />
              <Play v-else class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="handleReset"
              class="w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-350/80 dark:bg-red-950/80 text-red-700 dark:text-red-300 hover:bg-red-300/80 dark:bg-red-900/80 shadow-lg transition-colors duration-150 flex items-center justify-center"
              title="Reiniciar Escena"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
            <button
              @click="toggleFullscreen"
              class="w-8 h-8 bg-gray-200/90 dark:bg-gray-800/90 hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg flex items-center justify-center transition-colors"
              title="Alternar Pantalla Completa"
            >
              <Maximize class="w-4 h-4" />
            </button>
          </div>
        </div>
        <!-- ToolRail: Abajo al centro en móviles, izquierda centrada en escritorio -->
        <div
          class="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:left-3 md:translate-x-0 md:top-1/2 md:-translate-y-1/2 z-30"
        >
          <ToolRail :active-tool="activeTool" @select-tool="(tool) => (activeTool = tool)" />
        </div>

        <!-- ContextPanel: Flotante a la derecha, con altura máxima en móviles para no chocar con ToolRail -->
        <div
          class="pointer-events-none absolute right-3 top-28 md:top-16 bottom-20 md:bottom-auto z-20 flex flex-col items-end"
        >
          <ContextPanel
            :active-tool="activeTool"
            :ground-friction="groundFriction"
            :ground-mode="groundMode"
            :ground-angle-deg="groundAngleDeg"
            :ground-live-info="groundLiveInfo"
            :spring-freq="springFreq"
            :spring-damping="springDamping"
            :selected-box="selectedBox"
            :selected-ground="selectedGround"
            :ground-count="getGroundIds().length"
            :ropes="ropes"
            :pending-pulley="!!pendingPulley"
            :ropes-count="ropes.length"
            :next-box-shape="nextBoxShape"
            :next-box-vertices="nextBoxVertices"
            :next-box-mass="nextBoxMass"
            :next-box-width="nextBoxWidth"
            :next-box-height="nextBoxHeight"
            :next-box-friction="nextBoxFriction"
            :next-box-vx="nextBoxVx"
            :next-box-vy="nextBoxVy"
            @open-shape-editor="showShapeEditorModal = true"
            @update-next-box-shape="
              (s, v) => {
                nextBoxShape = s
                nextBoxVertices = v
              }
            "
            @update-next-box-config="
              (k, v) => {
                if (k === 'mass') nextBoxMass = v
                else if (k === 'width') nextBoxWidth = v
                else if (k === 'height') nextBoxHeight = v
                else if (k === 'friction') nextBoxFriction = v
                else if (k === 'vx') nextBoxVx = v
                else if (k === 'vy') nextBoxVy = v
              }
            "
            @update-box-mass="updateBoxMass"
            @update-box-friction="updateBoxFriction"
            @update-box-angle="updateBoxAngle"
            @update-box-velocity="updateBoxVelocity"
            @update-box-dimensions="updateBoxDimensions"
            @update-track-radius="updateTrackRadius"
            @update-force="handleUpdateForce"
            @update-ground-friction="handleUpdateGroundFriction"
            @update-selected-ground-friction="handleUpdateSelectedGroundFriction"
            @update-ground-mode="handleUpdateGroundMode"
            @update-ground-angle="handleUpdateGroundAngle"
            @update-spring-preset="handleSpringPreset"
            @update-spring-stiffness="handleSpringDamping"
            @apply-impulse="handleApplyImpulse"
            class="max-h-[calc(100vh-140px)] md:max-h-none overflow-y-auto custom-scrollbar"
          />
        </div>

        <!-- DataPanel: Oculto por defecto, mostrable con el botón de estadísticas -->
        <div
          class="pointer-events-none absolute bottom-3 left-[4.5rem] lg:left-20 z-20"
          :class="showDataPanel ? 'block' : 'hidden'"
        >
          <PhysicsDataPanel :boxes="boxEntries" :ropes="ropes" />
        </div>

        <Transition
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showWelcomeModal"
            class="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4"
          >
            <div
              class="bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-blue-200/60 dark:border-blue-800/60 rounded-[2rem] shadow-lg dark:shadow-2xl max-w-xl w-full p-8 relative overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-blue-300/20 dark:from-blue-900/20 to-transparent pointer-events-none"
              ></div>
              <div class="relative z-10">
                <div class="flex items-center gap-3 mb-5 border-b border-gray-300 dark:border-gray-800 pb-4">
                  <Magnet class="w-8 h-8 text-blue-600 dark:text-blue-400 drop-shadow-md" />
                  <div>
                    <h2 class="text-xl font-bold text-blue-700 dark:text-blue-400">Newton Lab</h2>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Referencia rápida de herramientas</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 dark:text-gray-300">
                  <div class="flex gap-3">
                    <MousePointer2
                      class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm"
                    />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Mover / Seleccionar:</strong> Arrastra cajas
                      libremente o selecciona una para ver su telemetría y ajustar sus propiedades en el panel derecho.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Box class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Crear Caja:</strong> Haz clic o arrastra para
                      instanciar bloques afectados por gravedad. Su tamaño y geometría son dinámicos.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Ruler class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Dibujar Suelo:</strong> Traza barreras de
                      colisión estáticas. Permite el modo libre o angular para planos inclinados.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Link class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Cuerda Inelástica:</strong> Arrastra de caja a
                      caja o hacia el fondo. Mantendrá una distancia constante aplicando tensión reactiva.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Spline class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Resorte Elástico:</strong> Evalúa la Ley de Hooke
                      con frecuencia (Hz) y amortiguamiento variables. Arrastra entre dos puntos.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Disc class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Polea Ideal:</strong> 1º Arrastra de Caja A a un
                      punto en el aire (ancla la rueda). 2º Lleva Caja B al pin para cerrar la cuerda.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <CircleDashed class="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Riel Circular:</strong> Restricción radial pura.
                      La caja seleccionada orbitará permanentemente en el círculo dibujado.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <ArrowUpToLine class="w-5 h-5 flex-shrink-0 text-orange-500 dark:text-orange-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Fuerzas:</strong> Selecciona un cuerpo objetivo
                      para inyectarle fuerza motriz continua o aplicar un impulso violento inmediato.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <Trash2 class="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400 drop-shadow-sm" />
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Borrador:</strong> Haz clic o arrastra cruzando
                      elementos (cajas, uniones) para sacarlos de la simulación.
                    </p>
                  </div>
                </div>

                <p class="mt-5 text-[11px] text-gray-600 dark:text-gray-500 leading-relaxed">
                  ¿Buscas el objetivo del laboratorio o sus ventajas? Puedes verlos en la pestaña
                  <span class="text-gray-600 dark:text-gray-400 font-semibold">Inicio</span> del menú superior.
                </p>

                <div class="mt-6 flex justify-end">
                  <button
                    @click="showWelcomeModal = false"
                    class="px-6 py-3 bg-gradient-to-r from-blue-300 dark:from-blue-700 to-blue-200 dark:to-blue-600 hover:from-blue-200 dark:from-blue-600 hover:to-blue-800 dark:to-blue-500 text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-[0_5px_15px_rgba(29,78,216,0.4)] transition-all duration-300 hover:scale-105"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Modal de Editor Multiforma -->
        <ShapeEditorModal
          :is-open="showShapeEditorModal"
          :selected-box="selectedBox"
          :current-shape="nextBoxShape"
          :current-vertices="nextBoxVertices"
          :current-width="nextBoxWidth"
          :current-height="nextBoxHeight"
          @close="showShapeEditorModal = false"
          @apply-to-selected="handleApplyShapeToSelected"
          @apply-to-default="handleApplyShapeToDefault"
        />
      </div>
    </main>
  </div>
</template>
