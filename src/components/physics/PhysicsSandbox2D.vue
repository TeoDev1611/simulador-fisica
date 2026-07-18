<script setup>
// src/components/physics/PhysicsSandbox2D.vue
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlanckWorld } from '../../composables/usePlanckWorld.js'
import PhysicsCanvas from './PhysicsCanvas.vue'
import ToolRail from './ToolRail.vue'
import ContextPanel from './ContextPanel.vue'
import PhysicsDataPanel from './PhysicsDataPanel.vue'

const GRAVITY = 9.81
const {
  bodies,
  ropes,
  addBox,
  updateBoxMass,
  updateBoxFriction,
  updateBoxAngle,
  updateBoxDimensions,
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
const activeTool = ref('drag')

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

const isRecording = ref(false)
let mediaRecorder = null
let recordedChunks = []

function toggleRecording() {
  if (isRecording.value) {
    mediaRecorder?.stop()
    isRecording.value = false
  } else {
    const stream = canvasRef.value?.$el?.captureStream(60)
    if (!stream) return
    recordedChunks = []
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'newton_lab_recording.webm'
      a.click()
      URL.revokeObjectURL(url)
    }
    mediaRecorder.start()
    isRecording.value = true
  }
}
// La explicación detallada (objetivo, ventajas) ahora vive en la página de
// bienvenida (HomePage.vue), así que aquí ya no se abre sola al entrar.
// "Ayuda" solo muestra una referencia rápida de herramientas.
const showWelcomeModal = ref(false)

const boxEntries = computed(() => bodies.filter((b) => b.kind === 'box'))

const BOX_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#2dd4bf']
let colorIdx = 0
function nextColor() {
  return BOX_COLORS[colorIdx++ % BOX_COLORS.length]
}

const groundFriction = ref(0.5)
const groundMode = ref('free') // 'free' | 'straight'
const groundAngleDeg = ref(0) // solo se usa en modo 'straight'
const springFreq = ref(2.0)
const springDamping = ref(0.1)

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
    containerRef.value?.requestFullscreen().catch((err) => console.error(err))
  } else {
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
      width: 1,
      height: 1,
      mass: 2,
      friction: 0.3,
      color: nextColor(),
      label: `Caja ${boxEntries.value.length + 1}`
    })
    selectedBoxId.value = id
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
  } else if (['rope', 'spring', 'pulley'].includes(activeTool.value)) {
    if (bodyId) {
      jointStartBodyId = bodyId
      const b = bodies.find((bx) => bx.id === bodyId)
      previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
    }
  } else if (activeTool.value === 'circular') {
    // El riel circular solo puede arrancar desde una caja (es la que quedará
    // ensartada en el aro); el otro extremo del arrastre será su centro.
    const b = bodies.find((bx) => bx.id === bodyId && bx.kind === 'box')
    if (b) {
      jointStartBodyId = bodyId
      previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
    }
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
    // Polea en 2 pasos, para que sea UNA sola rueda real y no dos puntos
    // separados: el primer cable define/reutiliza la rueda (un anclaje); el
    // segundo cable debe soltarse sobre ESA MISMA rueda para cerrar la polea.
    const endId = queryPoint(x, y, { includeStatic: true })
    const endEntry = endId ? bodies.find((b) => b.id === endId) : null

    if (pendingPulley.value && endId === pendingPulley.value.wheelId) {
      addPulley(pendingPulley.value.idA, jointStartBodyId, pendingPulley.value.wheelId)
      pendingPulley.value = null
      saveHistoryState()
    } else {
      const wheelId = endEntry && endEntry.kind === 'anchor' ? endId : addAnchor(x, y)
      pendingPulley.value = { idA: jointStartBodyId, wheelId }
    }
    jointStartBodyId = null
    previewLine.value = null
  } else if (jointStartBodyId) {
    let endBodyId = queryPoint(x, y)
    if (!endBodyId) {
      endBodyId = addAnchor(x, y)
    }
    if (endBodyId && endBodyId !== jointStartBodyId) {
      if (activeTool.value === 'rope') addRope(jointStartBodyId, endBodyId)
      else if (activeTool.value === 'circular') addCircularTrack(jointStartBodyId, endBodyId)
      else if (activeTool.value === 'spring')
        addSpring(jointStartBodyId, endBodyId, { frequencyHz: springFreq.value, dampingRatio: springDamping.value })
      
      saveHistoryState()
    }
    jointStartBodyId = null
    previewLine.value = null
  }
}

let rafId = null
const FIXED_DT = 1 / 60

function loop() {
  try {
    if (isRunning.value) step(FIXED_DT)
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
  } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '9') {
    activeTool.value = 'delete'
  } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

