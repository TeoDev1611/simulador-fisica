<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as math from 'mathjs'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MathKeyboard from './MathKeyboard.vue'
import ResultsCards from './kinematics/ResultsCards.vue'
import Track1D from './kinematics/Track1D.vue'
import ChartsPanel from './kinematics/ChartsPanel.vue'

// ----------------------------
// Estado reactivo principal
// ----------------------------
const equationInput = ref('A*sin(omega*t)*exp(-gamma*t)')
const debouncedEquation = ref(equationInput.value)
const time = ref(0)
const errorMessage = ref('')
const isValidating = ref(false)
const shakeError = ref(false)
const isPlaying = ref(false)
const isLooping = ref(false) // Nuevo estado para el bucle
let animationFrame = null

// Modales
const showEquationsModal = ref(false)

// Parámetros de la ecuación
const parameters = ref({ A: 2, omega: 3, gamma: 0.2 })
const parameterInputName = ref('')
const parameterInputValue = ref(1)
const showParametersPanel = ref(true)

// Estado derivado
const velocityExprStr = ref('')
const accelerationExprStr = ref('')
const positionValue = ref(0)
const velocityValue = ref(0)
const accelerationValue = ref(0)

// Presets de ecuaciones
const presetEquations = [
  { label: 'Parabólica genérica', expr: 'a*t^2 + b*t + c', params: { a: 1, b: 2, c: 0 } },
  { label: 'Caída libre', expr: '-4.9*t^2 + v0*t + y0', params: { v0: 5, y0: 1 } },
  { label: 'Masa-resorte (seno)', expr: 'A*sin(omega*t) + offset', params: { A: 1, omega: 2, offset: 0 } },
  { label: 'Cúbica con parámetros', expr: 'a*t^3 + b*t^2 + c*t + d', params: { a: 1, b: 2, c: 3, d: 0 } },
  { label: 'Exponencial simple', expr: 'A*exp(k*t)', params: { A: 1, k: 0.5 } },
  { label: 'Seno amortiguado', expr: 'A*sin(omega*t)*exp(-gamma*t)', params: { A: 2, omega: 3, gamma: 0.2 } },
  { label: 'Combinación trigonométrica', expr: '2*sin(3*t) + 0.5*cos(5*t)', params: {} }
]

let debounceTimer = null

// Tiempo dinámico
const T_MIN = 0
const T_MAX = ref(5)
const T_STEP = 0.05

// ----------------------------
// Preprocesamiento
// ----------------------------
function preprocessEquation(expr) {
  let processed = expr
  processed = processed.replace(/(\d+)([a-zA-Z_])/g, '$1*$2')
  processed = processed.replace(/(\d+)\(/g, '$1*(')
  processed = processed.replace(/\)([a-zA-Z_\d])/g, ')*$1')
  processed = processed.replace(/\)\(/g, ')*(')
  return processed
}

// ----------------------------
// Funciones auxiliares LaTeX (Corregido \cdote)
// ----------------------------
function customLatexHandler(node, options) {
  // Transforma exp(algo) en e^{algo}.
  // NOTA: Se añade un espacio antes de la 'e' para evitar que
  // se junte con un \cdot previo generado por mathjs y forme un \cdote
  if (node.type === 'FunctionNode' && node.fn.name === 'exp') {
    return ` e^{${node.args[0].toTex(options)}}`
  }
}

function exprToLatex(exprStr) {
  if (!exprStr || !exprStr.trim()) return ''
  try {
    const node = math.parse(exprStr)
    return node.toTex({ parenthesis: 'auto', implicit: 'hide', handler: customLatexHandler })
  } catch (err) {
    return null
  }
}

function renderKatex(latexStr, displayMode = true) {
  if (latexStr === null) return null
  if (!latexStr) return ''
  try {
    return katex.renderToString(latexStr, { throwOnError: false, displayMode, output: 'html' })
  } catch (err) {
    return null
  }
}

// ----------------------------
// Computed: Vistas Previas LaTeX
// ----------------------------
const livePreviewHtml = computed(() => {
  const tex = exprToLatex(equationInput.value)
  if (tex === null) return null
  return renderKatex(`x(t) = ${tex}`, true)
})

const latexPosition = computed(() => {
  const tex = exprToLatex(debouncedEquation.value)
  return renderKatex(tex !== null ? `x(t) = ${tex}` : null, true)
})

