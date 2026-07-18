<script setup>
import { computed } from 'vue'

const props = defineProps({
  positionValue: { type: Number, required: true },
  trackMinX: { type: Number, required: true },
  trackMaxX: { type: Number, required: true }
})

const particleLeftPercent = computed(() => {
  const min = props.trackMinX
  const max = props.trackMaxX
  const range = max - min || 1
  let pct = ((props.positionValue - min) / range) * 100
  if (!isFinite(pct)) pct = 50
  pct = Math.max(2, Math.min(98, pct))
  return pct
})

function fmt(value) {
  if (typeof value !== 'number' || !isFinite(value)) return '---'
  return value.toFixed(2)
}
</script>

<template>
  <div
    class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-6 shadow-lg dark:shadow-2xl relative overflow-hidden transition-all duration-300"
  >
    <div class="flex items-center justify-between mb-4 relative z-10">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        Pista de simulación 1D
      </h2>
      <span class="text-[11px] font-mono text-gray-600 dark:text-gray-400">x = {{ fmt(positionValue) }} m</span>
    </div>

    <div
      class="relative h-40 w-full bg-white/80 dark:bg-gray-950/80 rounded-2xl border border-gray-300/60 dark:border-gray-700/60 shadow-inner overflow-hidden flex items-center"
    >
      <!-- Grid de fondo (puntos) -->
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CgkJPGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIC8+Cgk8L3N2Zz4=')] opacity-50 pointer-events-none"
      ></div>

      <!-- Riel brillante central -->
      <div class="absolute left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-800/30 dark:via-emerald-500/30 to-transparent pointer-events-none"
        ></div>
      </div>

      <!-- Etiquetas del Eje X -->
      <div
        class="absolute bottom-3 left-0 right-0 flex justify-between px-6 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-bold tracking-wider pointer-events-none"
      >
        <span>{{ fmt(trackMinX) }}</span>
        <span>{{ fmt((trackMinX + trackMaxX) / 2) }}</span>
        <span>{{ fmt(trackMaxX) }}</span>
      </div>

      <!-- Partícula y Tooltip -->
      <div
        class="absolute z-10 flex flex-col items-center transition-all duration-75 ease-linear"
        :style="{ left: particleLeftPercent + '%', transform: 'translateX(-50%)' }"
      >
        <!-- Tooltip flotante superior -->
        <div
          class="absolute -top-14 flex items-center justify-center bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md border border-emerald-800/50 dark:border-emerald-500/50 rounded-lg px-3 py-1 shadow-[0_5px_15px_rgba(16,185,129,0.3)] pointer-events-none"
        >
          <span class="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300"
            >x = {{ fmt(positionValue) }}</span
          >
          <!-- Flechita del tooltip -->
          <div
            class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-100 dark:bg-gray-900 border-b border-r border-emerald-800/50 dark:border-emerald-500/50 rotate-45"
          ></div>
        </div>

        <!-- Esfera (Partícula) -->
        <div class="relative flex items-center justify-center">
          <span
            class="absolute w-12 h-12 bg-emerald-800/30 dark:bg-emerald-500/30 rounded-full blur-md animate-pulse pointer-events-none"
          ></span>
          <span
            class="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-200 via-emerald-800 dark:via-emerald-500 to-emerald-200 dark:to-emerald-800 shadow-[0_0_20px_rgba(16,185,129,0.8)] border border-white/50"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>
