<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as math from 'mathjs'
import Chart from 'chart.js/auto'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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

// Refs de canvas
const sChartCanvas = ref(null)
const vChartCanvas = ref(null)
const aChartCanvas = ref(null)

let sChart = null
let vChart = null
let aChart = null
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
    const mathFunctions = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'log', 'log10', 'exp', 'sqrt', 'abs', 'ceil', 'floor', 'round', 'sign', 'pow', 'pi', 'e', 'tau', 'i', 'Infinity', 'NaN'])
    node.traverse((n) => {
      if (n.isSymbolNode) {
        const name = n.name
        if (name !== 't' && !mathFunctions.has(name) && !math.hasOwnProperty(name)) {
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
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && !['t', 'pi', 'e', 'true', 'false', 'null', 'undefined'].includes(name) && !math.hasOwnProperty(name)
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
const activeKeyboardTab = ref('basic')
const cursorPosition = ref(equationInput.value.length)

const keyboardTabs = [
  { id: 'basic', label: '123' },
  { id: 'functions', label: 'f(x)' },
  { id: 'greek', label: 'αβγ' },
  { id: 'params', label: 'abc' }
]

const basicKeys = [
  { display: '7', insert: '7' }, { display: '8', insert: '8' }, { display: '9', insert: '9' }, { display: '÷', insert: '/' }, { display: '⌫', action: 'backspace' },
  { display: '4', insert: '4' }, { display: '5', insert: '5' }, { display: '6', insert: '6' }, { display: '×', insert: '*' }, { display: '(', insert: '(' },
  { display: '1', insert: '1' }, { display: '2', insert: '2' }, { display: '3', insert: '3' }, { display: '−', insert: '-' }, { display: ')', insert: ')' },
  { display: '0', insert: '0' }, { display: '.', insert: '.' }, { display: 't', insert: 't' }, { display: '+', insert: '+' }, { display: 'xʸ', insert: '^', cursorOffset: 0 },
  { display: 'π', insert: 'pi' }, { display: '√', insert: 'sqrt()', cursorOffset: 1 }, { display: 'x²', insert: '^2' }, { display: 'x³', insert: '^3' }, { display: 'C', action: 'clear' }
]

const functionKeys = [
  { display: 'sin(', insert: 'sin()', cursorOffset: 1 }, { display: 'cos(', insert: 'cos()', cursorOffset: 1 },
  { display: 'tan(', insert: 'tan()', cursorOffset: 1 }, { display: 'ln(', insert: 'log()', cursorOffset: 1 },
  { display: 'log₁₀(', insert: 'log10()', cursorOffset: 1 }, { display: 'exp(', insert: 'exp()', cursorOffset: 1 },
  { display: 'abs(', insert: 'abs()', cursorOffset: 1 }, { display: '√(', insert: 'sqrt()', cursorOffset: 1 },
  { display: 'asin(', insert: 'asin()', cursorOffset: 1 }, { display: 'acos(', insert: 'acos()', cursorOffset: 1 },
  { display: 'atan(', insert: 'atan()', cursorOffset: 1 }, { display: 'xʸ', insert: '^', cursorOffset: 0 },
  { display: '⌫', action: 'backspace' }, { display: '(', insert: '(' }, { display: ')', insert: ')' }, { display: 'C', action: 'clear' }
]

const greekKeys = [
  { display: 'π', insert: 'pi' }, { display: 'τ', insert: 'tau' }, { display: 'e', insert: 'e' },
  { display: '⌫', action: 'backspace' }, { display: 'C', action: 'clear' }
]

const paramKeys = computed(() => {
  const keys = Object.keys(parameters.value).map(name => ({ display: name, insert: name, cursorOffset: 0 }))
  keys.push({ display: '+ param', action: 'openParams' })
  keys.push({ display: '⌫', action: 'backspace' })
  keys.push({ display: 'C', action: 'clear' })
  return keys
})

const currentKeys = computed(() => {
  if (activeKeyboardTab.value === 'functions') return functionKeys
  if (activeKeyboardTab.value === 'greek') return greekKeys
  if (activeKeyboardTab.value === 'params') return paramKeys.value
  return basicKeys
})

function captureCursor() {
  if (equationInputRef.value) {
    cursorPosition.value = equationInputRef.value.selectionStart ?? equationInput.value.length
  }
}

function pressKey(key) {
  if (key.action === 'openParams') {
    showParametersPanel.value = !showParametersPanel.value
    return
  }
  const inputEl = equationInputRef.value
  const pos = cursorPosition.value
  
  equationInputRef.value.focus()

  if (key.action === 'clear') {
    equationInput.value = ''
    cursorPosition.value = 0
  } else if (key.action === 'backspace') {
    if (pos > 0) {
      equationInput.value = equationInput.value.slice(0, pos - 1) + equationInput.value.slice(pos)
      cursorPosition.value = pos - 1
    }
  } else {
    equationInput.value = equationInput.value.slice(0, pos) + key.insert + equationInput.value.slice(pos)
    cursorPosition.value = pos + key.insert.length - (key.cursorOffset ?? 0)
  }

  nextTick(() => {
    if (inputEl) inputEl.setSelectionRange(cursorPosition.value, cursorPosition.value)
  })
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

  if (!name) { errorMessage.value = 'El nombre no puede estar vacío.'; return }
  if (!isValidParamName(name)) { errorMessage.value = `"${name}" no es válido.`; return }
  if (parameters.value.hasOwnProperty(name)) { errorMessage.value = `El parámetro "${name}" ya existe.`; return }
  if (isNaN(value)) { errorMessage.value = 'Valor numérico inválido.'; return }

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
    const undefinedVars = usedVars.filter(v => !definedVars.includes(v))
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
  
  nextTick(() => {
    if (ok) {
      if (sChart && vChart && aChart) {
        updateChartsData()
        updateExpandedChart()
      } else {
        buildCharts()
      }
    }
  })
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
      refreshCursorOnly()
      return
    }
  }
  
  evaluateAtCurrentTime()
  refreshCursorOnly()
  animationFrame = requestAnimationFrame(playLoop)
}

// ----------------------------
// Modal Expandido de Gráficos (Chart.js)
// ----------------------------
const expandedChart = ref(null)
const expandedCanvasRef = ref(null)
let expandedChartInstance = null

function openExpandedChart(type) {
  expandedChart.value = type
  nextTick(() => {
    if (expandedCanvasRef.value) buildExpandedChart()
  })
}

function closeExpandedChart() {
  if (expandedChartInstance) {
    expandedChartInstance.destroy()
    expandedChartInstance = null
  }
  expandedChart.value = null
}

function buildExpandedChart() {
  if (!expandedCanvasRef.value) return
  const ctx = expandedCanvasRef.value.getContext('2d')
  const { labels, sData, vData, aData } = chartDataset.value
  let data, color, label, title
  
  if (expandedChart.value === 'position') {
    data = sData; color = '#10b981'; label = 'x(t)'; title = 'Posición x(t) [m]'
  } else if (expandedChart.value === 'velocity') {
    data = vData; color = '#facc15'; label = 'v(t)'; title = 'Velocidad v(t) [m/s]'
  } else if (expandedChart.value === 'acceleration') {
    data = aData; color = '#60a5fa'; label = 'a(t)'; title = 'Aceleración a(t) [m/s²]'
  } else return

  if (expandedChartInstance) expandedChartInstance.destroy()

  expandedChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label, data, borderColor: color, backgroundColor: color + '33', fill: true, tension: 0.3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#e5e7eb', font: { size: 16, weight: '600' } },
        tooltip: {
          backgroundColor: '#111827', titleColor: '#34d399', bodyColor: '#f3f4f6',
          borderColor: '#374151', borderWidth: 1, callbacks: { title: (items) => `t = ${items[0].label} s` }
        }
      },
      scales: {
        x: { ticks: { color: '#9ca3af', maxTicksLimit: 10 }, grid: { color: 'rgba(75, 85, 99, 0.2)' }, title: { display: true, text: 't (s)', color: '#9ca3af', font: { size: 12 } } },
        y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
      }
    },
    plugins: [makeCursorPlugin(color)]
  })
}