const latexVelocity = computed(() => {
  if (!velocityExprStr.value) return ''
  const tex = exprToLatex(velocityExprStr.value)
  return renderKatex(tex !== null ? `v(t) = \\dfrac{dx}{dt} = ${tex}` : null, true)
})

const latexAcceleration = computed(() => {
  if (!accelerationExprStr.value) return ''
  const tex = exprToLatex(accelerationExprStr.value)
  return renderKatex(tex !== null ? `a(t) = \\dfrac{dv}{dt} = ${tex}` : null, true)
})

// ----------------------------
// Detección de Variables
// ----------------------------
function getVariablesUsed(expr) {
  try {
    const node = math.parse(expr)
    const symbols = new Set()
    node.traverse((n, path, parent) => {
      if (n.isSymbolNode) {
        const name = n.name
        // Ignore native functions used as functions
        if (parent && parent.isFunctionNode && parent.fn.name === name) return
        // Ignore "t", known math constants, and math.js native functions/constants
        if (
          name !== 't' &&
          typeof math[name] !== 'function' &&
          typeof math[name] !== 'number' &&
          !['pi', 'e', 'tau', 'i', 'Infinity', 'NaN'].includes(name)
        ) {
          symbols.add(name)
        }
      }
    })
    return Array.from(symbols)
  } catch (e) {
    return []
  }
}

function isValidParamName(name) {
  return (
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) &&
    !['t', 'pi', 'e', 'true', 'false', 'null', 'undefined'].includes(name) &&
    !(name in math)
  )
}

function autoDetectAndAddParameters(expr) {
  const vars = getVariablesUsed(expr)
  let added = false
  for (const v of vars) {
    if (!parameters.value.hasOwnProperty(v)) {
      parameters.value = { ...parameters.value, [v]: 1 }
      added = true
    }
  }
  return added
}

// ----------------------------
// Teclado virtual
// ----------------------------
const equationInputRef = ref(null)
const isKeyboardOpen = ref(false)
const cursorPosition = ref(equationInput.value.length)

function captureCursor() {
  if (equationInputRef.value) {
    cursorPosition.value = equationInputRef.value.selectionStart ?? equationInput.value.length
  }
}

function toggleKeyboard() {
  isKeyboardOpen.value = !isKeyboardOpen.value
  if (isKeyboardOpen.value) {
    nextTick(() => equationInputRef.value?.focus())
  }
}

// ----------------------------
// Gestión de parámetros
// ----------------------------
function addParameter() {
  const name = parameterInputName.value.trim()
  const value = Number(parameterInputValue.value)

  if (!name) {
    errorMessage.value = 'El nombre no puede estar vacío.'
    return
  }
  if (!isValidParamName(name)) {
    errorMessage.value = `"${name}" no es válido.`
    return
  }
  if (parameters.value.hasOwnProperty(name)) {
    errorMessage.value = `El parámetro "${name}" ya existe.`
    return
  }
  if (isNaN(value)) {
    errorMessage.value = 'Valor numérico inválido.'
    return
  }

  parameters.value = { ...parameters.value, [name]: value }
  parameterInputName.value = ''
  parameterInputValue.value = 1
  errorMessage.value = ''
  forceCalculate()
}

function removeParameter(name) {
  const newParams = { ...parameters.value }
  delete newParams[name]
  parameters.value = newParams
  forceCalculate()
}

function updateParameter(name, value) {
  const num = Number(value)
  if (!isNaN(num)) parameters.value = { ...parameters.value, [name]: num }
}

// ----------------------------
// Motor matemático
// ----------------------------
function compileExpressions() {
  const previousError = errorMessage.value
  errorMessage.value = ''
  try {
    let cleanInput = debouncedEquation.value.trim()
    if (!cleanInput) throw new Error('La ecuación no puede estar vacía.')

    cleanInput = preprocessEquation(cleanInput)
    autoDetectAndAddParameters(cleanInput)

    const usedVars = getVariablesUsed(cleanInput)
    const definedVars = Object.keys(parameters.value)
    const undefinedVars = usedVars.filter((v) => !definedVars.includes(v))
    if (undefinedVars.length > 0) {
      throw new Error(`Variables no definidas: ${undefinedVars.join(', ')}. Añádelas como parámetros.`)
    }

    const velocityNode = math.derivative(cleanInput, 't')
    const accelerationNode = math.derivative(velocityNode, 't')

    velocityExprStr.value = velocityNode.toString()
    accelerationExprStr.value = accelerationNode.toString()

    const scope = { t: 0, ...parameters.value }
    math.evaluate(cleanInput, scope)
    math.evaluate(velocityExprStr.value, scope)
    math.evaluate(accelerationExprStr.value, scope)

    return true
  } catch (err) {
    errorMessage.value = `Error: ${err.message}`
    velocityExprStr.value = ''
    accelerationExprStr.value = ''
    if (!previousError) triggerShake()
    return false
  }
}

