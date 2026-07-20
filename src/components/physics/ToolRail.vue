<script setup>
// src/components/physics/ToolRail.vue
//
// Caja de herramientas FLOTANTE dentro del entorno de simulación.
// Antes vivía en un sidebar aparte (PhysicsControls.vue); ahora es parte
// visual del propio lienzo, como en Figma/Excalidraw: un rail de iconos
// que no compite por espacio con la escena.

defineProps({
  activeTool: { type: String, required: true }
})
import { MousePointer2, Box, Ruler, Link, Spline, Disc, CircleDashed, ArrowUpToLine, Trash2 } from 'lucide-vue-next'

const emit = defineEmits(['select-tool'])

const tools = [
  { id: 'drag', label: 'Mover / Seleccionar', icon: MousePointer2 },
  { id: 'box', label: 'Crear caja', icon: Box },
  { id: 'ground', label: 'Dibujar suelo', icon: Ruler },
  { id: 'rope', label: 'Cuerda', icon: Link },
  { id: 'spring', label: 'Resorte', icon: Spline },
  { id: 'pulley', label: 'Polea', icon: Disc },
  { id: 'circular', label: 'Riel circular', icon: CircleDashed },
  { id: 'force', label: 'Fuerza / Impulso', icon: ArrowUpToLine },
  { id: 'delete', label: 'Borrar', icon: Trash2 }
]
</script>

<template>
  <div
    class="pointer-events-auto flex flex-row md:flex-col gap-2 md:gap-3 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-gray-300 dark:border-gray-800 rounded-2xl p-2 md:p-3 shadow-md dark:shadow-xl"
  >
    <div class="group relative" v-for="t in tools" :key="t.id">
      <button
        type="button"
        @click="emit('select-tool', t.id)"
        class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border transition-colors duration-150"
        :class="
          activeTool === t.id
            ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
            : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-800 hover:border-gray-300 dark:border-gray-700'
        "
      >
        <component :is="t.icon" class="w-5 h-5" />
      </button>
      <!-- Tooltip: oculto en móviles (no hay hover), a la derecha en escritorio -->
      <span
        class="hidden md:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-[11px] font-semibold bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-30 shadow-lg"
      >
        {{ t.label }}
      </span>
    </div>
  </div>
</template>
