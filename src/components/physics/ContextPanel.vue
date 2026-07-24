<script setup>
// src/components/physics/ContextPanel.vue
//
// Reemplaza los 4 paneles siempre-visibles de la vieja PhysicsControls.vue.
// Ahora solo se muestra UN panel: el que corresponde a la herramienta activa.
// Menos ruido, y coherente con "estoy usando la herramienta X ahora mismo".
import { ref, watch } from 'vue'
import { Eye, EyeOff, Sparkles, CircleDot, Compass } from 'lucide-vue-next'
import { SHAPE_PRESETS } from '../../utils/shapeUtils.js'
import ShapeSvgPreview from './ShapeSvgPreview.vue'
import { formatValue, getUnitLabel } from '../../utils/measurementUtils.js'

const isCollapsed = ref(false)

const props = defineProps({
  activeTool: { type: String, required: true },
  groundFriction: { type: Number, required: true },
  groundMode: { type: String, default: 'free' }, // 'free' | 'straight'
  groundAngleDeg: { type: Number, default: 0 },
  groundLiveInfo: { type: Object, default: null }, // { angleDeg, length } mientras se arrastra
  springFreq: { type: Number, required: true },
  springDamping: { type: Number, required: true },
  selectedBox: { type: Object, default: null }, // caja objetivo explícito (o null)
  selectedGround: { type: Object, default: null }, // trozo de suelo seleccionado con "drag"
  groundCount: { type: Number, default: 0 }, // cuántos trozos de suelo existen ya
  ropes: { type: Array, default: () => [] },
  pendingPulley: { type: Boolean, default: false }, // true = ya se definió la rueda, falta el 2º cable
  ropesCount: { type: Number, default: 0 },
  nextBoxShape: { type: String, default: 'box' },
  nextBoxVertices: { type: Array, default: () => null },
  nextBoxMass: { type: Number, default: 2.0 },
  nextBoxWidth: { type: Number, default: 1.0 },
  nextBoxHeight: { type: Number, default: 1.0 },
  nextBoxFriction: { type: Number, default: 0.3 },
  nextBoxVx: { type: Number, default: 0 },
  nextBoxVy: { type: Number, default: 0 },
  unitSystem: { type: String, default: 'metric' },
  canvasTheme: { type: String, default: 'colorful' }
})

const emit = defineEmits([
  'open-shape-editor',
  'update-next-box-shape',
  'update-next-box-config',
  'update-box-mass',
  'update-box-friction',
  'update-box-restitution',
  'toggle-box-rollers',
  'update-box-angle',
  'update-box-velocity',
  'update-box-dimensions',
  'update-track-radius',
  'set-applied-force',
  'update-ground-friction',
  'update-selected-ground-friction',
  'update-ground-restitution',
  'update-ground-mode',
  'update-ground-angle',
  'update-spring-preset',
  'update-spring-stiffness',
  'apply-impulse',
  'update-unit-system',
  'update-canvas-theme',
  'clear-measurements',
  'update-force'
])

// Ángulos típicos de problemas de plano inclinado (con su reflejo negativo
// disponible desde el botón ± junto al campo numérico).
const anglePresets = [0, 15, 30, 37, 45, 53, 60, 90]

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

watch(
  () => props.selectedBox?.id,
  () => {
    const f = props.selectedBox?.appliedForce
    if (f && f.magnitude) {
      forceMagnitude.value = f.magnitude
      forceAngle.value = f.angleDeg
    }
  }
)

function applyForceNow(enabled) {
  if (!props.selectedBox) return
  emit('update-force', { magnitude: forceMagnitude.value, angleDeg: forceAngle.value, enabled })
}
</script>