function evaluateAtCurrentTime() {
  try {
    if (errorMessage.value) {
      positionValue.value = 0
      velocityValue.value = 0
      accelerationValue.value = 0
      return
    }
    const scope = { t: time.value, ...parameters.value }
    positionValue.value = math.evaluate(debouncedEquation.value, scope)
    velocityValue.value = math.evaluate(velocityExprStr.value, scope)
    accelerationValue.value = math.evaluate(accelerationExprStr.value, scope)
  } catch (err) {
    errorMessage.value = `Error en t=${time.value}: ${err.message}`
  }
}

// ----------------------------
// Caché del dataset de las gráficas
// ----------------------------
const chartDataset = computed(() => {
  const labels = []
  const sData = []
  const vData = []
  const aData = []

  if (errorMessage.value || !debouncedEquation.value) {
    return { labels, sData, vData, aData }
  }

  try {
    for (let t = T_MIN; t <= T_MAX.value + 1e-9; t += T_STEP) {
      const tRounded = Math.round(t * 100) / 100
      labels.push(tRounded.toFixed(2))
      const scope = { t: tRounded, ...parameters.value }
      sData.push(math.evaluate(debouncedEquation.value, scope))
      vData.push(math.evaluate(velocityExprStr.value, scope))
      aData.push(math.evaluate(accelerationExprStr.value, scope))
    }
  } catch (err) {
    // Controlado por compileExpressions
  }

  return { labels, sData, vData, aData }
})

function forceCalculate() {
  clearTimeout(debounceTimer)
  isValidating.value = false
  debouncedEquation.value = equationInput.value

  const ok = compileExpressions()
  evaluateAtCurrentTime()
  recalcTrackBounds()
}

// ----------------------------
// Pista 1D
// ----------------------------
const trackMinX = ref(-50)
const trackMaxX = ref(50)

const particleLeftPercent = computed(() => {
  const min = trackMinX.value
  const max = trackMaxX.value
  const range = max - min || 1
  let pct = ((positionValue.value - min) / range) * 100
  if (!isFinite(pct)) pct = 50
  pct = Math.max(2, Math.min(98, pct))
  return pct
})

function recalcTrackBounds() {
  try {
    if (errorMessage.value) return
    const { sData } = chartDataset.value
    if (sData.length === 0) return
    const min = Math.min(...sData)
    const max = Math.max(...sData)
    const padding = Math.max((max - min) * 0.2, 2)
    trackMinX.value = min - padding
    trackMaxX.value = max + padding
  } catch (err) {}
}

// ----------------------------
// Reproducción con Bucle (Mejorada)
// ----------------------------
function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (time.value >= T_MAX.value) time.value = T_MIN
    playLoop()
  } else {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }
}

function playLoop() {
  if (!isPlaying.value) return
  // Velocidad dinámica para asegurar que gráficas muy largas no tarden horas en visualizarse
  const speed = Math.max(0.015, T_MAX.value / 350)
  time.value += speed

  if (time.value >= T_MAX.value) {
    if (isLooping.value) {
      time.value = 0 // Reinicio por bucle
    } else {
      time.value = T_MAX.value
      isPlaying.value = false
      evaluateAtCurrentTime()
      return
    }
  }

  evaluateAtCurrentTime()
  animationFrame = requestAnimationFrame(playLoop)
}

// ----------------------------
// Watchers de ciclo de vida
// ----------------------------
watch(equationInput, (newVal) => {
  isValidating.value = true
  errorMessage.value = ''
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedEquation.value = newVal
    isValidating.value = false
  }, 600)
})

watch(debouncedEquation, () => forceCalculate())

watch(time, () => {
  evaluateAtCurrentTime()
})

watch(parameters, () => forceCalculate(), { deep: true })

watch(T_MAX, (newVal) => {
  if (time.value > newVal) time.value = newVal
  forceCalculate()
})

