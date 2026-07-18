<script setup>
// src/components/physics/ContextPanel.vue
//
// Reemplaza los 4 paneles siempre-visibles de la vieja PhysicsControls.vue.
// Ahora solo se muestra UN panel: el que corresponde a la herramienta activa.
// Menos ruido, y coherente con "estoy usando la herramienta X ahora mismo".
import { ref, watch } from 'vue'

const props = defineProps({
  activeTool: { type: String, required: true },
  groundFriction: { type: Number, required: true },
  springFreq: { type: Number, required: true },
  springDamping: { type: Number, required: true },
  selectedBox: { type: Object, default: null }, // caja objetivo explícito (o null)
  ropesCount: { type: Number, default: 0 }
})

const emit = defineEmits([
  'update-box-mass', 'update-ground-friction',
  'update-spring-preset', 'update-spring-stiffness',
  'update-force', 'apply-impulse'
])

const springPresets = [
  { label: 'Suave', freq: 1.0 },
  { label: 'Media', freq: 2.5 },
  { label: 'Rígida', freq: 5.0 }
]
const forcePresets = [
  { label: '→ 0°', angle: 0 },
  { label: '↑ 90°', angle: 90 },
  { label: '← 180°', angle: 180 },
  { label: '↓ 270°', angle: 270 }
]
const magnitudePresets = [5, 10, 20, 40]

// Estado local del formulario de fuerza. Se resetea cuando cambia la caja
// seleccionada para evitar aplicar por error los valores de la caja anterior,
// y se sincroniza con lo que ya tenga aplicado la caja (si algo tenía).
const forceMagnitude = ref(10)
const forceAngle = ref(0)

watch(() => props.selectedBox?.id, () => {
  const f = props.selectedBox?.appliedForce
  if (f && f.magnitude) {
    forceMagnitude.value = f.magnitude
    forceAngle.value = f.angleDeg
  }
})

function applyForceNow(enabled) {
  if (!props.selectedBox) return
  emit('update-force', { magnitude: forceMagnitude.value, angleDeg: forceAngle.value, enabled })
}
</script>

