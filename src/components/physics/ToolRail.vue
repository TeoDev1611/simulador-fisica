<script setup>
// src/components/physics/ToolRail.vue
// Caja de herramientas FLOTANTE dentro del entorno de simulación.
// Rail responsivo con navegación táctil, botones de scroll móvil e icono de Fijador.

import { ref, computed } from 'vue'
import {
  MousePointer2,
  Hand,
  Box,
  Anchor,
  Compass,
  CircleDot,
  Ruler,
  Link,
  Spline,
  Disc,
  CircleDashed,
  ArrowUpToLine,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Settings
} from 'lucide-vue-next'

const props = defineProps({
  activeTool: { type: String, required: true }
})

const emit = defineEmits(['select-tool', 'open-settings'])

const railRef = ref(null)

const toolGroups = [
  {
    id: 'drag',
    icon: MousePointer2,
    label: 'Seleccionar (V, 1)',
    tools: [{ id: 'drag', label: 'Seleccionar (V, 1)', icon: MousePointer2 }]
  },
  { id: 'pan', icon: Hand, label: 'Mover Cámara (H)', tools: [{ id: 'pan', label: 'Mover Cámara (H)', icon: Hand }] },
  {
    id: 'box',
    icon: Box,
    label: 'Crear Objeto (B, 2)',
    tools: [{ id: 'box', label: 'Crear Objeto (B, 2)', icon: Box }]
  },
  {
    id: 'ground',
    icon: Ruler,
    label: 'Dibujar Suelo (G, 3)',
    tools: [{ id: 'ground', label: 'Dibujar Suelo (G, 3)', icon: Ruler }]
  },
  {
    id: 'physics',
    icon: Spline,
    label: 'Físicas y Conexiones',
    tools: [
      { id: 'spring', label: 'Resorte (R, 5)', icon: Spline },
      { id: 'rope', label: 'Cuerda (C, 4)', icon: Link },
      { id: 'pulley', label: 'Polea (P, 6)', icon: Disc },
      { id: 'force', label: 'Fuerza (F, 8)', icon: ArrowUpToLine }
    ]
  },
  {
    id: 'constraints',
    icon: Anchor,
    label: 'Restricciones y Apoyos',
    tools: [
      { id: 'anchor', label: 'Fijador (A)', icon: Anchor },
      { id: 'rollers', label: 'Rodillos (O)', icon: CircleDot },
      { id: 'circular', label: 'Riel Circular (T, 7)', icon: CircleDashed }
    ]
  },
  {
    id: 'measure',
    icon: Compass,
    label: 'Medición (M)',
    tools: [{ id: 'measure', label: 'Medición (M)', icon: Compass }]
  },
  {
    id: 'delete',
    icon: Trash2,
    label: 'Borrar (Del, 9)',
    tools: [{ id: 'delete', label: 'Borrar (Del, 9)', icon: Trash2 }]
  }
]

const activeGroup = computed(() => {
  return toolGroups.find((g) => g.tools.some((t) => t.id === props.activeTool))?.id || 'general'
})

const hoveredGroup = ref(null)
const clickedGroup = ref(null)

let hoverTimeout = null

function onMouseEnterGroup(id) {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  hoveredGroup.value = id
}

function onMouseLeaveGroup() {
  hoverTimeout = setTimeout(() => {
    hoveredGroup.value = null
    clickedGroup.value = null
  }, 250)
}

function onMouseLeaveRail() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  hoveredGroup.value = null
}

function handleGroupClick(g) {
  if (g.tools.length > 1) {
    clickedGroup.value = clickedGroup.value === g.id ? null : g.id
  } else {
    emit('select-tool', g.tools[0].id)
    clickedGroup.value = null
  }
}

function scrollRail(direction) {
  if (!railRef.value) return
  const amount = direction === 'left' ? -120 : 120
  railRef.value.scrollBy({ left: amount, behavior: 'smooth' })
}
</script>

