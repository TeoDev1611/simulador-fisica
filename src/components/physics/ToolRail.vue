<script setup>
// src/components/physics/ToolRail.vue
// Caja de herramientas FLOTANTE dentro del entorno de simulación.
// Rail responsivo con navegación táctil, botones de scroll móvil e icono de Fijador.

import { ref, onMounted } from 'vue'
import {
  MousePointer2,
  Hand,
  Box,
  Anchor,
  Ruler,
  Link,
  Spline,
  Disc,
  CircleDashed,
  ArrowUpToLine,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

defineProps({
  activeTool: { type: String, required: true }
})

const emit = defineEmits(['select-tool'])

const railRef = ref(null)

const tools = [
  { id: 'drag', label: 'Seleccionar Objeto', icon: MousePointer2 },
  { id: 'pan', label: 'Mover Cámara', icon: Hand },
  { id: 'box', label: 'Crear Objeto / Multiforma', icon: Box },
  { id: 'anchor', label: 'Fijador / Anclaje', icon: Anchor },
  { id: 'ground', label: 'Dibujar Suelo', icon: Ruler },
  { id: 'rope', label: 'Cuerda', icon: Link },
  { id: 'spring', label: 'Resorte', icon: Spline },
  { id: 'pulley', label: 'Polea', icon: Disc },
  { id: 'circular', label: 'Anillo en Riel', icon: CircleDashed },
  { id: 'force', label: 'Fuerza / Impulso', icon: ArrowUpToLine },
  { id: 'delete', label: 'Borrar', icon: Trash2 }
]

function scrollRail(direction) {
  if (!railRef.value) return
  const amount = direction === 'left' ? -120 : 120
  railRef.value.scrollBy({ left: amount, behavior: 'smooth' })
}
</script>

<template>
  <div class="pointer-events-auto relative flex items-center group/rail">
    <!-- Botón Scroll Izquierda (Móvil) -->
    <button
      type="button"
      @click="scrollRail('left')"
      class="md:hidden flex items-center justify-center w-6 h-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-r-0 border-gray-300 dark:border-gray-800 rounded-l-xl text-gray-600 dark:text-gray-300 shadow-md active:scale-95 z-10"
      aria-label="Desplazar herramientas a la izquierda"
    >
      <ChevronLeft class="w-4 h-4" />
    </button>

    <!-- Contenedor del Rail con Scroll Suave -->
    <div
      ref="railRef"
      class="flex flex-row md:flex-col gap-2 md:gap-3 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-gray-300 dark:border-gray-800 rounded-2xl md:rounded-2xl p-2 md:p-3 shadow-md dark:shadow-xl overflow-x-auto md:overflow-x-visible md:overflow-y-visible max-w-[calc(100vw-80px)] md:max-w-none md:max-h-[calc(100vh-120px)] scroll-smooth custom-scrollbar"
    >
      <div class="group relative flex-shrink-0" v-for="t in tools" :key="t.id">
        <button
          type="button"
          @click="emit('select-tool', t.id)"
          class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-lg border transition-all duration-150 active:scale-95"
          :class="
            activeTool === t.id
              ? 'bg-emerald-400 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-400 text-gray-950 dark:text-white font-bold shadow-md shadow-emerald-500/20'
              : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-700'
          "
        >
          <component :is="t.icon" class="w-5 h-5" />
        </button>

        <!-- Tooltip (Escritorio) -->
        <span
          class="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 whitespace-nowrap text-[11px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 shadow-xl border border-gray-700 dark:border-gray-300"
        >
          {{ t.label }}
        </span>
      </div>
    </div>

    <!-- Botón Scroll Derecha (Móvil) -->
    <button
      type="button"
      @click="scrollRail('right')"
      class="md:hidden flex items-center justify-center w-6 h-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-l-0 border-gray-300 dark:border-gray-800 rounded-r-xl text-gray-600 dark:text-gray-300 shadow-md active:scale-95 z-10"
      aria-label="Desplazar herramientas a la derecha"
    >
      <ChevronRight class="w-4 h-4" />
    </button>
  </div>
</template>