function currentTimeIndex(labels) {
  if (!labels || labels.length === 0) return -1
  const target = time.value
  let closestIdx = 0, closestDiff = Infinity
  for (let i = 0; i < labels.length; i++) {
    const diff = Math.abs(parseFloat(labels[i]) - target)
    if (diff < closestDiff) { closestDiff = diff; closestIdx = i }
  }
  return closestIdx
}

function makeCursorPlugin(dotColor) {
  return {
    id: `cursor-${dotColor}`,
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart
      const labels = chart.data.labels
      const idx = currentTimeIndex(labels)
      if (idx < 0 || !chartArea) return
      const value = chart.data.datasets[0].data[idx]
      if (typeof value !== 'number' || !isFinite(value)) return

      const x = scales.x.getPixelForValue(idx)
      const y = scales.y.getPixelForValue(value)

      ctx.save()
      ctx.beginPath(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1
      ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = dotColor
      ctx.shadowColor = dotColor; ctx.shadowBlur = 12; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#0a0a0a'; ctx.stroke(); ctx.restore()
    }
  }
}

const baseChartOptions = (titleText) => ({
  responsive: true, maintainAspectRatio: false, animation: { duration: 250, easing: 'easeOutQuad' }, interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: false }, title: { display: false },
    tooltip: { backgroundColor: '#111827', titleColor: '#34d399', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, callbacks: { title: (items) => `t = ${items[0].label} s` } }
  },
  // Al quitar "min" y "max" manuales del eje X, evitamos que Chart.js rompa
  // la escala categórica. Ahora se adapta orgánicamente a la longitud del dataset.
  scales: {
    x: { ticks: { color: '#9ca3af', maxTicksLimit: 8 }, grid: { color: 'rgba(75, 85, 99, 0.2)' }, title: { display: true, text: 't (s)', color: '#9ca3af', font: { size: 10 } } },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
  }, elements: { point: { radius: 0, hoverRadius: 4 }, line: { borderWidth: 2.5, tension: 0.3 } }
})

