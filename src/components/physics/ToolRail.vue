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

const emit = defineEmits(['select-tool'])

const tools = [
  { id: 'drag', label: 'Mover / Seleccionar', icon: '✋' },
  { id: 'box', label: 'Crear caja', icon: '📦' },
  { id: 'ground', label: 'Dibujar suelo', icon: '✏️' },
  { id: 'rope', label: 'Cuerda', icon: '🪢' },
  { id: 'spring', label: 'Resorte', icon: '〰️' },
  { id: 'pulley', label: 'Polea', icon: '⚙️' },
  { id: 'force', label: 'Fuerza / Impulso', icon: '➤' },
  { id: 'delete', label: 'Borrar', icon: '🗑️' }
]
</script>

<template>
  <div
    class="pointer-events-auto flex flex-col gap-1 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-xl p-1.5 shadow-xl"
  >
    <div class="group relative" v-for="t in tools" :key="t.id">
      <button
        type="button"
        @click="emit('select-tool', t.id)"
        class="w-10 h-10 flex items-center justify-center rounded-lg border text-lg transition-colors duration-150"
        :class="activeTool === t.id
          ? 'bg-emerald-700 border-emerald-500 text-white'
          : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'"
      >
        {{ t.icon }}
      </button>
      <!-- Tooltip: aparece a la derecha del rail, no empuja el layout -->
      <span
        class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap
               text-[11px] font-semibold bg-gray-900 border border-gray-700 text-gray-100 px-2 py-1 rounded-md
               opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-30 shadow-lg"
      >
        {{ t.label }}
      </span>
    </div>
  </div>
</template>