function applyPreset(preset) {
  if (preset.params) parameters.value = { ...preset.params }
  equationInput.value = preset.expr
  cursorPosition.value = preset.expr.length
  isValidating.value = false
  time.value = 0
  if (isPlaying.value) togglePlay()
}

function triggerShake() {
  shakeError.value = false
  nextTick(() => {
    shakeError.value = true
    setTimeout(() => {
      shakeError.value = false
    }, 450)
  })
}

function fmt(value) {
  if (typeof value !== 'number' || !isFinite(value)) return '---'
  return value.toFixed(2)
}

function handleGlobalKeyDown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  }
}

function handleEnterPlay() {
  forceCalculate()
  if (!isPlaying.value) togglePlay()
}

onMounted(() => {
  parameters.value = { A: 2, omega: 3, gamma: 0.2 }
  forceCalculate()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<template>
  <div class="flex flex-col gap-0">
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- COLUMNA IZQUIERDA -->
      <section class="lg:col-span-4 flex flex-col gap-6">
        <!-- Panel de entrada de ecuación -->
        <div
          class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border rounded-[2rem] p-6 shadow-lg dark:shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)]"
          :class="
            errorMessage
              ? 'border-red-300/70 dark:border-red-700/70'
              : isValidating
                ? 'border-yellow-200/60 dark:border-yellow-600/60'
                : 'border-emerald-300/60 dark:border-emerald-700/60'
          "
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-300/10 dark:from-emerald-900/10 to-transparent pointer-events-none"
          ></div>
          <div class="flex items-center justify-between mb-2 relative z-10">
            <label class="block text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
              >Ecuación de posición x(t)</label
            >
            <span class="flex items-center gap-1 text-[10px] font-medium">
              <template v-if="isValidating"
                ><span class="w-2 h-2 rounded-full bg-yellow-700 dark:bg-yellow-400 animate-pulse"></span
                ><span class="text-yellow-700 dark:text-yellow-400">Escribiendo…</span></template
              >
              <template v-else-if="errorMessage"
                ><span class="w-2 h-2 rounded-full bg-red-800 dark:bg-red-500"></span
                ><span class="text-red-700 dark:text-red-400">Inválida</span></template
              >
              <template v-else
                ><span
                  class="w-2 h-2 rounded-full bg-emerald-700 dark:bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]"
                ></span
                ><span class="text-emerald-700 dark:text-emerald-400">Válida</span></template
              >
            </span>
          </div>

          <div class="relative">
            <input
              ref="equationInputRef"
              v-model="equationInput"
              type="text"
              spellcheck="false"
              autocomplete="off"
              @keydown.enter.prevent="handleEnterPlay"
              @click="captureCursor"
              @keyup="captureCursor"
              @focus="captureCursor"
              class="w-full bg-gray-50 dark:bg-gray-950 border rounded-lg pl-3 pr-9 py-2.5 text-sm font-mono outline-none transition-all duration-200"
              :class="[
                errorMessage
                  ? 'border-red-200 dark:border-red-600 focus:ring-2 focus:ring-red-800/50 dark:ring-red-500/50'
                  : 'border-gray-300 dark:border-gray-700 focus:border-emerald-800 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-800/40 dark:ring-emerald-500/40',
                shakeError ? 'animate-shake' : ''
              ]"
              placeholder="Ej: A*sin(omega*t)+offset"
            />
          </div>

          <!-- Vista previa LaTeX Principal -->
          <div
            class="mt-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-3 min-h-[3.25rem] flex items-center justify-center overflow-x-auto"
          >
            <div
              v-if="livePreviewHtml"
              class="katex-display-custom text-emerald-700 dark:text-emerald-300"
              v-html="livePreviewHtml"
            ></div>
            <span v-else class="text-xs text-gray-600 italic">La fórmula aparecerá aquí…</span>
          </div>
          <p v-if="errorMessage" class="mt-2 text-xs text-red-700 dark:text-red-400 font-medium flex items-start gap-1">
            <span>⚠</span><span>{{ errorMessage }}</span>
          </p>

          <!-- Botones Calcular y Teclado -->
          <div class="mt-3 flex gap-2">
            <button
              @click="forceCalculate"
              class="flex-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-600 bg-emerald-300/20 dark:bg-emerald-700/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-300/40 dark:bg-emerald-700/40 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Calcular (Enter)
            </button>
            <button
              @click="toggleKeyboard"
              class="flex-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide py-1.5 rounded-lg border transition-colors duration-150"
              :class="
                isKeyboardOpen
                  ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
                  : 'bg-gray-200/60 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-800 hover:border-emerald-200 dark:border-emerald-600'
              "
            >
              {{ isKeyboardOpen ? 'Ocultar teclado' : 'Mostrar teclado' }}
            </button>
          </div>

          <!-- Teclado virtual -->
          <MathKeyboard
            v-model="equationInput"
            v-model:cursorPosition="cursorPosition"
            :parameters="parameters"
            :input-el="equationInputRef"
            :is-open="isKeyboardOpen"
            @toggle-parameters="showParametersPanel = !showParametersPanel"
          />

          <!-- Ejemplos -->
          <div class="mt-4">
            <p class="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-2">Ejemplos rápidos</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="preset in presetEquations"
                :key="preset.label"
                @click="applyPreset(preset)"
                type="button"
                class="text-[11px] px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-200/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-emerald-300 dark:bg-emerald-700 hover:border-emerald-800 dark:border-emerald-500 hover:text-gray-900 dark:text-white transition-colors duration-150"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Previsualización de derivadas truncada y Botón Ver Ecuaciones -->
          <div class="mt-4 border-t border-gray-300 dark:border-gray-800 pt-3 flex flex-col gap-2">
            <div class="flex gap-2 text-[10px] text-gray-600 dark:text-gray-500 mb-1">
              <span class="flex-1 truncate">v(t) = derivada de x(t)</span>
              <span class="flex-1 truncate">a(t) = derivada de v(t)</span>
            </div>
            <button
              @click="showEquationsModal = true"
              class="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-600 bg-emerald-300/40 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/50 dark:bg-emerald-800/50 transition-colors shadow-lg shadow-emerald-300/20 dark:shadow-emerald-900/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                />
              </svg>
              Ver Ecuaciones Completas (x, v, a)
            </button>
          </div>
        </div>

        <!-- Panel de parámetros -->
        <div
          class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-6 shadow-lg dark:shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)]"
        >
          <button
            @click="showParametersPanel = !showParametersPanel"
            class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
          >
            <span>⚙️ Parámetros</span>
            <span class="text-gray-600 dark:text-gray-500 text-[10px] normal-case tracking-normal">{{
              showParametersPanel ? 'Ocultar ▾' : 'Mostrar ▴'
            }}</span>
          </button>
          <div v-show="showParametersPanel" class="mt-3 space-y-3">
            <div
              v-for="(value, name) in parameters"
              :key="name"
              class="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-2"
            >
              <span class="text-xs font-mono text-emerald-700 dark:text-emerald-300 w-8">{{ name }}</span>
              <input
                type="range"
                :min="-20"
                :max="20"
                :step="0.1"
                :value="value"
                @input="updateParameter(name, Number($event.target.value))"
                class="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <input
                type="number"
                :value="value"
                @input="updateParameter(name, Number($event.target.value))"
                step="0.1"
                class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
              />
              <button
                @click="removeParameter(name)"
                class="text-red-700 dark:text-red-400 hover:text-red-700 dark:text-red-300 text-sm font-bold"
              >
                ×
              </button>
            </div>
            <div
              class="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-2"
            >
              <input
                v-model="parameterInputName"
                placeholder="Nombre"
                class="flex-1 bg-transparent border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-200 focus:border-emerald-800 dark:border-emerald-500 outline-none"
                @keydown.enter="addParameter"
              />
              <input
                v-model.number="parameterInputValue"
                type="number"
                step="0.1"
                class="w-16 bg-transparent border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
                @keydown.enter="addParameter"
              />
              <button
                @click="addParameter"
                class="px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded hover:bg-emerald-300/30 dark:bg-emerald-900/30"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Control de tiempo -->
        <div
          class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-6 shadow-lg dark:shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)]"
        >
          <div class="flex items-center justify-between mb-3 relative z-10">
            <label class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
              >Tiempo de simulación</label
            >
            <div class="flex items-center gap-2">
              <label class="text-[10px] text-gray-600 dark:text-gray-500">T. máx (s):</label>
              <input
                type="number"
                v-model.number="T_MAX"
                min="1"
                step="1"
                class="w-12 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1 py-0.5 text-xs font-mono text-emerald-700 dark:text-emerald-300 outline-none text-center"
              />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="time"
              type="range"
              :min="0"
              :max="T_MAX"
              :step="T_STEP"
              class="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <button
              @click="togglePlay"
              class="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
              :class="
                isPlaying
                  ? 'bg-yellow-300 dark:bg-yellow-700 border-yellow-200 dark:border-yellow-600 text-gray-900 dark:text-white hover:bg-yellow-200 dark:bg-yellow-600'
                  : 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white hover:bg-emerald-200 dark:bg-emerald-600'
              "
              title="Reproducir/Pausar"
            >
              {{ isPlaying ? '⏸' : '▶' }}
            </button>

            <!-- NUEVO: Botón de Bucle -->
            <button
              @click="isLooping = !isLooping"
              class="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
              :class="
                isLooping
                  ? 'bg-indigo-300 dark:bg-indigo-700 border-indigo-800 dark:border-indigo-500 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-500 hover:bg-gray-700'
              "
              title="Activar/Desactivar Bucle"
            >
              🔁
            </button>
          </div>
          <div class="flex justify-between text-[10px] text-gray-600 dark:text-gray-500 mt-1">
            <span>0 s</span>
            <span class="text-sm font-mono text-emerald-700 dark:text-emerald-300 font-bold"
              >t = {{ fmt(time) }} s</span
            >
            <span>{{ T_MAX }} s</span>
          </div>
        </div>

        <!-- Tarjetas de resultados -->
        <ResultsCards :position="positionValue" :velocity="velocityValue" :acceleration="accelerationValue" />
      </section>

      <!-- COLUMNA DERECHA -->
      <section class="lg:col-span-8 flex flex-col gap-6">
        <!-- Pista 1D -->
        <Track1D :positionValue="positionValue" :trackMinX="trackMinX" :trackMaxX="trackMaxX" />

        <!-- Gráficos -->
        <ChartsPanel :chartDataset="chartDataset" :time="time" />
      </section>
    </main>

    <!-- Modal Ecuaciones Completas -->
    <Teleport to="body">
      <div
        v-if="showEquationsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm p-4"
        @click.self="showEquationsModal = false"
      >
        <div
          class="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-2xl w-full max-w-4xl p-6 flex flex-col overflow-y-auto max-h-[95vh]"
        >
          <div class="flex items-center justify-between mb-6 border-b border-gray-300 dark:border-gray-800 pb-3">
            <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Desarrollo Analítico de Ecuaciones
            </h3>
            <button
              @click="showEquationsModal = false"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 hover:bg-red-300/50 dark:bg-red-900/50 rounded-full p-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-300 dark:border-gray-800">
              <p
                class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-300/50 dark:border-gray-800/50 pb-2"
              >
                Posición (Ecuación Base)
              </p>
              <div
                v-if="latexPosition"
                class="text-xl text-emerald-700 dark:text-emerald-300 flex justify-center py-4"
                v-html="latexPosition"
              ></div>
              <p v-else class="text-center text-red-700 dark:text-red-400 text-sm">Fórmula inválida</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-300 dark:border-gray-800">
              <p
                class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-300/50 dark:border-gray-800/50 pb-2"
              >
                Velocidad (Primera Derivada)
              </p>
              <div
                v-if="latexVelocity"
                class="text-xl text-yellow-700 dark:text-yellow-300 flex justify-center py-4"
                v-html="latexVelocity"
              ></div>
              <p v-else class="text-center text-red-700 dark:text-red-400 text-sm">Fórmula inválida</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-300 dark:border-gray-800">
              <p
                class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-300/50 dark:border-gray-800/50 pb-2"
              >
                Aceleración (Segunda Derivada)
              </p>
              <div
                v-if="latexAcceleration"
                class="text-xl text-blue-700 dark:text-blue-300 flex justify-center py-4"
                v-html="latexAcceleration"
              ></div>
              <p v-else class="text-center text-red-700 dark:text-red-400 text-sm">Fórmula inválida</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes shake {
  10%,
  90% {
    transform: translateX(-1px);
  }
  20%,
  80% {
    transform: translateX(2px);
  }
  30%,
  50%,
  70% {
    transform: translateX(-4px);
  }
  40%,
  60% {
    transform: translateX(4px);
  }
}
.animate-shake {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.katex-display-custom :deep(.katex) {
  color: inherit;
  font-size: 1.05em;
}
.katex-display-custom :deep(.katex-display) {
  margin: 0;
}
</style>
