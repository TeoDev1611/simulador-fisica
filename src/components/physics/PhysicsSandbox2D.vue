<script setup>
// src/components/physics/PhysicsSandbox2D.vue
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlanckWorld } from '../../composables/usePlanckWorld.js'
import PhysicsCanvas from './PhysicsCanvas.vue'
import ToolRail from './ToolRail.vue'
import ContextPanel from './ContextPanel.vue'
import PhysicsDataPanel from './PhysicsDataPanel.vue'

const GRAVITY = 9.81
const {
  bodies, ropes, addBox, updateBoxMass, setAppliedForce, applyImpulse,
  setGroundPath, setGroundFriction, getGroundId, addAnchor,
  addRope, addSpring, setSpringStiffness, addPulley,
  removeBody, reset, step,
  queryPoint, startMouseDrag, updateMouseDrag, stopMouseDrag
} = usePlanckWorld(GRAVITY)

const canvasRef = ref(null)
const containerRef = ref(null)
const isRunning = ref(true)
const activeTool = ref('drag')
// La explicación detallada (objetivo, ventajas) ahora vive en la página de
// bienvenida (HomePage.vue), así que aquí ya no se abre sola al entrar.
// "Ayuda" solo muestra una referencia rápida de herramientas.
const showWelcomeModal = ref(false)

const boxEntries = computed(() => bodies.filter((b) => b.kind === 'box'))

const BOX_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#2dd4bf']
let colorIdx = 0
function nextColor() { return BOX_COLORS[colorIdx++ % BOX_COLORS.length] }

const groundFriction = ref(0.5)
const springFreq = ref(2.0)
const springDamping = ref(0.1)

const selectedBoxId = ref(null)
const selectedBox = computed(() => boxEntries.value.find(b => b.id === selectedBoxId.value) || null)

function buildInitialScene() {
  setGroundPath([{ x: -14, y: -2 }, { x: 14, y: -2 }], groundFriction.value)
  addBox({ x: -3, y: 2, width: 1, height: 1, mass: 2, friction: 0.3, color: nextColor(), label: 'Caja 1' })
  addBox({ x: 0, y: 4, width: 1, height: 1, mass: 1.5, friction: 0.3, color: nextColor(), label: 'Caja 2' })
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    containerRef.value?.requestFullscreen().catch(err => console.error(err))
  } else {
    document.exitFullscreen()
  }
}

function handleToggleRun() { isRunning.value = !isRunning.value }
function handleReset() {
  reset()
  colorIdx = 0
  selectedBoxId.value = null
  buildInitialScene()
}