<template>
  <div class="pointer-events-auto w-64 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-xl p-4 shadow-xl">

    <!-- Herramienta: Mover/Seleccionar → si hay caja seleccionada, ajustar su masa aquí mismo -->
    <template v-if="activeTool === 'drag'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Caja seleccionada</h3>
      <template v-if="selectedBox">
        <p class="text-sm font-mono font-bold mb-3" :style="{ color: selectedBox.color }">● {{ selectedBox.label }}</p>
        <label class="text-[11px] text-gray-400 flex justify-between mb-1">
          <span>Masa (kg)</span>
          <span class="font-mono text-emerald-300">{{ selectedBox.mass.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0.1" max="15" step="0.1"
          :value="selectedBox.mass"
          @input="emit('update-box-mass', selectedBox.id, Number($event.target.value))"
          class="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </template>
      <p v-else class="text-[11px] text-gray-500 italic">
        Haz clic en una caja del lienzo para seleccionarla y ajustar su masa.
      </p>
    </template>

    <!-- Herramienta: Dibujar suelo -->
    <template v-else-if="activeTool === 'ground'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Terreno</h3>
      <p class="text-[11px] text-gray-400 mb-3">Arrastra sobre el lienzo para trazar el terreno donde quieras.</p>
      <label class="text-[11px] text-gray-400 flex justify-between mb-1">
        <span>Fricción (μ)</span>
        <span class="font-mono text-emerald-300">{{ groundFriction.toFixed(2) }}</span>
      </label>
      <input
        :value="groundFriction"
        @input="emit('update-ground-friction', Number($event.target.value))"
        type="range" min="0" max="1" step="0.05"
        class="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </template>

    <!-- Herramienta: Resorte -->
    <template v-else-if="activeTool === 'spring'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">Resorte — constante k</h3>
      <p class="text-[11px] text-gray-400 mb-3">
        Arrastra de una caja a otra caja, o suelta en el vacío para anclarlo a un
        <span class="text-yellow-300 font-semibold">punto fijo</span> ("Fijo").
      </p>
      <div class="grid grid-cols-3 gap-2 mb-3">
        <button
          v-for="p in springPresets" :key="p.label"
          @click="emit('update-spring-preset', p.freq)"
          class="text-[11px] font-semibold py-2 rounded-lg border transition-colors"
          :class="Math.abs(springFreq - p.freq) < 0.01
            ? 'bg-purple-700 border-purple-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'"
        >
          {{ p.label }}<br /><span class="font-mono text-[10px] opacity-70">{{ p.freq }} Hz</span>
        </button>
      </div>
      <label class="text-[11px] text-gray-400 flex justify-between mb-1">
        <span>k (frecuencia, Hz)</span>
        <span class="font-mono text-purple-300">{{ springFreq.toFixed(2) }}</span>
      </label>
      <input
        :value="springFreq"
        @input="emit('update-spring-preset', Number($event.target.value))"
        type="range" min="0.1" max="8" step="0.1"
        class="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-3"
      />
      <label class="text-[11px] text-gray-400 flex justify-between mb-1">
        <span>Amortiguamiento</span>
        <span class="font-mono text-purple-300">{{ springDamping.toFixed(2) }}</span>
      </label>
      <input
        :value="springDamping"
        @input="emit('update-spring-stiffness', Number($event.target.value))"
        type="range" min="0" max="1" step="0.05"
        class="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      <p v-if="ropesCount" class="mt-2 text-[10px] text-gray-500 italic">
        Los cambios también afectan a los resortes que ya existen en la escena.
      </p>
    </template>

    <!-- Herramienta: Cuerda / Polea -->
    <template v-else-if="activeTool === 'rope' || activeTool === 'pulley'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
        {{ activeTool === 'rope' ? 'Cuerda' : 'Polea' }}
      </h3>
      <p class="text-[11px] text-gray-400 mb-2">
        Arrastra desde una caja hasta otra caja, o suelta en el vacío para crear un
        <span class="text-yellow-300 font-semibold">punto fijo</span> ahí mismo (marcado como "Fijo").
      </p>
      <p v-if="activeTool === 'pulley'" class="text-[11px] text-gray-500 italic border-t border-gray-800 pt-2">
        Con 1 sola caja: arrastra desde la caja hasta donde quieras "colgarla"
        (por ejemplo el techo). Ese punto se convierte en la rueda de la polea —
        la altura de la rueda queda exactamente donde soltaste el clic.
      </p>
    </template>

    <!-- Herramienta: Fuerza — el corazón de la corrección: objetivo SIEMPRE explícito -->
    <template v-else-if="activeTool === 'force'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">Fuerza aplicada</h3>

      <div v-if="!selectedBox" class="text-[11px] text-gray-400 bg-gray-900 border border-dashed border-gray-700 rounded-lg p-3 text-center">
        Haz clic sobre una caja en el lienzo para elegirla como objetivo.
      </div>

      <template v-else>
        <p class="text-[11px] text-gray-400 mb-3">
          Aplicando a:
          <span class="font-mono font-bold" :style="{ color: selectedBox.color }">● {{ selectedBox.label }}</span>
        </p>

        <div class="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
          <div>
            <label class="text-[11px] text-gray-400 block mb-1">Magnitud (N)</label>
            <input v-model.number="forceMagnitude" type="number" min="0" step="0.5"
              class="w-full bg-gray-950 border border-gray-700 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-orange-500" />
          </div>
          <div>
            <label class="text-[11px] text-gray-400 block mb-1">Ángulo (°)</label>
            <input v-model.number="forceAngle" type="number" step="1"
              class="w-full bg-gray-950 border border-gray-700 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-orange-500" />
          </div>
        </div>

        <div class="grid grid-cols-4 gap-1.5 mb-1.5">
          <button v-for="m in magnitudePresets" :key="m" @click="forceMagnitude = m"
            class="text-[10px] font-mono py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700">
            {{ m }}N
          </button>
        </div>
        <div class="grid grid-cols-4 gap-1.5 mb-3">
          <button v-for="p in forcePresets" :key="p.angle" @click="forceAngle = p.angle"
            class="text-[10px] font-mono py-1.5 rounded-md border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700">
            {{ p.label }}
          </button>
        </div>

        <p class="text-[10px] text-gray-500 italic mb-2">
          O arrastra directamente sobre {{ selectedBox.label }} en el lienzo — verás un
          transportador tenue (0°/90°/180°/270°) para guiar la dirección.
        </p>

        <div class="flex gap-2">
          <button type="button" @click="applyForceNow(true)"
            class="flex-1 text-xs font-semibold uppercase tracking-wide py-2 rounded-lg border border-orange-600 bg-orange-700/30 text-orange-200 hover:bg-orange-700/60 transition-colors">
            ▶ Activar continua
          </button>
          <button type="button" @click="applyForceNow(false)"
            class="text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
            ⏹ Detener
          </button>
        </div>
        <button type="button" @click="emit('apply-impulse', { magnitude: forceMagnitude, angleDeg: forceAngle })"
          class="w-full mt-2 text-xs font-semibold uppercase tracking-wide py-2 rounded-lg border border-amber-700 bg-amber-900/20 text-amber-200 hover:bg-amber-800/40 transition-colors">
          ⚡ Aplicar impulso único
        </button>
      </template>
    </template>

    <!-- Herramienta: Crear caja -->
    <template v-else-if="activeTool === 'box'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Crear caja</h3>
      <p class="text-[11px] text-gray-400">Haz clic en cualquier punto del lienzo para soltar una caja nueva de 2 kg.</p>
    </template>

    <!-- Herramienta: Borrar -->
    <template v-else-if="activeTool === 'delete'">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Borrar</h3>
      <p class="text-[11px] text-gray-400">Haz clic sobre una caja para eliminarla junto con sus cuerdas/resortes.</p>
    </template>
  </div>
</template>