<script setup>
// src/components/physics/PhysicsDataPanel.vue
//
// Ahora es un CAJÓN flotante anclado dentro del propio entorno de
// simulación (antes vivía como una sección aparte debajo del canvas,
// obligando a salir de la escena para ver los datos).
// Colapsado por defecto para no tapar la simulación; una pestaña lo abre.
import { ref } from 'vue'

const props = defineProps({
  boxes: { type: Array, required: true }, // entradas reactivas kind === 'box'
  ropes: { type: Array, required: true } // cuerdas, resortes y poleas
})

const isOpen = ref(false)

const JOINT_ICON = { rope: '🪢', spring: '🌀', pulley: '🎡' }
const JOINT_LABEL = { rope: 'Cuerda', spring: 'Resorte', pulley: 'Polea' }

function labelFor(id, boxes) {
  return boxes.find((b) => b.id === id)?.label || (id?.startsWith('anchor') ? 'Anclaje' : id)
}

function fmt(n, decimals = 2) {
  if (!isFinite(n)) return '—'
  return Number(n).toFixed(decimals)
}
</script>

<template>
  <div class="pointer-events-auto w-full max-w-2xl bg-gray-950/95 backdrop-blur border border-gray-800 rounded-xl shadow-xl overflow-hidden">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:bg-gray-900/60 transition-colors"
    >
      <span>📊 Datos en vivo</span>
      <span class="text-gray-500 text-[10px] normal-case tracking-normal">{{ isOpen ? 'Ocultar ▾' : 'Mostrar ▴' }}</span>
    </button>

    <div v-show="isOpen" class="px-4 pb-4 max-h-64 overflow-y-auto">
    <p v-if="!boxes.length" class="text-[11px] text-gray-500 italic">
      Añade una caja para ver sus datos físicos en tiempo real.
    </p>

    <div v-else class="space-y-3">
      <div
        v-for="b in boxes"
        :key="b.id"
        class="bg-gray-950 border border-gray-800 rounded-lg p-3"
      >
        <p class="text-xs font-semibold mb-2" :style="{ color: b.color }">{{ b.label }}</p>

        <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
          <span class="text-gray-500">Posición x</span>
          <span class="text-gray-200 text-right">{{ fmt(b.position.x) }} m</span>

          <span class="text-gray-500">Posición y</span>
          <span class="text-gray-200 text-right">{{ fmt(b.position.y) }} m</span>

          <span class="text-gray-500">Ángulo</span>
          <span class="text-gray-200 text-right">{{ fmt(b.angleRad * 180 / Math.PI, 1) }}°</span>

          <span class="text-red-400">Peso (P = mg)</span>
          <span class="text-red-300 text-right">{{ fmt(b.weightForce) }} N</span>

          <span class="text-blue-400">Fuerza Normal (N)</span>
          <span class="text-blue-300 text-right">{{ fmt(b.normalForce) }} N</span>

          <template v-if="b.appliedForce?.enabled">
            <span class="text-orange-400">Fuerza aplicada</span>
            <span class="text-orange-300 text-right">{{ fmt(b.appliedForce.magnitude) }} N · {{ fmt(b.appliedForce.angleDeg, 0) }}°</span>
          </template>
        </div>
      </div>

      <div v-if="ropes.length" class="bg-gray-950 border border-yellow-900/40 rounded-lg p-3">
        <p class="text-xs font-semibold text-yellow-400 mb-2">Uniones (cuerdas, resortes, poleas)</p>
        <div
          v-for="j in ropes"
          :key="j.id"
          class="flex items-center justify-between text-[11px] font-mono py-0.5"
        >
          <span class="text-gray-500">
            {{ JOINT_ICON[j.kind] }} {{ labelFor(j.bodyAId, boxes) }} ↔ {{ labelFor(j.bodyBId, boxes) }}
            <span class="text-gray-600">({{ JOINT_LABEL[j.kind] }}<template v-if="j.kind === 'spring'"> · k~{{ fmt(j.frequencyHz, 1) }}Hz</template>)</span>
          </span>
          <span class="text-yellow-300">T = {{ fmt(j.tension) }} N</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