function buildCharts() {
  const { labels, sData, vData, aData } = chartDataset.value
  if (sChart) sChart.destroy()
  if (vChart) vChart.destroy()
  if (aChart) aChart.destroy()

  if (!sChartCanvas.value || !vChartCanvas.value || !aChartCanvas.value) return

  sChart = new Chart(sChartCanvas.value.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'x(t)', data: sData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: true }] }, options: baseChartOptions('Posición'), plugins: [makeCursorPlugin('#34d399')] })
  vChart = new Chart(vChartCanvas.value.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'v(t)', data: vData, borderColor: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.15)', fill: true }] }, options: baseChartOptions('Velocidad'), plugins: [makeCursorPlugin('#fde047')] })
  aChart = new Chart(aChartCanvas.value.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'a(t)', data: aData, borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.15)', fill: true }] }, options: baseChartOptions('Aceleración'), plugins: [makeCursorPlugin('#93c5fd')] })
}

function updateChartsData() {
  const { labels, sData, vData, aData } = chartDataset.value
  if (sChart) { sChart.data.labels = labels; sChart.data.datasets[0].data = sData; sChart.update('none') }
  if (vChart) { vChart.data.labels = labels; vChart.data.datasets[0].data = vData; vChart.update('none') }
  if (aChart) { aChart.data.labels = labels; aChart.data.datasets[0].data = aData; aChart.update('none') }
}

function refreshCursorOnly() {
  // .update('none') evita parpadeos y mueve el dot de la partícula fluidamente
  if (sChart) sChart.update('none')
  if (vChart) vChart.update('none')
  if (aChart) aChart.update('none')
}

function updateExpandedChart() {
  if (expandedChart.value && expandedChartInstance) {
    const { labels, sData, vData, aData } = chartDataset.value
    let data
    if (expandedChart.value === 'position') data = sData
    else if (expandedChart.value === 'velocity') data = vData
    else if (expandedChart.value === 'acceleration') data = aData
    
    if (data) {
      expandedChartInstance.data.labels = labels
      expandedChartInstance.data.datasets[0].data = data
      expandedChartInstance.update('none')
    }
  }
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
  refreshCursorOnly()
  updateExpandedChart()
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
    setTimeout(() => { shakeError.value = false }, 450)
  })
}