<template>
  <div class="pointer-events-auto relative flex flex-col md:flex-row items-end md:items-start md:gap-3 group/rail">
    <!-- Botón Scroll Izquierda (Móvil) -->
    <button
      type="button"
      @click="scrollRail('left')"
      class="md:hidden flex items-center justify-center w-6 h-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-r-0 border-gray-300 dark:border-gray-800 rounded-l-xl text-gray-600 dark:text-gray-300 shadow-md active:scale-95 z-10"
      aria-label="Desplazar herramientas a la izquierda"
    >
      <ChevronLeft class="w-4 h-4" />
    </button>

    <div
      ref="railRef"
      class="flex flex-row md:flex-col gap-1.5 bg-white/95 dark:bg-gray-950/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-xl max-w-[calc(100vw-80px)] md:max-w-none md:max-h-[70vh] scroll-smooth custom-scrollbar z-20"
      @mouseleave="onMouseLeaveRail"
    >
      <div
        class="group relative flex-shrink-0"
        v-for="g in toolGroups"
        :key="g.id"
        @mouseenter="onMouseEnterGroup(g.id)"
        @mouseleave="onMouseLeaveGroup"
      >
        <button
          type="button"
          @click="handleGroupClick(g)"
          class="w-10 h-10 flex flex-col items-center justify-center rounded-xl md:rounded-lg border transition-all duration-150 relative"
          :class="
            activeGroup === g.id
              ? 'bg-emerald-100 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-700'
          "
        >
          <component :is="g.tools.find((t) => t.id === activeTool)?.icon || g.icon" class="w-5 h-5 mb-0.5" />
          <div v-if="g.tools.length > 1" class="w-3 h-1 flex justify-between absolute bottom-1">
            <span class="w-[3px] h-[3px] rounded-full bg-current opacity-50" v-for="i in 3" :key="i"></span>
          </div>
        </button>

        <!-- Sub-Toolbar (solo si tiene más de 1 herramienta) -->
        <div
          v-if="g.tools.length > 1 && (hoveredGroup === g.id || clickedGroup === g.id)"
          class="absolute bottom-full right-0 md:bottom-auto md:right-auto md:left-full md:-top-2 md:translate-x-4 md:translate-y-0 mb-3 md:mb-0 bg-white/95 dark:bg-gray-950/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-xl flex flex-row md:flex-col gap-1.5 transition-all duration-300 origin-bottom-right md:origin-left z-[100] w-max"
        >
          <div v-for="t in g.tools" :key="t.id" class="group/sub relative flex-shrink-0">
            <button
              type="button"
              @click.stop="
                emit('select-tool', t.id)
                hoveredGroup = null
                clickedGroup = null
              "
              class="w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-95"
              :class="
                activeTool === t.id
                  ? 'bg-emerald-100 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-700'
              "
            >
              <component :is="t.icon" class="w-4 h-4" />
            </button>
            <span
              class="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 whitespace-nowrap text-[11px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2.5 py-1 rounded-md opacity-0 group-hover/sub:opacity-100 transition-opacity duration-150 z-[110] shadow-xl border border-gray-700 dark:border-gray-300"
            >
              {{ t.label }}
            </span>
          </div>
        </div>

        <!-- Tooltip (Escritorio) -->
        <span
          v-if="g.tools.length === 1"
          class="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 whitespace-nowrap text-[11px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 shadow-xl border border-gray-700 dark:border-gray-300"
        >
          {{ g.label }}
        </span>
      </div>

      <!-- Divider -->
      <div class="w-px md:w-full h-full md:h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

      <!-- Botón Settings -->
      <div class="group relative flex-shrink-0">
        <button
          type="button"
          @click="emit('open-settings')"
          class="w-10 h-10 flex items-center justify-center rounded-xl md:rounded-lg border transition-all duration-150 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-700"
        >
          <Settings class="w-5 h-5" />
        </button>
        <span
          class="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 whitespace-nowrap text-[11px] font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 shadow-xl border border-gray-700 dark:border-gray-300"
        >
          Ajustes
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
