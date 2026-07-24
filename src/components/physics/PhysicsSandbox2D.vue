<script setup>
// src/components/physics/PhysicsSandbox2D.vue
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePlanckWorld } from '../../composables/usePlanckWorld.js'
import { formatValue, getUnitLabel } from '../../utils/measurementUtils.js'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
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
  HelpCircle,
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
  Library,
  Github,
  ZoomIn,
  ZoomOut
} from 'lucide-vue-next'

const GRAVITY = 9.81
const {
  bodies,
  ropes,
  addBox,
  updateBoxMass,
  updateBoxFriction,
  updateBoxRestitution,
  toggleRollers,
  updateBoxAngle,
  updateBoxVelocity,
  updateBoxDimensions,
  updateTrackRadius,
  setAppliedForce,
  applyImpulse,
  addGround,
  setGroundFriction,
  updateGroundRestitution,
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
  measure: 'MEDICIÓN Y COTAS',
  rollers: 'RODILLOS / APOYO DESLIZANTE',
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
const showNewDocumentModal = ref(true)
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

function resetCameraView() {
  canvasScale.value = 40
  if (canvasRef.value?.resetCamera) {
    canvasRef.value.resetCamera()
  }
}

function startNewtonTour() {
  const driverObj = driver({
    showProgress: true,
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido!',
    steps: [
      {
        element: '#tour-tool-rail',
        popover: {
          title: '🛠️ Caja de Herramientas Flotante',
          description: 'Selecciona entre 13 herramientas especializadas: Cajas/Multiformas, Suelos, Cuerdas, Resortes, Poleas, Cotas de Medición y Rodillos.'
        }
      },
      {
        element: '#tour-physics-canvas',
        popover: {
          title: '🎨 Lienzo de Simulación 2D',
          description: 'Dibuja o spawnea objetos interactivos sobre la pantalla. Puedes mover la cámara con la mano (Atajo H) y usar la rueda para hacer zoom.'
        }
      },
      {
        element: '#tour-context-panel',
        popover: {
          title: '⚙️ Panel de Propiedades y Unidades',
          description: 'Ajusta masas, fricciones, la restitución (e) de rebote, velocidad inicial (Vx, Vy) y cambia entre el Sistema Internacional ($m, kg$) y el Sistema Inglés ($ft, lb$).'
        }
      },
      {
        element: '#tour-action-bar',
        popover: {
          title: '🎮 Barra de Control y Telemetría',
          description: 'Controla el flujo de tiempo (Pausa/Play), Deshacer (Ctrl+Z), Rehacer, Importar/Exportar escenas en JSON y grabar telemetría a Excel (CSV).'
        }
      }
    ]
  })
  driverObj.drive()
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

const unitSystem = ref('metric') // 'metric' | 'imperial'
const canvasTheme = ref('colorful') // 'colorful' | 'latex'
const fixedMeasurements = ref([])
const measureDragLine = ref(null)

const allMeasurements = computed(() => {
  const list = [...fixedMeasurements.value]
  if (measureDragLine.value) list.push(measureDragLine.value)
  return list
})

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
  } else if (activeTool.value === 'measure') {
    measureDragLine.value = { p1: { x, y }, p2: { x, y } }
  } else if (activeTool.value === 'rollers') {
    if (bodyId) {
      toggleRollers(bodyId)
      saveHistoryState()
    }
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
  } else if (activeTool.value === 'measure' && measureDragLine.value) {
    measureDragLine.value.p2 = { x, y }
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
  } else if (activeTool.value === 'measure' && measureDragLine.value) {
    fixedMeasurements.value.push({ ...measureDragLine.value })
    measureDragLine.value = null
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

  const lUnit = getUnitLabel('length', unitSystem.value)
  const vUnit = getUnitLabel('velocity', unitSystem.value)
  const aUnit = getUnitLabel('accel', unitSystem.value)

  let csv = `Tiempo (s),Objeto,Posicion X (${lUnit}),Posicion Y (${lUnit}),Velocidad X (${vUnit}),Velocidad Y (${vUnit}),Aceleracion X (${aUnit}),Aceleracion Y (${aUnit}),Angulo (deg),Velocidad Ang (deg/s),Altura Maxima (${lUnit})\n`
  for (const row of telemetryData) {
    const px = formatValue(row.px, 'length', unitSystem.value, 4)
    const py = formatValue(row.py, 'length', unitSystem.value, 4)
    const vx = formatValue(row.vx, 'velocity', unitSystem.value, 4)
    const vy = formatValue(row.vy, 'velocity', unitSystem.value, 4)
    const ax = formatValue(row.ax, 'accel', unitSystem.value, 4)
    const ay = formatValue(row.ay, 'accel', unitSystem.value, 4)
    const hmax = formatValue(row.hmax || 0, 'length', unitSystem.value, 4)
    csv += `${row.t.toFixed(4)},${row.id},${px},${py},${vx},${vy},${ax},${ay},${row.aDeg.toFixed(4)},${row.vaDeg.toFixed(4)},${hmax}\n`
  }

  if (fixedMeasurements.value.length > 0) {
    csv += `\n--- COTAS Y MEDICIONES DE INGENIERÍA ---\n`
    csv += `ID Cota,Distancia (${lUnit}),Desnivel H (${lUnit}),Angulo (deg)\n`
    fixedMeasurements.value.forEach((m, idx) => {
      const dx = m.p2.x - m.p1.x
      const dy = m.p2.y - m.p1.y
      const dist = formatValue(Math.hypot(dx, dy), 'length', unitSystem.value, 4)
      const hVal = formatValue(Math.abs(dy), 'length', unitSystem.value, 4)
      const deg = ((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2)
      csv += `Cota_${idx + 1},${dist},${hVal},${deg}\n`
    })
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `telemetria_2d_${unitSystem.value}.csv`
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
          vaDeg: ((vaRad || 0) * 180) / Math.PI,
          hmax: entry.maxHeightReached || 0
        })
      } catch (e) {}
    }
  }
}