function handleUpdateGroundFriction(v) {
  groundFriction.value = v
  setGroundFriction(v)
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
let jointStartBodyId = null
const previewLine = ref(null)

let forceDragBodyId = null
let forceDragOrigin = null 

const groundDrawPoints = ref(null) 

function distSq(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy }

function handleCanvasDown({ x, y }) {
  const bodyId = queryPoint(x, y)

  if (activeTool.value === 'drag') {
    if (bodyId) {
      selectedBoxId.value = bodyId
      startMouseDrag(bodyId, x, y); isDragging = true
    }
  } else if (activeTool.value === 'box') {
    const id = addBox({ x, y, width: 1, height: 1, mass: 2, friction: 0.3, color: nextColor(), label: `Caja ${boxEntries.value.length + 1}` })
    selectedBoxId.value = id
  } else if (activeTool.value === 'delete') {
    if (bodyId) {
      removeBody(bodyId)
      if (selectedBoxId.value === bodyId) selectedBoxId.value = null
    }
  } else if (activeTool.value === 'ground') {
    groundDrawPoints.value = [{ x, y }]
  } else if (activeTool.value === 'force') {
    if (bodyId) {
      selectedBoxId.value = bodyId
      const b = bodies.find(bx => bx.id === bodyId)
      if (b) {
        forceDragBodyId = bodyId
        forceDragOrigin = { x: b.position.x, y: b.position.y }
        previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
      }
    }
  } else if (['rope', 'spring', 'pulley'].includes(activeTool.value)) {
    if (bodyId) {
      jointStartBodyId = bodyId
      const b = bodies.find(bx => bx.id === bodyId)
      previewLine.value = { x1: b.position.x, y1: b.position.y, x2: x, y2: y }
    }
  }
}

function handleCanvasMove({ x, y }) {
  if (activeTool.value === 'drag' && isDragging) {
    updateMouseDrag(x, y)
  } else if (activeTool.value === 'ground' && groundDrawPoints.value) {
    const pts = groundDrawPoints.value
    const last = pts[pts.length - 1]
    if (distSq(last, { x, y }) > 0.15 * 0.15) pts.push({ x, y })
  } else if (previewLine.value) {
    previewLine.value.x2 = x
    previewLine.value.y2 = y
  }
}

function handleCanvasUp({ x, y }) {
  if (activeTool.value === 'drag' && isDragging) {
    stopMouseDrag()
    isDragging = false
  } else if (activeTool.value === 'ground' && groundDrawPoints.value) {
    if (groundDrawPoints.value.length >= 2) setGroundPath(groundDrawPoints.value, groundFriction.value)
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
  } else if (jointStartBodyId) {
    let endBodyId = queryPoint(x, y)
    if (!endBodyId) {
      endBodyId = addAnchor(x, y)
    }
    if (endBodyId && endBodyId !== jointStartBodyId) {
      if (activeTool.value === 'rope') addRope(jointStartBodyId, endBodyId)
      else if (activeTool.value === 'spring') addSpring(jointStartBodyId, endBodyId, { frequencyHz: springFreq.value, dampingRatio: springDamping.value })
      else if (activeTool.value === 'pulley') addPulley(jointStartBodyId, endBodyId)
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
    canvasRef.value?.draw(bodies, ropes, previewLine.value, groundDrawPoints.value)
  } catch (err) {
    console.error("[Sandbox] Error crítico recuperado en el bucle principal", err)
  }
  rafId = requestAnimationFrame(loop)
}

onMounted(() => {
  buildInitialScene()
  rafId = requestAnimationFrame(loop)
})
onBeforeUnmount(() => { if (rafId) cancelAnimationFrame(rafId) })
</script>

<template>
  <div class="flex flex-col flex-1">
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col">

      <div
        ref="containerRef"
        class="relative select-none flex-1 min-h-[560px] bg-gray-950 border border-gray-800 rounded-xl shadow-md overflow-hidden"
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

        <div class="pointer-events-none absolute top-0 left-0 right-0 flex items-start justify-between p-3 gap-2 flex-wrap z-20">
          <span class="pointer-events-auto text-[10px] font-mono bg-gray-950/90 backdrop-blur px-2 py-1.5 rounded-lg border border-gray-800 text-gray-400">
            Herramienta: <span class="text-emerald-300 font-bold">{{ activeTool.toUpperCase() }}</span>
          </span>
          <div class="pointer-events-auto flex items-center gap-2">
            <button
              type="button" @click="showWelcomeModal = true"
              class="text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg border border-blue-800 bg-blue-950/80 text-blue-300 hover:bg-blue-900/80 shadow-lg transition-colors duration-150"
            >
              ℹ️ Ayuda
            </button>
            <button
              type="button" @click="handleToggleRun"
              class="text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg border shadow-lg transition-colors duration-150"
              :class="isRunning
                ? 'bg-yellow-700/90 border-yellow-600 text-yellow-100 hover:bg-yellow-700'
                : 'bg-emerald-700/90 border-emerald-500 text-white hover:bg-emerald-600'"
            >
              {{ isRunning ? '⏸ Pausar' : '▶ Reproducir' }}
            </button>
            <button
              type="button" @click="handleReset"
              class="text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-red-800 bg-red-950/80 text-red-300 hover:bg-red-900/80 shadow-lg transition-colors duration-150"
            >
              ⟲ Reiniciar
            </button>
            <button
              @click="toggleFullscreen"
              class="text-[10px] bg-gray-800/90 hover:bg-gray-700 text-gray-200 px-2 py-1.5 rounded-lg border border-gray-700 shadow-lg flex items-center gap-1 transition-colors"
              title="Alternar Pantalla Completa"
            >
              ⛶
            </button>
          </div>
        </div>

        <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-20">
          <ToolRail :active-tool="activeTool" @select-tool="tool => activeTool = tool" />
        </div>

        <div class="pointer-events-none absolute right-3 top-16 z-20">
          <ContextPanel
            :active-tool="activeTool"
            :ground-friction="groundFriction"
            :spring-freq="springFreq"
            :spring-damping="springDamping"
            :selected-box="selectedBox"
            :ropes-count="ropes.length"
            @update-box-mass="updateBoxMass"
            @update-ground-friction="handleUpdateGroundFriction"
            @update-spring-preset="handleSpringPreset"
            @update-spring-stiffness="handleSpringDamping"
            @update-force="handleUpdateForce"
            @apply-impulse="handleApplyImpulse"
          />
        </div>

        <div class="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center z-20">
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
          <div v-if="showWelcomeModal" class="absolute inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
            <div class="bg-gray-900 border border-blue-800/60 rounded-2xl shadow-2xl max-w-xl w-full p-6 lg:p-7 max-h-[90vh] overflow-y-auto">

              <div class="flex items-center gap-3 mb-5 border-b border-gray-800 pb-4">
                <span class="text-3xl">🧲</span>
                <div>
                  <h2 class="text-xl font-bold text-blue-400">Newton Lab</h2>
                  <p class="text-xs text-gray-400">Referencia rápida de herramientas</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                <div class="flex gap-3">
                  <span class="text-lg">✋</span>
                  <p><strong class="text-gray-100">Mover / Seleccionar:</strong> Arrastra cajas libremente, o haz clic en una para ver/editar su masa en el panel derecho.</p>
                </div>
                <div class="flex gap-3">
                  <span class="text-lg">✏️</span>
                  <p><strong class="text-gray-100">Dibujar Suelo:</strong> Arrastra sobre el lienzo para trazar terrenos personalizados.</p>
                </div>
                <div class="flex gap-3">
                  <span class="text-lg">〰️</span>
                  <p><strong class="text-gray-100">Cuerdas y Resortes:</strong> Arrastra desde una caja hasta otra (o hacia el vacío para crear un anclaje fijo).</p>
                </div>
                <div class="flex gap-3">
                  <span class="text-lg">➤</span>
                  <p><strong class="text-gray-100">Fuerzas:</strong> Selecciona una caja y aplica fuerzas continuas o impulsos únicos configurando el vector resultante.</p>
                </div>
              </div>

              <p class="mt-5 text-[11px] text-gray-500 leading-relaxed">
                ¿Buscas el objetivo del laboratorio o sus ventajas? Puedes verlos en la pestaña
                <span class="text-gray-400 font-semibold">Inicio</span> del menú superior.
              </p>

              <div class="mt-6 flex justify-end">
                <button
                  @click="showWelcomeModal = false"
                  class="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg transition-colors"
                >
                  Entendido
                </button>
              </div>

            </div>
          </div>
        </Transition>

      </div>
    </main>
  </div>
</template>