function fmt(value) {
  if (typeof value !== 'number' || !isFinite(value)) return '---'
  return value.toFixed(2)
}

let resizeObserver = null

onMounted(() => {
  parameters.value = { A: 2, omega: 3, gamma: 0.2 }
  forceCalculate()

  resizeObserver = new ResizeObserver(() => {
    sChart?.resize()
    vChart?.resize()
    aChart?.resize()
  })
  if (sChartCanvas.value?.parentElement) resizeObserver.observe(sChartCanvas.value.parentElement)
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (sChart) sChart.destroy()
  if (vChart) vChart.destroy()
  if (aChart) aChart.destroy()
  if (expandedChartInstance) expandedChartInstance.destroy()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="flex flex-col gap-0">
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- COLUMNA IZQUIERDA -->
      <section class="lg:col-span-4 flex flex-col gap-6">
        <!-- Panel de entrada de ecuación -->
        <div class="bg-gray-900 border rounded-xl p-5 shadow-md transition-colors duration-300" :class="errorMessage ? 'border-red-700/70' : isValidating ? 'border-yellow-600/60' : 'border-emerald-700/60'">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-semibold uppercase tracking-wider text-emerald-400">Ecuación de posición x(t)</label>
            <span class="flex items-center gap-1 text-[10px] font-medium">
              <template v-if="isValidating"><span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span><span class="text-yellow-400">Escribiendo…</span></template>
              <template v-else-if="errorMessage"><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="text-red-400">Inválida</span></template>
              <template v-else><span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]"></span><span class="text-emerald-400">Válida</span></template>
            </span>
          </div>

          <div class="relative">
            <input
              ref="equationInputRef" v-model="equationInput" type="text" spellcheck="false" autocomplete="off"
              @click="captureCursor" @keyup="captureCursor" @focus="captureCursor"
              class="w-full bg-gray-950 border rounded-lg pl-3 pr-9 py-2.5 text-sm font-mono outline-none transition-all duration-200"
              :class="[errorMessage ? 'border-red-600 focus:ring-2 focus:ring-red-500/50' : 'border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40', shakeError ? 'animate-shake' : '']"
              placeholder="Ej: A*sin(omega*t)+offset"
            />
          </div>

          <!-- Vista previa LaTeX Principal -->
          <div class="mt-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-3 min-h-[3.25rem] flex items-center justify-center overflow-x-auto">
            <div v-if="livePreviewHtml" class="katex-display-custom text-emerald-300" v-html="livePreviewHtml"></div>
            <span v-else class="text-xs text-gray-600 italic">La fórmula aparecerá aquí…</span>
          </div>
          <p v-if="errorMessage" class="mt-2 text-xs text-red-400 font-medium flex items-start gap-1"><span>⚠</span><span>{{ errorMessage }}</span></p>

          <!-- Botones Calcular y Teclado -->
          <div class="mt-3 flex gap-2">
            <button @click="forceCalculate" class="flex-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide py-1.5 rounded-lg border border-emerald-600 bg-emerald-700/20 text-emerald-300 hover:bg-emerald-700/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Calcular
            </button>
            <button @click="toggleKeyboard" class="flex-1 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide py-1.5 rounded-lg border transition-colors duration-150" :class="isKeyboardOpen ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'">
              {{ isKeyboardOpen ? 'Ocultar teclado' : 'Mostrar teclado' }}
            </button>
          </div>

          <!-- Teclado virtual -->
          <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2 max-h-0" enter-to-class="opacity-100 translate-y-0 max-h-[34rem]" leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 max-h-[34rem]" leave-to-class="opacity-0 max-h-0">
            <div v-if="isKeyboardOpen" class="mt-3 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-hidden">
              <div class="flex gap-1 mb-2">
                <button v-for="tab in keyboardTabs" :key="tab.id" type="button" @click="activeKeyboardTab = tab.id" class="flex-1 text-xs font-mono py-1 rounded-md transition-colors duration-150" :class="activeKeyboardTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">{{ tab.label }}</button>
              </div>
              <div class="grid gap-1.5" :class="activeKeyboardTab === 'basic' ? 'grid-cols-5' : activeKeyboardTab === 'functions' ? 'grid-cols-4' : activeKeyboardTab === 'params' ? 'grid-cols-4' : 'grid-cols-5'">
                <button v-for="(key, idx) in currentKeys" :key="idx" type="button" @mousedown.prevent="pressKey(key)" class="font-mono text-sm py-2 rounded-md border transition-all duration-100 active:scale-95" :class="key.action === 'clear' ? 'bg-red-900/40 border-red-800 text-red-300 hover:bg-red-800/50' : key.action === 'backspace' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300 hover:bg-yellow-800/40' : key.action === 'openParams' ? 'bg-blue-900/30 border-blue-800 text-blue-300 hover:bg-blue-800/40' : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white'">
                  {{ key.display }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Ejemplos -->
          <div class="mt-4">
            <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Ejemplos rápidos</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="preset in presetEquations" :key="preset.label" @click="applyPreset(preset)" type="button" class="text-[11px] px-2.5 py-1 rounded-full border border-gray-700 bg-gray-800/60 text-gray-300 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white transition-colors duration-150">
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Previsualización de derivadas truncada y Botón Ver Ecuaciones -->
          <div class="mt-4 border-t border-gray-800 pt-3 flex flex-col gap-2">
            <div class="flex gap-2 text-[10px] text-gray-500 mb-1">
              <span class="flex-1 truncate">v(t) = derivada de x(t)</span>
              <span class="flex-1 truncate">a(t) = derivada de v(t)</span>
            </div>
            <button 
              @click="showEquationsModal = true"
              class="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg border border-emerald-600 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" /></svg>
              Ver Ecuaciones Completas (x, v, a)
            </button>
          </div>
        </div>

        <!-- Panel de parámetros -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-md">
          <button @click="showParametersPanel = !showParametersPanel" class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>⚙️ Parámetros</span>
            <span class="text-gray-500 text-[10px] normal-case tracking-normal">{{ showParametersPanel ? 'Ocultar ▾' : 'Mostrar ▴' }}</span>
          </button>
          <div v-show="showParametersPanel" class="mt-3 space-y-3">
            <div v-for="(value, name) in parameters" :key="name" class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg p-2">
              <span class="text-xs font-mono text-emerald-300 w-8">{{ name }}</span>
              <input type="range" :min="-20" :max="20" :step="0.1" :value="value" @input="updateParameter(name, Number($event.target.value))" class="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              <input type="number" :value="value" @input="updateParameter(name, Number($event.target.value))" step="0.1" class="w-16 bg-gray-950 border border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none" />
              <button @click="removeParameter(name)" class="text-red-400 hover:text-red-300 text-sm font-bold">×</button>
            </div>
            <div class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg p-2">
              <input v-model="parameterInputName" placeholder="Nombre" class="flex-1 bg-transparent border border-gray-700 rounded-md px-2 py-1 text-xs font-mono text-gray-200 focus:border-emerald-500 outline-none" @keydown.enter="addParameter" />
              <input v-model.number="parameterInputValue" type="number" step="0.1" class="w-16 bg-transparent border border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-300 focus:border-emerald-500 outline-none" @keydown.enter="addParameter" />
              <button @click="addParameter" class="px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-700 rounded hover:bg-emerald-900/30">+</button>
            </div>
          </div>
        </div>

        <!-- Control de tiempo -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-md">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tiempo de simulación</label>
            <div class="flex items-center gap-2">
              <label class="text-[10px] text-gray-500">T. máx (s):</label>
              <input type="number" v-model.number="T_MAX" min="1" step="1" class="w-12 bg-gray-950 border border-gray-700 rounded-md px-1 py-0.5 text-xs font-mono text-emerald-300 outline-none text-center" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input v-model.number="time" type="range" :min="0" :max="T_MAX" :step="T_STEP" class="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            
            <button @click="togglePlay" class="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors" :class="isPlaying ? 'bg-yellow-700 border-yellow-600 text-white hover:bg-yellow-600' : 'bg-emerald-700 border-emerald-500 text-white hover:bg-emerald-600'" title="Reproducir/Pausar">
              {{ isPlaying ? '⏸' : '▶' }}
            </button>

            <!-- NUEVO: Botón de Bucle -->
            <button @click="isLooping = !isLooping" class="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors" :class="isLooping ? 'bg-indigo-700 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'" title="Activar/Desactivar Bucle">
              🔁
            </button>

          </div>
          <div class="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>0 s</span>
            <span class="text-sm font-mono text-emerald-300 font-bold">t = {{ fmt(time) }} s</span>
            <span>{{ T_MAX }} s</span>
          </div>
        </div>

        <!-- Tarjetas de resultados -->
        <div class="grid grid-cols-1 gap-4">
          <div class="bg-gray-900 border border-emerald-800/60 rounded-xl p-4 shadow-md relative overflow-hidden">
            <span class="absolute top-0 right-0 h-full w-1 bg-emerald-500"></span><p class="text-[11px] uppercase tracking-wider text-gray-400">Posición x(t)</p>
            <p class="text-2xl font-bold text-emerald-400 font-mono">{{ fmt(positionValue) }} <span class="text-sm text-gray-500">m</span></p>
          </div>
          <div class="bg-gray-900 border border-yellow-800/60 rounded-xl p-4 shadow-md relative overflow-hidden">
            <span class="absolute top-0 right-0 h-full w-1 bg-yellow-400"></span><p class="text-[11px] uppercase tracking-wider text-gray-400">Velocidad v(t)</p>
            <p class="text-2xl font-bold text-yellow-300 font-mono">{{ fmt(velocityValue) }} <span class="text-sm text-gray-500">m/s</span></p>
          </div>
          <div class="bg-gray-900 border border-blue-800/60 rounded-xl p-4 shadow-md relative overflow-hidden">
            <span class="absolute top-0 right-0 h-full w-1 bg-blue-400"></span><p class="text-[11px] uppercase tracking-wider text-gray-400">Aceleración a(t)</p>
            <p class="text-2xl font-bold text-blue-300 font-mono">{{ fmt(accelerationValue) }} <span class="text-sm text-gray-500">m/s²</span></p>
          </div>
        </div>
      </section>

      <!-- COLUMNA DERECHA -->
      <section class="lg:col-span-8 flex flex-col gap-6">
        <!-- Pista 1D -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-md">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pista de simulación 1D</h2>
            <span class="text-[11px] font-mono text-gray-400">x = {{ fmt(positionValue) }} m</span>
          </div>
          <div class="relative h-32 w-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
            <div class="absolute bottom-8 left-0 right-0 border-t border-gray-700"></div>
            <div class="absolute bottom-6 left-0 right-0 flex justify-between px-2 text-[9px] text-gray-500">
              <span>{{ fmt(trackMinX) }}</span><span>{{ fmt((trackMinX + trackMaxX) / 2) }}</span><span>{{ fmt(trackMaxX) }}</span>
            </div>
            <div class="absolute top-1/2 flex flex-col items-center transition-all duration-75 ease-linear" :style="{ left: particleLeftPercent + '%', transform: 'translate(-50%, -50%)' }">
              <div class="flex items-center gap-2 mb-1 bg-gray-950/80 border border-emerald-600 rounded-md px-2 py-0.5 shadow-lg">
                <span class="text-[10px] font-mono text-emerald-300">x = {{ fmt(positionValue) }}</span>
              </div>
              <span class="w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_16px_4px_rgba(16,185,129,0.6)] border-2 border-emerald-200"></span>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-md">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Gráficos cinemáticos</h2>
            <span class="text-[10px] text-gray-500 font-mono">cursor en t = {{ fmt(time) }} s</span>
          </div>

          <div class="grid grid-cols-1 gap-5">
            <!-- Gráfico Posición -->
            <div class="bg-gray-950 border border-gray-800 rounded-lg p-3 flex flex-col">
              <div class="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                <span class="text-xs font-semibold text-emerald-400">Posición x(t) [m]</span>
                <button @click="openExpandedChart('position')" class="text-[10px] font-bold uppercase tracking-wide text-emerald-400 border border-emerald-800 bg-emerald-900/30 px-3 py-1 rounded hover:bg-emerald-800 hover:text-white transition-colors">
                  🔍 Ampliar Gráfica
                </button>
              </div>
              <div class="h-48 relative"><canvas ref="sChartCanvas"></canvas></div>
            </div>
            <!-- Gráfico Velocidad -->
            <div class="bg-gray-950 border border-gray-800 rounded-lg p-3 flex flex-col">
              <div class="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                <span class="text-xs font-semibold text-yellow-400">Velocidad v(t) [m/s]</span>
                <button @click="openExpandedChart('velocity')" class="text-[10px] font-bold uppercase tracking-wide text-yellow-400 border border-yellow-800 bg-yellow-900/30 px-3 py-1 rounded hover:bg-yellow-800 hover:text-white transition-colors">
                  🔍 Ampliar Gráfica
                </button>
              </div>
              <div class="h-48 relative"><canvas ref="vChartCanvas"></canvas></div>
            </div>
            <!-- Gráfico Aceleración -->
            <div class="bg-gray-950 border border-gray-800 rounded-lg p-3 flex flex-col">
              <div class="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                <span class="text-xs font-semibold text-blue-400">Aceleración a(t) [m/s²]</span>
                <button @click="openExpandedChart('acceleration')" class="text-[10px] font-bold uppercase tracking-wide text-blue-400 border border-blue-800 bg-blue-900/30 px-3 py-1 rounded hover:bg-blue-800 hover:text-white transition-colors">
                  🔍 Ampliar Gráfica
                </button>
              </div>
              <div class="h-48 relative"><canvas ref="aChartCanvas"></canvas></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal Ecuaciones Completas -->
    <Teleport to="body">
      <div v-if="showEquationsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm p-4" @click.self="showEquationsModal = false">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl p-6 flex flex-col overflow-y-auto max-h-[95vh]">
          <div class="flex items-center justify-between mb-6 border-b border-gray-800 pb-3">
            <h3 class="text-lg font-bold text-emerald-400 uppercase tracking-wider">
              Desarrollo Analítico de Ecuaciones
            </h3>
            <button @click="showEquationsModal = false" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-900/50 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div class="space-y-6">
            <div class="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-800/50 pb-2">Posición (Ecuación Base)</p>
              <div v-if="latexPosition" class="text-xl text-emerald-300 flex justify-center py-4" v-html="latexPosition"></div>
              <p v-else class="text-center text-red-400 text-sm">Fórmula inválida</p>
            </div>

            <div class="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-800/50 pb-2">Velocidad (Primera Derivada)</p>
              <div v-if="latexVelocity" class="text-xl text-yellow-300 flex justify-center py-4" v-html="latexVelocity"></div>
              <p v-else class="text-center text-red-400 text-sm">Fórmula inválida</p>
            </div>

            <div class="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <p class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide border-b border-gray-800/50 pb-2">Aceleración (Segunda Derivada)</p>
              <div v-if="latexAcceleration" class="text-xl text-blue-300 flex justify-center py-4" v-html="latexAcceleration"></div>
              <p v-else class="text-center text-red-400 text-sm">Fórmula inválida</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal para gráfico expandido -->
    <Teleport to="body">
      <div v-if="expandedChart" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm p-4" @click.self="closeExpandedChart">
        <div class="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] p-4 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              {{ expandedChart === 'position' ? 'Posición x(t)' : expandedChart === 'velocity' ? 'Velocidad v(t)' : 'Aceleración a(t)' }}
            </h3>
            <button @click="closeExpandedChart" class="text-gray-400 hover:text-white bg-gray-800 rounded-full p-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-2 min-h-[400px]">
            <canvas ref="expandedCanvasRef" class="w-full h-full"></canvas>
          </div>
        </div>
      </div>
    </Teleport>

    <footer class="border-t border-gray-800 py-4 text-center text-[11px] text-gray-600">
      ESPE © {{ new Date().getFullYear() }} — Simulador Cinemático de Partícula 1D — Departamento de Ciencias Exactas
    </footer>
  </div>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #10b981;
  border: 2px solid #d1fae5;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}
input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #10b981;
  border: 2px solid #d1fae5;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both;
}

.katex-display-custom :deep(.katex) {
  color: inherit;
  font-size: 1.05em;
}
.katex-display-custom :deep(.katex-display) {
  margin: 0;
}
</style>