let isUnmounted = false

function loop() {
  if (isUnmounted) return
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
    if (canvasRef.value && typeof canvasRef.value.draw === 'function') {
      canvasRef.value.draw(bodies, ropes, previewLine.value, groundDrawPoints.value, groundLiveInfo.value)
    }
  } catch (err) {
    console.error('[Sandbox] Error en bucle principal:', err)
  }
  if (!isUnmounted) {
    rafId = requestAnimationFrame(loop)
  }
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
  } else if (e.key.toLowerCase() === 'm') {
    activeTool.value = 'measure'
  } else if (e.key.toLowerCase() === 'a') {
    activeTool.value = 'anchor'
  } else if (e.key.toLowerCase() === 'o') {
    activeTool.value = 'rollers'
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
  saveHistoryState()
  rafId = requestAnimationFrame(loop)
  window.addEventListener('keydown', handleGlobalKeyDown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onBeforeUnmount(() => {
  isUnmounted = true
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
          id="tour-physics-canvas"
          ref="canvasRef"
          class="absolute inset-0 w-full h-full"
          :scale="canvasScale"
          :vector-scale="6"
          :selected-id="selectedBoxId"
          :active-tool="activeTool"
          :unit-system="unitSystem"
          :canvas-theme="canvasTheme"
          :measurements="allMeasurements"
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
          <div id="tour-action-bar" class="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
            <!-- BOTONES DE ARCHIVO (Agrupados) -->
            <div class="flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-[14px] shadow-md border border-gray-300/50 dark:border-gray-700/50 overflow-hidden">
              <button
                type="button"
                @click="exportSceneFile"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-700"
                title="Exportar Escena"
              >
                <Download class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="importSceneFile"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-700"
                title="Cargar Escena"
              >
                <FolderOpen class="w-4 h-4" />
              </button>
              <a
                href="https://github.com/TeoDev1611/simulador-fisica/tree/main/ejemplos"
                target="_blank"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Ejemplos GitHub"
              >
                <Github class="w-4 h-4" />
              </a>
            </div>

            <!-- HISTORIAL & ZOOM (Agrupados) -->
            <div class="hidden sm:flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-[14px] shadow-md border border-gray-300/50 dark:border-gray-700/50 overflow-hidden">
              <button
                type="button"
                @click="undo"
                :disabled="historyIndex <= 0"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 border-r border-gray-200 dark:border-gray-700"
                title="Deshacer (Ctrl+Z)"
              >
                <Undo2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="redo"
                :disabled="historyIndex >= history.length - 1"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 border-r border-gray-200 dark:border-gray-700"
                title="Rehacer (Ctrl+Y)"
              >
                <Redo2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="zoomOut"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r border-gray-200 dark:border-gray-700"
                title="Alejar"
              >
                <ZoomOut class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="zoomIn"
                class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Acercar"
              >
                <ZoomIn class="w-4 h-4" />
              </button>
            </div>

            <!-- BOTONES ESPECIALES -->
            <button
              type="button"
              @click="startNewtonTour"
              class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-2 rounded-[14px] shadow-md border border-emerald-500/30 text-xs flex items-center gap-1.5 transition-all"
              title="Guía interactiva paso a paso"
            >
              <HelpCircle class="w-4 h-4" />
              <span class="hidden sm:inline">Tour</span>
            </button>

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
          <ToolRail id="tour-tool-rail" :active-tool="activeTool" @select-tool="(tool) => (activeTool = tool)" class="pointer-events-auto" />
        </div>

        <!-- ContextPanel: Flotante a la derecha, con altura máxima en móviles para no chocar con ToolRail -->
        <div
          id="tour-context-panel"
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
            :unit-system="unitSystem"
            :canvas-theme="canvasTheme"
            @open-shape-editor="showShapeEditorModal = true"
            @update-unit-system="(sys) => (unitSystem = sys)"
            @update-canvas-theme="(thm) => (canvasTheme = thm)"
            @clear-measurements="fixedMeasurements = []"
            @update-box-restitution="updateBoxRestitution"
            @update-ground-restitution="updateGroundRestitution"
            @toggle-box-rollers="toggleRollers"
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
            v-if="showNewDocumentModal"
            class="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4"
          >
            <div
              class="bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-3xl border border-emerald-200/60 dark:border-emerald-800/60 rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-emerald-300/20 dark:from-emerald-900/20 to-transparent pointer-events-none"
              ></div>
              <div class="relative z-10 flex flex-col gap-6">
                <div class="flex flex-col items-center gap-2 mb-2 border-b border-gray-300 dark:border-gray-800 pb-6">
                  <div class="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl shadow-inner mb-2">
                    <Magnet class="w-10 h-10 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Nuevo Laboratorio</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center">Configura tu espacio de trabajo inicial</p>
                </div>

                <div class="flex flex-col gap-5">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sistema de Unidades</label>
                    <div class="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                      <button
                        @click="unitSystem = 'metric'"
                        class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                        :class="unitSystem === 'metric' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                      >
                        SI (m, kg)
                      </button>
                      <button
                        @click="unitSystem = 'imperial'"
                        class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                        :class="unitSystem === 'imperial' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                      >
                        US (ft, lb)
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tema del Lienzo</label>
                    <div class="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                      <button
                        @click="canvasTheme = 'colorful'"
                        class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                        :class="canvasTheme === 'colorful' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                      >
                        Colorido
                      </button>
                      <button
                        @click="canvasTheme = 'latex'"
                        class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                        :class="canvasTheme === 'latex' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                      >
                        Latex (Elegante)
                      </button>
                    </div>
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-3">
                  <button
                    @click="showNewDocumentModal = false; buildInitialScene()"
                    class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
                  >
                    Crear Proyecto en Blanco
                  </button>
                  <button
                    @click="showNewDocumentModal = false; importSceneFile()"
                    class="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3.5 px-4 rounded-xl shadow transition-all active:scale-95 flex justify-center items-center gap-2"
                  >
                    <FolderOpen class="w-5 h-5" /> Abrir Proyecto (.json)
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
