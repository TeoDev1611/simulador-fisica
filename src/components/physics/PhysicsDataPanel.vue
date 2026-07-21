<script setup>
// src/components/physics/PhysicsDataPanel.vue
//
// Ahora es un CAJÓN flotante anclado dentro del propio entorno de
// simulación (antes vivía como una sección aparte debajo del canvas,
// obligando a salir de la escena para ver los datos).
// Colapsado por defecto para no tapar la simulación; una pestaña lo abre.
import { ref } from 'vue'
import { BarChart2, Link, Spline, CircleDashed } from 'lucide-vue-next'

const props = defineProps({
  boxes: { type: Array, required: true }, // entradas reactivas kind === 'box'
  ropes: { type: Array, required: true } // cuerdas, resortes y poleas
})

const isOpen = ref(false)

const JOINT_ICON = { rope: Link, spring: Spline, pulley: CircleDashed }
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
  <div
    class="pointer-events-auto w-72 sm:w-80 bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] shadow-lg dark:shadow-2xl overflow-hidden relative transition-all duration-300"
  >
    <div
      class="absolute inset-0 bg-gradient-to-tr from-gray-100/40 dark:from-gray-900/40 to-transparent pointer-events-none"
    ></div>
    <div class="relative z-10">
      <button
        type="button"
        @click="isOpen = !isOpen"
        class="w-full flex items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 hover:bg-gray-200/50 dark:bg-gray-800/50 transition-colors"
      >
        <span class="drop-shadow-md flex items-center gap-2"><BarChart2 class="w-4 h-4" /> DATOS EN VIVO</span>
        <span class="text-gray-600 dark:text-gray-400 text-[10px] normal-case tracking-normal">{{
          isOpen ? 'Ocultar ▾' : 'Mostrar ▴'
        }}</span>
      </button>

      <div v-show="isOpen" class="px-4 pb-4 max-h-64 overflow-y-auto">
        <p v-if="!boxes.length" class="text-[11px] text-gray-600 dark:text-gray-500 italic">
          Añade una caja para ver sus datos físicos en tiempo real.
        </p>

        <div v-else class="space-y-3">
          <div
            v-for="b in boxes"
            :key="b.id"
            class="bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-3"
          >
            <p class="text-xs font-semibold mb-2" :style="{ color: b.color }">{{ b.label }}</p>

            <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
              <span class="text-gray-600 dark:text-gray-500">Posición x</span>
              <span class="text-gray-800 dark:text-gray-200 text-right">{{ fmt(b.position.x) }} m</span>

              <span class="text-gray-600 dark:text-gray-500">Posición y</span>
              <span class="text-gray-800 dark:text-gray-200 text-right">{{ fmt(b.position.y) }} m</span>

              <span class="text-gray-600 dark:text-gray-500">Ángulo</span>
              <span class="text-gray-800 dark:text-gray-200 text-right"
                >{{ fmt((b.angleRad * 180) / Math.PI, 1) }}°</span
              >

              <span class="text-red-700 dark:text-red-400">Peso (P = mg)</span>
              <span class="text-red-700 dark:text-red-300 text-right">{{ fmt(b.weightForce) }} N</span>

              <span class="text-blue-700 dark:text-blue-400">Fuerza Normal (N)</span>
              <span class="text-blue-700 dark:text-blue-300 text-right">{{ fmt(b.normalForce) }} N</span>

              <template v-if="b.appliedForce?.enabled">
                <span class="text-orange-400">Fuerza aplicada</span>
                <span class="text-orange-300 text-right"
                  >{{ fmt(b.appliedForce.magnitude) }} N · {{ fmt(b.appliedForce.angleDeg, 0) }}°</span
                >
              </template>

              <!-- CINEMÁTICA -->
              <span class="text-purple-600 dark:text-purple-400 mt-1">Velocidad |v|</span>
              <span class="text-purple-600 dark:text-purple-300 text-right mt-1" title="v_x, v_y"
                >{{ fmt(b.velocity?.magnitude) }} m/s</span
              >

              <span class="text-fuchsia-600 dark:text-fuchsia-400">Aceleración |a|</span>
              <span class="text-fuchsia-600 dark:text-fuchsia-300 text-right" title="a_x, a_y"
                >{{ fmt(b.acceleration?.magnitude) }} m/s²</span
              >

              <template v-if="b.acceleration?.radial !== 0 || b.acceleration?.transverse !== 0">
                <span
                  class="text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded"
                  >Acel. Radial (a_r)</span
                >
                <span
                  class="text-yellow-700 dark:text-yellow-300 text-right font-bold bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded"
                  >{{ fmt(b.acceleration?.radial) }} m/s²</span
                >

                <span
                  class="text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded"
                  >Acel. Transversal (a_θ)</span
                >
                <span
                  class="text-yellow-700 dark:text-yellow-300 text-right font-bold bg-yellow-100/50 dark:bg-yellow-900/30 px-1 rounded"
                  >{{ fmt(b.acceleration?.transverse) }} m/s²</span
                >
              </template>
            </div>
          </div>

          <div
            v-if="ropes.length"
            class="bg-gray-50 dark:bg-gray-950 border border-yellow-300/40 dark:border-yellow-900/40 rounded-lg p-3"
          >
            <p class="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
              Uniones (cuerdas, resortes, poleas)
            </p>
            <div v-for="j in ropes" :key="j.id" class="flex items-center justify-between text-[11px] font-mono py-0.5">
              <span class="text-gray-600 dark:text-gray-500 flex items-center gap-1.5">
                <component :is="JOINT_ICON[j.kind]" class="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {{ labelFor(j.bodyAId, boxes) }} ↔ {{ labelFor(j.bodyBId, boxes) }}
                <span class="text-gray-600"
                  >({{ JOINT_LABEL[j.kind]
                  }}<template v-if="j.kind === 'spring'"> · k~{{ fmt(j.frequencyHz, 1) }}Hz</template>)</span
                >
              </span>
              <span class="text-yellow-700 dark:text-yellow-300">T = {{ fmt(j.tension) }} N</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