<template>
  <div
    class="pointer-events-auto bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border border-gray-300/60 dark:border-gray-800/60 shadow-lg relative transition-all duration-300"
    :class="[
      isCollapsed
        ? 'w-10 h-10 rounded-full flex items-center justify-center p-0'
        : 'w-64 rounded-[2rem] p-5 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] overflow-hidden dark:shadow-2xl'
    ]"
  >
    <!-- Botón de toggle -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="absolute z-50 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      :class="
        isCollapsed
          ? 'inset-0 w-full h-full flex items-center justify-center bg-transparent'
          : 'p-1.5 top-3 right-3 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700'
      "
      :title="isCollapsed ? 'Mostrar propiedades' : 'Ocultar propiedades'"
    >
      <Eye v-if="isCollapsed" class="w-5 h-5" />
      <EyeOff v-else class="w-4 h-4" />
    </button>

    <div
      v-show="!isCollapsed"
      class="absolute inset-0 bg-gradient-to-bl from-emerald-300/10 dark:from-emerald-900/10 to-transparent pointer-events-none"
    ></div>
    <div v-show="!isCollapsed" class="relative z-10 mt-1">
      <!-- Selector Global de Sistema de Unidades -->
      <div class="flex items-center justify-between p-2 mb-2 bg-gray-200/60 dark:bg-gray-800/60 rounded-xl border border-gray-300/40 dark:border-gray-700/40">
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Unidades</span>
        <div class="flex gap-1">
          <button
            type="button"
            @click="emit('update-unit-system', 'metric')"
            class="px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all"
            :class="unitSystem === 'metric' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            SI (m, kg)
          </button>
          <button
            type="button"
            @click="emit('update-unit-system', 'imperial')"
            class="px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all"
            :class="unitSystem === 'imperial' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            Inglés (ft, lb)
          </button>
        </div>
      </div>

      <!-- Selector Global de Tema del Lienzo -->
      <div class="flex items-center justify-between p-2 mb-3 bg-gray-200/60 dark:bg-gray-800/60 rounded-xl border border-gray-300/40 dark:border-gray-700/40">
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Estilo</span>
        <div class="flex gap-1">
          <button
            type="button"
            @click="emit('update-canvas-theme', 'colorful')"
            class="px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all"
            :class="canvasTheme === 'colorful' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            Color 🌈
          </button>
          <button
            type="button"
            @click="emit('update-canvas-theme', 'latex')"
            class="px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all"
            :class="canvasTheme === 'latex' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            LaTeX 📐
          </button>
        </div>
      </div>

      <!-- Herramienta: Mover/Seleccionar → si hay caja seleccionada, ajustar su masa;
         si hay un trozo de SUELO seleccionado, ajustar su fricción individual -->
      <template v-if="activeTool === 'drag'">
        <template v-if="selectedBox">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            Caja seleccionada
          </h3>
          <p class="text-sm font-mono font-bold mb-3" :style="{ color: selectedBox.color }">
            ● {{ selectedBox.label }}
          </p>
          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
            <span>Masa (kg)</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ selectedBox.mass.toFixed(1) }}</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0.1"
              max="15"
              step="0.1"
              :value="selectedBox.mass"
              @input="emit('update-box-mass', selectedBox.id, Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0.1"
              step="0.1"
              :value="selectedBox.mass"
              @input="emit('update-box-mass', selectedBox.id, Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>

          <template v-if="ropes.some((r) => r.kind === 'track' && r.bodyAId === selectedBox.id)">
            <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
              <span>Radio del Riel (m)</span>
              <span class="font-mono text-emerald-700 dark:text-emerald-300">{{
                (ropes.find((r) => r.kind === 'track' && r.bodyAId === selectedBox.id)?.radius || 0).toFixed(3)
              }}</span>
            </label>
            <div class="flex gap-2 mb-3">
              <input
                type="range"
                min="0.05"
                max="5"
                step="0.01"
                :value="ropes.find((r) => r.kind === 'track' && r.bodyAId === selectedBox.id)?.radius || 0.1"
                @input="
                  emit(
                    'update-track-radius',
                    ropes.find((r) => r.kind === 'track' && r.bodyAId === selectedBox.id).id,
                    Number($event.target.value)
                  )
                "
                class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <input
                type="number"
                min="0.05"
                step="0.01"
                :value="(ropes.find((r) => r.kind === 'track' && r.bodyAId === selectedBox.id)?.radius || 0).toFixed(3)"
                @input="
                  emit(
                    'update-track-radius',
                    ropes.find((r) => r.kind === 'track' && r.bodyAId === selectedBox.id).id,
                    Number($event.target.value)
                  )
                "
                class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
              />
            </div>
          </template>

          <div class="flex items-center justify-between mt-3 mb-1">
            <label class="text-[11px] font-bold text-gray-700 dark:text-gray-300">Forma Geométrica</label>
            <button
              type="button"
              @click="emit('open-shape-editor')"
              class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Sparkles class="w-3 h-3" />
              Editor Multiforma...
            </button>
          </div>
          <div
            class="grid grid-cols-4 gap-1.5 bg-gray-200 dark:bg-gray-800/80 p-1.5 rounded-xl max-h-36 overflow-y-auto"
          >
            <button
              v-for="s in SHAPE_PRESETS"
              :key="s.id"
              @click="
                emit('update-box-dimensions', selectedBox.id, selectedBox.width, selectedBox.height, s.shape, s.verts)
              "
              class="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold transition-all"
              :class="
                selectedBox.shape === s.shape &&
                (!s.verts || JSON.stringify(selectedBox.vertices) === JSON.stringify(s.verts))
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              "
              :title="s.description"
            >
              <ShapeSvgPreview
                :shape="s.shape"
                :verts="s.verts"
                :color="
                  selectedBox.shape === s.shape &&
                  (!s.verts || JSON.stringify(selectedBox.vertices) === JSON.stringify(s.verts))
                    ? '#10b981'
                    : '#64748b'
                "
                :size="24"
              />
              <span class="truncate max-w-full text-[9px] mt-0.5">{{ s.label }}</span>
            </button>
          </div>

          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
            <span>Fricción (μ) de esta caja</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{
              (selectedBox.friction ?? 0.3).toFixed(2)
            }}</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              :value="selectedBox.friction ?? 0.3"
              @input="emit('update-box-friction', selectedBox.id, Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              step="0.05"
              :value="selectedBox.friction ?? 0.3"
              @change="emit('update-box-friction', selectedBox.id, Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>
          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
            <span>Restitución (e) de Rebote</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ (selectedBox.restitution ?? 0.1).toFixed(2) }}</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="selectedBox.restitution ?? 0.1"
              @input="emit('update-box-restitution', selectedBox.id, Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              :value="selectedBox.restitution ?? 0.1"
              @change="emit('update-box-restitution', selectedBox.id, Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>

          <div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              @click="emit('toggle-box-rollers', selectedBox.id)"
              class="w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
              :class="
                selectedBox.hasRollers
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200'
              "
            >
              <CircleDot class="w-4 h-4" />
              <span>{{ selectedBox.hasRollers ? 'Rodillos Activos (Fricción 0)' : 'Añadir Rodillos / Apoyo' }}</span>
            </button>
          </div>

          <p class="mt-1 text-[10px] text-gray-600 dark:text-gray-500 italic">
            Fricción de la caja consigo misma contra lo que toque (suelo, otra caja). El coeficiente efectivo en el
            contacto combina el de ambas superficies.
          </p>

          <label
            class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-4 border-t border-gray-300 dark:border-gray-800 pt-3"
          >
            <span>Ángulo (°)</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300"
              >{{ ((selectedBox.angleRad * 180) / Math.PI).toFixed(0) }}°</span
            >
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              :value="Math.round((selectedBox.angleRad * 180) / Math.PI)"
              @input="emit('update-box-angle', selectedBox.id, Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              step="1"
              :value="Math.round((selectedBox.angleRad * 180) / Math.PI)"
              @change="emit('update-box-angle', selectedBox.id, Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>

          <label
            class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-4 border-t border-gray-300 dark:border-gray-800 pt-3"
          >
            <span>Velocidad Actual (m/s)</span>
          </label>
          <div class="flex gap-2">
            <div class="flex-1">
              <span class="text-[9px] text-gray-500 block mb-1">Magnitud</span>
              <input
                type="number"
                step="0.1"
                :value="(selectedBox.velocity?.magnitude || 0).toFixed(1)"
                @change="
                  emit(
                    'update-box-velocity',
                    selectedBox.id,
                    Number($event.target.value),
                    selectedBox.velocityAngle || 0
                  )
                "
                class="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
              />
            </div>
            <div class="flex-1">
              <span class="text-[9px] text-gray-500 block mb-1">Ángulo (°)</span>
              <input
                type="number"
                step="1"
                :value="Math.round(selectedBox.velocityAngle || 0)"
                @change="
                  emit(
                    'update-box-velocity',
                    selectedBox.id,
                    selectedBox.velocity?.magnitude || 0,
                    Number($event.target.value)
                  )
                "
                class="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
            <span>{{
              selectedBox.shape === 'circle' || selectedBox.shape === 'ring' ? 'Diámetro (m)' : 'Ancho (m)'
            }}</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ selectedBox.width.toFixed(3) }} m</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0.05"
              max="10"
              step="0.01"
              :value="selectedBox.width"
              @input="emit('update-box-dimensions', selectedBox.id, Number($event.target.value), selectedBox.height)"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0.05"
              step="0.01"
              :value="selectedBox.width.toFixed(3)"
              @change="emit('update-box-dimensions', selectedBox.id, Number($event.target.value), selectedBox.height)"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>

          <label
            v-if="selectedBox.shape !== 'circle' && selectedBox.shape !== 'ring'"
            class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3"
          >
            <span>Alto (m)</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ selectedBox.height.toFixed(3) }} m</span>
          </label>
          <div v-if="selectedBox.shape !== 'circle' && selectedBox.shape !== 'ring'" class="flex gap-2 mb-3">
            <input
              type="range"
              min="0.05"
              max="10"
              step="0.01"
              :value="selectedBox.height"
              @input="emit('update-box-dimensions', selectedBox.id, selectedBox.width, Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0.05"
              step="0.01"
              :value="selectedBox.height.toFixed(3)"
              @change="emit('update-box-dimensions', selectedBox.id, selectedBox.width, Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>
        </template>
        <template v-else-if="selectedGround">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
            {{ selectedGround.label }} seleccionado
          </h3>
          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
            <span>Fricción (μ) de este trozo</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{
              selectedGround.friction.toFixed(2)
            }}</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="selectedGround.friction"
              @input="emit('update-selected-ground-friction', Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              :value="selectedGround.friction"
              @change="emit('update-selected-ground-friction', Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>
          <p class="mt-2 text-[10px] text-gray-600 dark:text-gray-500 italic">
            Este ajuste solo afecta a este trozo de suelo (puede haber varios con fricciones distintas, por ejemplo mesa
            lisa + piso rugoso).
          </p>
        </template>
        <p v-else class="text-[11px] text-gray-600 dark:text-gray-500 italic">
          Haz clic en una caja para ajustar su masa/fricción, en un trozo de suelo para su fricción, o arrastra un punto
          amarillo (anclaje/rueda de polea) para reposicionarlo con precisión.
        </p>
      </template>

      <!-- Herramienta: Dibujar suelo -->
      <template v-else-if="activeTool === 'ground'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
          Terreno
        </h3>
        <p class="text-[10px] text-gray-600 dark:text-gray-500 italic mb-3">
          Cada trazo AGREGA un trozo de suelo nuevo (no borra los anteriores) — así puedes dibujar, por ejemplo, una
          mesa y el piso a distinta altura para un problema de polea.
          <span v-if="groundCount" class="text-gray-600 dark:text-gray-400">Trozos actuales: {{ groundCount }}.</span>
        </p>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            @click="emit('update-ground-mode', 'free')"
            class="text-[11px] font-semibold py-2 rounded-lg border transition-colors"
            :class="
              groundMode === 'free'
                ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-700'
            "
          >
            ✏️ Libre
          </button>
          <button
            type="button"
            @click="emit('update-ground-mode', 'straight')"
            class="text-[11px] font-semibold py-2 rounded-lg border transition-colors"
            :class="
              groundMode === 'straight'
                ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-700'
            "
          >
            📐 Recto
          </button>
        </div>

        <template v-if="groundMode === 'straight'">
          <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
            Clic en el punto de inicio y arrastra: el segmento queda fijo al ángulo de abajo (la longitud sí sigue tu
            arrastre libremente).
          </p>
          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
            <span>Ángulo (°)</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ groundAngleDeg.toFixed(1) }}°</span>
          </label>
          <div class="flex gap-2 mb-2">
            <input
              :value="groundAngleDeg"
              @input="emit('update-ground-angle', Number($event.target.value))"
              type="number"
              step="1"
              class="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-emerald-800 dark:border-emerald-500"
            />
            <button
              type="button"
              title="Invertir signo"
              @click="emit('update-ground-angle', -groundAngleDeg)"
              class="px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 text-xs font-mono"
            >
              ±
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5 mb-3">
            <button
              v-for="a in anglePresets"
              :key="a"
              @click="emit('update-ground-angle', a)"
              class="text-[10px] font-mono py-1.5 rounded-md border transition-colors"
              :class="
                Math.abs(groundAngleDeg - a) < 0.01
                  ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700'
              "
            >
              {{ a }}°
            </button>
          </div>
          <p v-if="groundLiveInfo" class="text-[11px] text-gray-700 dark:text-gray-300 font-mono mb-3">
            θ = {{ groundLiveInfo.angleDeg.toFixed(1) }}° · L = {{ groundLiveInfo.length.toFixed(2) }} m
          </p>
        </template>
        <p v-else class="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
          Arrastra sobre el lienzo para trazar el terreno donde quieras.
        </p>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
          <span>Fricción (μ)</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ groundFriction.toFixed(2) }}</span>
        </label>
        <div class="flex gap-2 mb-3">
          <input
            :value="groundFriction"
            @input="emit('update-ground-friction', Number($event.target.value))"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            :value="groundFriction"
            @input="emit('update-ground-friction', Number($event.target.value))"
            type="number"
            min="0"
            max="1"
            step="0.05"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>
      </template>

      <!-- Herramienta: Resorte -->
      <template v-else-if="activeTool === 'spring'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">
          Resorte — constante k
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
          Arrastra de una caja a otra caja, o suelta en el vacío para anclarlo a un
          <span class="text-yellow-700 dark:text-yellow-300 font-semibold">punto fijo</span> ("Fijo").
        </p>
        <div class="grid grid-cols-3 gap-2 mb-3">
          <button
            v-for="p in springPresets"
            :key="p.label"
            @click="emit('update-spring-preset', p.freq)"
            class="text-[11px] font-semibold py-2 rounded-lg border transition-colors"
            :class="
              Math.abs(springFreq - p.freq) < 0.01
                ? 'bg-purple-300 dark:bg-purple-700 border-purple-800 dark:border-purple-500 text-gray-900 dark:text-white'
                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-700'
            "
          >
            {{ p.label }}<br /><span class="font-mono text-[10px] opacity-70">{{ p.freq }} Hz</span>
          </button>
        </div>
        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
          <span>k (frecuencia, Hz)</span>
          <span class="font-mono text-purple-700 dark:text-purple-300">{{ springFreq.toFixed(2) }}</span>
        </label>
        <div class="flex gap-2 mb-3">
          <input
            :value="springFreq"
            @input="emit('update-spring-preset', Number($event.target.value))"
            type="range"
            min="0.1"
            max="8"
            step="0.1"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <input
            type="number"
            min="0.1"
            max="8"
            step="0.1"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-purple-700 dark:text-purple-300 focus:border-purple-800 dark:border-purple-500 outline-none"
            @change="emit('update-spring-preset', Number($event.target.value))"
          />
        </div>
        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1">
          <span>Amortiguamiento</span>
          <span class="font-mono text-purple-700 dark:text-purple-300">{{ springDamping.toFixed(2) }}</span>
        </label>
        <div class="flex gap-2">
          <input
            :value="springDamping"
            @input="emit('update-spring-stiffness', Number($event.target.value))"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-purple-700 dark:text-purple-300 focus:border-purple-800 dark:border-purple-500 outline-none"
            @change="emit('update-spring-stiffness', Number($event.target.value))"
          />
        </div>
        <p v-if="ropesCount" class="mt-2 text-[10px] text-gray-600 dark:text-gray-500 italic">
          Los cambios también afectan a los resortes que ya existen en la escena.
        </p>
      </template>

      <!-- Herramienta: Cuerda -->
      <template v-else-if="activeTool === 'rope'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
          Cuerda
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
          Arrastra desde una caja hasta otra caja, o suelta en el vacío para crear un
          <span class="text-yellow-700 dark:text-yellow-300 font-semibold">punto fijo</span> ahí mismo (marcado como
          "Fijo").
        </p>
      </template>

      <!-- Herramienta: Polea (flujo de 2 pasos: 1er cable define la rueda, 2º la cierra) -->
      <template v-else-if="activeTool === 'pulley'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
          Polea
        </h3>

        <template v-if="!pendingPulley">
          <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
            <span class="text-emerald-700 dark:text-emerald-300 font-semibold">Paso 1:</span>
            arrastra desde la primera caja hasta el punto donde está la
            <span class="text-yellow-700 dark:text-yellow-300 font-semibold">rueda</span> de la polea (por ejemplo la
            esquina de la mesa, o el techo). Ese punto queda marcado como "Fijo".
          </p>
        </template>
        <template v-else>
          <p class="text-[11px] text-yellow-700 dark:text-yellow-300 font-semibold mb-2">
            ✓ Rueda definida. Paso 2: arrastra desde la segunda caja y suelta justo sobre ese mismo punto amarillo para
            cerrar la polea.
          </p>
        </template>

        <p
          class="text-[10px] text-gray-600 dark:text-gray-500 italic border-t border-gray-300 dark:border-gray-800 pt-2"
        >
          Las dos cajas comparten la MISMA rueda (un solo punto de giro), como una polea real — así el peso de una
          cuerda tira de la otra, ideal para el clásico "bloque en la mesa + bloque colgando".
        </p>
        <p class="text-[10px] text-gray-600 dark:text-gray-500 italic mt-1">
          ¿La rueda quedó mal ubicada? Cambia a la herramienta ✋ Mover y arrastra el punto amarillo — la polea se
          reajusta sola.
        </p>
      </template>

      <!-- Herramienta: Riel circular (collar deslizando en un aro) -->
      <template v-else-if="activeTool === 'circular'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">Riel circular (collar)</h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
          Arrastra desde una caja hasta el punto que será el
          <span class="text-yellow-700 dark:text-yellow-300 font-semibold">centro</span> del aro (o suelta sobre un
          anclaje ya existente para reusarlo como centro).
        </p>
        <p
          class="text-[11px] text-gray-600 dark:text-gray-500 italic border-t border-gray-300 dark:border-gray-800 pt-2"
        >
          El radio queda fijo en la distancia a la que soltaste el clic: la caja queda restringida a girar sin fricción
          a esa distancia exacta del centro, como un collar ensartado en un alambre circular. Puedes además conectarle
          un resorte o una fuerza normalmente — así se arman problemas como el del collar sujeto a un resorte sobre una
          barra circular.
        </p>
      </template>

      <!-- Herramienta: Fuerza — el corazón de la corrección: objetivo SIEMPRE explícito -->
      <template v-else-if="activeTool === 'force'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">Fuerza aplicada</h3>

        <div
          v-if="!selectedBox"
          class="text-[11px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 text-center"
        >
          Haz clic sobre una caja en el lienzo para elegirla como objetivo.
        </div>

        <template v-else>
          <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
            Aplicando a:
            <span class="font-mono font-bold" :style="{ color: selectedBox.color }">● {{ selectedBox.label }}</span>
          </p>

          <div class="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
            <div>
              <label class="text-[11px] text-gray-600 dark:text-gray-400 block mb-1">Magnitud (N)</label>
              <input
                v-model.number="forceMagnitude"
                type="number"
                min="0"
                step="0.5"
                class="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label class="text-[11px] text-gray-600 dark:text-gray-400 block mb-1">Ángulo (°)</label>
              <input
                v-model.number="forceAngle"
                type="number"
                step="1"
                class="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-4 gap-1.5 mb-1.5">
            <button
              v-for="m in magnitudePresets"
              :key="m"
              @click="forceMagnitude = m"
              class="text-[10px] font-mono py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700"
            >
              {{ m }}N
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5 mb-3">
            <button
              v-for="p in forcePresets"
              :key="p.angle"
              @click="forceAngle = p.angle"
              class="text-[10px] font-mono py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700"
            >
              {{ p.label }}
            </button>
          </div>

          <p class="text-[10px] text-gray-600 dark:text-gray-500 italic mb-2">
            O arrastra directamente sobre {{ selectedBox.label }} en el lienzo — verás un transportador tenue
            (0°/90°/180°/270°) para guiar la dirección.
          </p>

          <div class="flex gap-2">
            <button
              type="button"
              @click="applyForceNow(true)"
              class="flex-1 text-xs font-semibold uppercase tracking-wide py-2 rounded-lg border border-orange-600 bg-orange-700/30 text-orange-200 hover:bg-orange-700/60 transition-colors"
            >
              ▶ Activar continua
            </button>
            <button
              type="button"
              @click="applyForceNow(false)"
              class="text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 transition-colors"
            >
              ⏹ Detener
            </button>
          </div>
          <button
            type="button"
            @click="emit('apply-impulse', { magnitude: forceMagnitude, angleDeg: forceAngle })"
            class="w-full mt-2 text-xs font-semibold uppercase tracking-wide py-2 rounded-lg border border-amber-700 bg-amber-900/20 text-amber-200 hover:bg-amber-800/40 transition-colors"
          >
            ⚡ Aplicar impulso único
          </button>
        </template>
      </template>

      <!-- Herramienta: Crear caja -->
      <template v-else-if="activeTool === 'box'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
          Crear Objeto
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
          Haz clic en cualquier punto del lienzo para soltar un objeto nuevo.
        </p>

        <div class="flex items-center justify-between mt-2 mb-1">
          <label class="text-[11px] font-bold text-gray-700 dark:text-gray-300">Forma para Nuevos Objetos</label>
          <button
            type="button"
            @click="emit('open-shape-editor')"
            class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Sparkles class="w-3 h-3" />
            Editor Multiforma...
          </button>
        </div>
        <div
          class="grid grid-cols-4 gap-1.5 bg-gray-200 dark:bg-gray-800/80 p-1.5 rounded-xl max-h-36 overflow-y-auto mb-3"
        >
          <button
            v-for="s in SHAPE_PRESETS"
            :key="s.id"
            @click="emit('update-next-box-shape', s.shape, s.verts)"
            class="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold transition-all"
            :class="
              nextBoxShape === s.shape && (!s.verts || JSON.stringify(nextBoxVertices) === JSON.stringify(s.verts))
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            "
            :title="s.description"
          >
            <ShapeSvgPreview
              :shape="s.shape"
              :verts="s.verts"
              :color="
                nextBoxShape === s.shape && (!s.verts || JSON.stringify(nextBoxVertices) === JSON.stringify(s.verts))
                  ? '#10b981'
                  : '#64748b'
              "
              :size="24"
            />
            <span class="truncate max-w-full text-[9px] mt-0.5">{{ s.label }}</span>
          </button>
        </div>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-4">
          <span>Masa (kg)</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ nextBoxMass.toFixed(1) }}</span>
        </label>
        <div class="flex gap-2">
          <input
            type="range"
            min="0.1"
            max="15"
            step="0.1"
            :value="nextBoxMass"
            @input="emit('update-next-box-config', 'mass', Number($event.target.value))"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            :value="nextBoxMass"
            @input="emit('update-next-box-config', 'mass', Number($event.target.value))"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
          <span>{{ nextBoxShape === 'circle' ? 'Diámetro (m)' : 'Ancho (m)' }}</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ nextBoxWidth.toFixed(1) }} m</span>
        </label>
        <div class="flex gap-2">
          <input
            type="range"
            min="0.2"
            max="10"
            step="0.1"
            :value="nextBoxWidth"
            @input="emit('update-next-box-config', 'width', Number($event.target.value))"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            type="number"
            min="0.2"
            step="0.1"
            :value="nextBoxWidth"
            @input="emit('update-next-box-config', 'width', Number($event.target.value))"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>

        <div v-if="nextBoxShape !== 'circle'">
          <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
            <span>Alto (m)</span>
            <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ nextBoxHeight.toFixed(1) }} m</span>
          </label>
          <div class="flex gap-2">
            <input
              type="range"
              min="0.2"
              max="10"
              step="0.1"
              :value="nextBoxHeight"
              @input="emit('update-next-box-config', 'height', Number($event.target.value))"
              class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min="0.2"
              step="0.1"
              :value="nextBoxHeight"
              @input="emit('update-next-box-config', 'height', Number($event.target.value))"
              class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
          <span>Fricción (μ)</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ nextBoxFriction.toFixed(2) }}</span>
        </label>
        <div class="flex gap-2">
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            :value="nextBoxFriction"
            @input="emit('update-next-box-config', 'friction', Number($event.target.value))"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            type="number"
            min="0"
            step="0.05"
            :value="nextBoxFriction"
            @input="emit('update-next-box-config', 'friction', Number($event.target.value))"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
          <span>Velocidad Inicial Vx (m/s)</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ (nextBoxVx || 0).toFixed(1) }} m/s</span>
        </label>
        <div class="flex gap-2">
          <input
            type="range"
            min="-30"
            max="30"
            step="0.5"
            :value="nextBoxVx || 0"
            @input="emit('update-next-box-config', 'vx', Number($event.target.value))"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            type="number"
            step="0.5"
            :value="nextBoxVx || 0"
            @input="emit('update-next-box-config', 'vx', Number($event.target.value))"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>

        <label class="text-[11px] text-gray-600 dark:text-gray-400 flex justify-between mb-1 mt-3">
          <span>Velocidad Inicial Vy (m/s)</span>
          <span class="font-mono text-emerald-700 dark:text-emerald-300">{{ (nextBoxVy || 0).toFixed(1) }} m/s</span>
        </label>
        <div class="flex gap-2 mb-2">
          <input
            type="range"
            min="-30"
            max="30"
            step="0.5"
            :value="nextBoxVy || 0"
            @input="emit('update-next-box-config', 'vy', Number($event.target.value))"
            class="flex-1 self-center h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <input
            type="number"
            step="0.5"
            :value="nextBoxVy || 0"
            @input="emit('update-next-box-config', 'vy', Number($event.target.value))"
            class="w-16 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs font-mono text-emerald-700 dark:text-emerald-300 focus:border-emerald-800 dark:border-emerald-500 outline-none"
          />
        </div>
      </template>

      <!-- Herramienta: Fijador / Anclaje -->
      <template v-else-if="activeTool === 'anchor'">
        <h3
          class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1"
        >
          📍 Fijador / Anclaje
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
          Haz clic en cualquier punto del lienzo para colocar un <strong>fijador estático</strong>.
        </p>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
          Si haces clic sobre un objeto dinámico existente, se creará un anclaje y quedará
          <strong>fijado en esa posición</strong>.
        </p>
      </template>

      <!-- Herramienta: Medición y Cotas -->
      <template v-else-if="activeTool === 'measure'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-2 flex items-center gap-1.5">
          📏 Medición y Cotas de Ingeniería
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          Haz clic y arrastra entre dos puntos o centros de objetos para medir distancias ($d$), alturas ($h$) y ángulos ($\theta$).
        </p>

        <div class="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/60 mb-3 space-y-2">
          <div class="text-[11px] font-bold text-sky-900 dark:text-sky-300">Sensores Físicos Activos:</div>
          <div class="text-[10px] text-sky-700 dark:text-sky-400 flex items-center gap-1">
            <span>• Altura Máxima ($h_{\text{max}}$): Marcada en el ápice de rotación o rebote.</span>
          </div>
          <div class="text-[10px] text-sky-700 dark:text-sky-400 flex items-center gap-1">
            <span>• Distancia entre Impactos ($A \to B$).</span>
          </div>
        </div>

        <button
          type="button"
          @click="emit('clear-measurements')"
          class="w-full py-2 px-3 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-bold text-xs hover:bg-sky-200 transition-colors"
        >
          Limpiar Cotas de Pantalla
        </button>
      </template>

      <!-- Herramienta: Rodillos / Apoyo Deslizante -->
      <template v-else-if="activeTool === 'rollers'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
          ⚙️ Rodillos / Apoyo Deslizante
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          Haz clic sobre <strong>cualquier figura u objeto</strong> (cuñas, bloques, polígonos) para colocarle o quitarle rodillos de apoyo deslizante (fricción 0 y deslizamiento sin vuelco).
        </p>
      </template>
      <template v-else-if="activeTool === 'circular'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
          Anillo en Riel
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
          Haz clic en el vacío para fijar el <strong>centro</strong> del riel, arrastra para definir el radio, y suelta.
        </p>
        <p class="text-[11px] text-gray-600 dark:text-gray-400">
          Al soltar, se creará automáticamente una <strong>anilla (masa de 1.5kg)</strong> ensartada en el riel. ¡No
          necesitas anclarlo al suelo!
        </p>
      </template>

      <!-- Herramienta: Borrar -->
      <template v-else-if="activeTool === 'delete'">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">Borrar</h3>
      </template>
    </div>
  </div>
</template>