onMounted(() => {
  buildInitialScene()
  saveHistoryState()
  rafId = requestAnimationFrame(loop)
  window.addEventListener('keydown', handleGlobalKeyDown)
})
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<template>
  <div class="flex flex-col flex-1">
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col">
      <div
        ref="containerRef"
        class="relative select-none flex-1 min-h-[560px] bg-gray-50 dark:bg-gray-950 border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] shadow-[0_0_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300"
      >
        <PhysicsCanvas
          ref="canvasRef"
          class="absolute inset-0 w-full h-full"
          :scale="40"
          :vector-scale="6"
          :selected-id="selectedBoxId"
          :active-tool="activeTool"
          @canvas-down="handleCanvasDown"
          @canvas-move="handleCanvasMove"
          @canvas-up="handleCanvasUp"
        />

        <div
          class="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-between p-3 gap-2 flex-wrap z-20"
        >
          <span
            class="pointer-events-auto text-[10px] font-mono bg-white/90 dark:bg-gray-950/90 backdrop-blur px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400"
          >
            Herramienta:
            <span class="text-emerald-700 dark:text-emerald-300 font-bold">{{ activeTool.toUpperCase() }}</span>
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
          <div class="pointer-events-auto flex items-center gap-2">
            <!-- BOTONES DE DESHACER / REHACER -->
            <button
              type="button"
              @click="undo"
              :disabled="historyIndex <= 0"
              class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border shadow-lg transition-colors duration-150 flex items-center gap-1 disabled:opacity-50"
              :class="'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
              title="Deshacer (Ctrl+Z)"
            >
              ↩️
            </button>
            <button
              type="button"
              @click="redo"
              :disabled="historyIndex >= history.length - 1"
              class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border shadow-lg transition-colors duration-150 flex items-center gap-1 disabled:opacity-50"
              :class="'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'"
              title="Rehacer (Ctrl+Y)"
            >
              ↪️
            </button>

            <!-- BOTONES DE ARCHIVO -->
            <button
              type="button"
              @click="exportSceneFile"
              class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-colors flex items-center gap-1"
              title="Exportar Escena"
            >
              💾 <span class="hidden md:inline">Exportar</span>
            </button>
            <button
              type="button"
              @click="importSceneFile"
              class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transition-colors flex items-center gap-1"
              title="Cargar Escena"
            >
              📂 <span class="hidden md:inline">Importar</span>
            </button>

            <button
              type="button"
              @click="toggleRecording"
              class="text-[11px] font-semibold px-2 py-1.5 rounded-lg border shadow-lg transition-colors flex items-center gap-1"
              :class="isRecording ? 'bg-red-500/90 border-red-700 text-white animate-pulse' : 'bg-red-100/90 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-200/90 dark:hover:bg-red-800/50'"
              title="Grabar Video WebM"
            >
              {{ isRecording ? '⏹ Detener' : '🔴 Grabar' }}
            </button>

            <button
              type="button"
              @click="showWelcomeModal = true"
              class="text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-350/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-300/80 dark:bg-blue-900/80 shadow-lg transition-colors duration-150"
            >
              ℹ️ Ayuda
            </button>
            <button
              type="button"
              @click="handleToggleRun"
              class="text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg border shadow-lg transition-colors duration-150"
              :class="
                isRunning
                  ? 'bg-yellow-300/90 dark:bg-yellow-700/90 border-yellow-200 dark:border-yellow-600 text-yellow-100 hover:bg-yellow-300 dark:bg-yellow-700'
                  : 'bg-emerald-300/90 dark:bg-emerald-700/90 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white hover:bg-emerald-200 dark:bg-emerald-600'
              "
            >
              {{ isRunning ? '⏸ Pausar' : '▶ Reproducir' }}
            </button>
            <button
              type="button"
              @click="handleReset"
              class="text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-350/80 dark:bg-red-950/80 text-red-700 dark:text-red-300 hover:bg-red-300/80 dark:bg-red-900/80 shadow-lg transition-colors duration-150"
            >
              ⟲ Reiniciar
            </button>
            <button
              @click="toggleFullscreen"
              class="text-[10px] bg-gray-200/90 dark:bg-gray-800/90 hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg flex items-center gap-1 transition-colors"
              title="Alternar Pantalla Completa"
            >
              ⛶
            </button>
          </div>
        </div>

        <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-20">
          <ToolRail :active-tool="activeTool" @select-tool="(tool) => (activeTool = tool)" />
        </div>

        <div class="pointer-events-none absolute right-3 top-16 z-20">
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
            :pending-pulley="!!pendingPulley"
            :ropes-count="ropes.length"
            @update-box-mass="updateBoxMass"
            @update-box-friction="updateBoxFriction"
            @update-box-angle="updateBoxAngle"
            @update-box-dimensions="updateBoxDimensions"
            @update-ground-friction="handleUpdateGroundFriction"
            @update-selected-ground-friction="handleUpdateSelectedGroundFriction"
            @update-ground-mode="handleUpdateGroundMode"
            @update-ground-angle="handleUpdateGroundAngle"
            @update-spring-preset="handleSpringPreset"
            @update-spring-stiffness="handleSpringDamping"
            @update-force="handleUpdateForce"
            @apply-impulse="handleApplyImpulse"
          />
        </div>

        <div class="pointer-events-none absolute bottom-3 left-3 z-20">
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
                  <span class="text-3xl">🧲</span>
                  <div>
                    <h2 class="text-xl font-bold text-blue-700 dark:text-blue-400">Newton Lab</h2>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Referencia rápida de herramientas</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 dark:text-gray-300">
                  <div class="flex gap-3">
                    <span class="text-lg">✋</span>
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Mover / Seleccionar:</strong> Arrastra cajas
                      libremente, o haz clic en una para ver/editar su masa en el panel derecho.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-lg">✏️</span>
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Dibujar Suelo:</strong> Modo Libre (a mano) o
                      Recto (ángulo exacto, ideal para planos inclinados de un problema).
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-lg">〰️</span>
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Cuerdas y Resortes:</strong> Arrastra desde una
                      caja hasta otra (o hacia el vacío para crear un anclaje fijo).
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-lg">⭕</span>
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Riel circular:</strong> Arrastra desde una caja
                      hasta el centro deseado — queda ensartada girando a radio fijo, como un collar en un aro.
                    </p>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-lg">➤</span>
                    <p>
                      <strong class="text-gray-900 dark:text-gray-100">Fuerzas:</strong> Selecciona una caja y aplica
                      fuerzas continuas o impulsos únicos configurando el vector resultante.
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
      </div>
    </main>
  </div>
</template>
