<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  chartDataset: { type: Object, required: true },
  time: { type: Number, required: true }
})

const sChartCanvas = ref(null)
const vChartCanvas = ref(null)
const aChartCanvas = ref(null)

let sChart = null
let vChart = null
let aChart = null

const expandedChart = ref(null)
const expandedCanvasRef = ref(null)
let expandedChartInstance = null
let resizeObserver = null

function fmt(value) {
  if (typeof value !== 'number' || !isFinite(value)) return '---'
  return value.toFixed(2)
}

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

function exportChart(type) {
  let chart = null
  let name = ''
  if (type === 'position') { chart = sChart; name = 'posicion_xt' }
  else if (type === 'velocity') { chart = vChart; name = 'velocidad_vt' }
  else if (type === 'acceleration') { chart = aChart; name = 'aceleracion_at' }
  else if (type === 'expanded') { chart = expandedChartInstance; name = `grafica_ampliada` }

  if (!chart) return
  
  // Guardamos el color original del canvas (transparente) y pintamos fondo
  const ctx = chart.canvas.getContext('2d')
  ctx.save()
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#030712' : '#f9fafb'
  ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height)
  
  const url = chart.canvas.toDataURL('image/png')
  ctx.restore()
  // Restaurar forzando redibujado (para quitar el fondo que acabamos de pintar y volver a transparente)
  chart.update('none')

  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.png`
  a.click()
}

function buildExpandedChart() {
  if (!expandedCanvasRef.value) return
  const ctx = expandedCanvasRef.value.getContext('2d')
  const { labels, sData, vData, aData } = props.chartDataset
  let data, color, label, title

  if (expandedChart.value === 'position') {
    data = sData
    color = '#10b981'
    label = 'x(t)'
    title = 'Posición x(t) [m]'
  } else if (expandedChart.value === 'velocity') {
    data = vData
    color = '#facc15'
    label = 'v(t)'
    title = 'Velocidad v(t) [m/s]'
  } else if (expandedChart.value === 'acceleration') {
    data = aData
    color = '#60a5fa'
    label = 'a(t)'
    title = 'Aceleración a(t) [m/s²]'
  } else return

  if (expandedChartInstance) expandedChartInstance.destroy()

  expandedChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: color + '33',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#e5e7eb', font: { size: 16, weight: '600' } },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#34d399',
          bodyColor: '#f3f4f6',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: { title: (items) => `t = ${items[0].label} s` }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9ca3af', maxTicksLimit: 10 },
          grid: { color: 'rgba(75, 85, 99, 0.2)' },
          title: { display: true, text: 't (s)', color: '#9ca3af', font: { size: 12 } }
        },
        y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
      }
    },
    plugins: [makeCursorPlugin(color)]
  })
}

function currentTimeIndex(labels) {
  if (!labels || labels.length === 0) return -1
  const target = props.time
  let closestIdx = 0,
    closestDiff = Infinity
  for (let i = 0; i < labels.length; i++) {
    const diff = Math.abs(parseFloat(labels[i]) - target)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIdx = i
    }
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
      ctx.beginPath()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.shadowColor = dotColor
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#0a0a0a'
      ctx.stroke()
      ctx.restore()
    }
  }
}

const baseChartOptions = (titleText) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250, easing: 'easeOutQuad' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      titleColor: '#34d399',
      bodyColor: '#f3f4f6',
      borderColor: '#374151',
      borderWidth: 1,
      callbacks: { title: (items) => `t = ${items[0].label} s` }
    }
  },
  scales: {
    x: {
      ticks: { color: '#9ca3af', maxTicksLimit: 8 },
      grid: { color: 'rgba(75, 85, 99, 0.2)' },
      title: { display: true, text: 't (s)', color: '#9ca3af', font: { size: 10 } }
    },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } }
  },
  elements: { point: { radius: 0, hoverRadius: 4 }, line: { borderWidth: 2.5, tension: 0.3 } }
})

function buildCharts() {
  const { labels, sData, vData, aData } = props.chartDataset
  if (sChart) sChart.destroy()
  if (vChart) vChart.destroy()
  if (aChart) aChart.destroy()

  if (!sChartCanvas.value || !vChartCanvas.value || !aChartCanvas.value) return

  sChart = new Chart(sChartCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'x(t)', data: sData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: true }
      ]
    },
    options: baseChartOptions('Posición'),
    plugins: [makeCursorPlugin('#34d399')]
  })
  vChart = new Chart(vChartCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'v(t)', data: vData, borderColor: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.15)', fill: true }
      ]
    },
    options: baseChartOptions('Velocidad'),
    plugins: [makeCursorPlugin('#fde047')]
  })
  aChart = new Chart(aChartCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'a(t)', data: aData, borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.15)', fill: true }
      ]
    },
    options: baseChartOptions('Aceleración'),
    plugins: [makeCursorPlugin('#93c5fd')]
  })
}

function updateChartsData() {
  const { labels, sData, vData, aData } = props.chartDataset
  if (sChart) {
    sChart.data.labels = labels
    sChart.data.datasets[0].data = sData
    sChart.update('none')
  }
  if (vChart) {
    vChart.data.labels = labels
    vChart.data.datasets[0].data = vData
    vChart.update('none')
  }
  if (aChart) {
    aChart.data.labels = labels
    aChart.data.datasets[0].data = aData
    aChart.update('none')
  }
}

function refreshCursorOnly() {
  if (sChart) sChart.update('none')
  if (vChart) vChart.update('none')
  if (aChart) aChart.update('none')
}

function updateExpandedChart() {
  if (expandedChart.value && expandedChartInstance) {
    const { labels, sData, vData, aData } = props.chartDataset
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

watch(
  () => props.chartDataset,
  () => {
    if (sChart && vChart && aChart) {
      updateChartsData()
      updateExpandedChart()
    } else {
      nextTick(buildCharts)
    }
  },
  { deep: true }
)

watch(
  () => props.time,
  () => {
    refreshCursorOnly()
    updateExpandedChart()
  }
)

onMounted(() => {
  buildCharts()
  resizeObserver = new ResizeObserver(() => {
    sChart?.resize()
    vChart?.resize()
    aChart?.resize()
  })
  if (sChartCanvas.value?.parentElement) resizeObserver.observe(sChartCanvas.value.parentElement)
})

onBeforeUnmount(() => {
  if (sChart) sChart.destroy()
  if (vChart) vChart.destroy()
  if (aChart) aChart.destroy()
  if (expandedChartInstance) expandedChartInstance.destroy()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl p-5 shadow-md">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        Gráficos cinemáticos
      </h2>
      <span class="text-[10px] text-gray-600 dark:text-gray-500 font-mono">cursor en t = {{ fmt(time) }} s</span>
    </div>

    <div class="grid grid-cols-1 gap-5">
      <!-- Gráfico Posición -->
      <div class="bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-3 flex flex-col">
        <div class="flex justify-between items-center mb-2 border-b border-gray-300 dark:border-gray-800 pb-2">
          <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Posición x(t) [m]</span>
          <div class="flex gap-2">
            <button
              @click="exportChart('position')"
              class="text-[10px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Descargar Gráfica (PNG)"
            >
              💾
            </button>
            <button
              @click="openExpandedChart('position')"
              class="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-300/30 dark:bg-emerald-900/30 px-3 py-1 rounded hover:bg-emerald-200 dark:bg-emerald-800 hover:text-gray-900 dark:text-white transition-colors"
            >
              🔍 Ampliar Gráfica
            </button>
          </div>
        </div>
        <div class="h-48 relative"><canvas ref="sChartCanvas"></canvas></div>
      </div>
      <!-- Gráfico Velocidad -->
      <div class="bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-3 flex flex-col">
        <div class="flex justify-between items-center mb-2 border-b border-gray-300 dark:border-gray-800 pb-2">
          <span class="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Velocidad v(t) [m/s]</span>
          <div class="flex gap-2">
            <button
              @click="exportChart('velocity')"
              class="text-[10px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Descargar Gráfica (PNG)"
            >
              💾
            </button>
            <button
              @click="openExpandedChart('velocity')"
              class="text-[10px] font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 bg-yellow-300/30 dark:bg-yellow-900/30 px-3 py-1 rounded hover:bg-yellow-200 dark:bg-yellow-800 hover:text-gray-900 dark:text-white transition-colors"
            >
              🔍 Ampliar Gráfica
            </button>
          </div>
        </div>
        <div class="h-48 relative"><canvas ref="vChartCanvas"></canvas></div>
      </div>
      <!-- Gráfico Aceleración -->
      <div class="bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-3 flex flex-col">
        <div class="flex justify-between items-center mb-2 border-b border-gray-300 dark:border-gray-800 pb-2">
          <span class="text-xs font-semibold text-blue-700 dark:text-blue-400">Aceleración a(t) [m/s²]</span>
          <div class="flex gap-2">
            <button
              @click="exportChart('acceleration')"
              class="text-[10px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Descargar Gráfica (PNG)"
            >
              💾
            </button>
            <button
              @click="openExpandedChart('acceleration')"
              class="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-300/30 dark:bg-blue-900/30 px-3 py-1 rounded hover:bg-blue-200 dark:bg-blue-800 hover:text-gray-900 dark:text-white transition-colors"
            >
              🔍 Ampliar Gráfica
            </button>
          </div>
        </div>
        <div class="h-48 relative"><canvas ref="aChartCanvas"></canvas></div>
      </div>
    </div>
  </div>

  <!-- Modal para gráfico expandido -->
  <Teleport to="body">
    <div
      v-if="expandedChart"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm p-4"
      @click.self="closeExpandedChart"
    >
      <div
        class="bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl shadow-lg dark:shadow-2xl w-full max-w-5xl max-h-[90vh] p-4 flex flex-col"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            {{
              expandedChart === 'position'
                ? 'Posición x(t)'
                : expandedChart === 'velocity'
                  ? 'Velocidad v(t)'
                  : 'Aceleración a(t)'
            }}
          </h3>
          <div class="flex gap-2">
            <button
              @click="exportChart('expanded')"
              class="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1"
            >
              💾 Descargar PNG
            </button>
            <button
              @click="closeExpandedChart"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 rounded-full p-1.5 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div
          class="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-2 min-h-[400px]"
        >
          <canvas ref="expandedCanvasRef" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>
  </Teleport>
</template>
