<script setup>
// src/components/physics/ShapeEditorModal.vue
// Modal de edición multiforma para simulación física.

import { ref, computed, watch } from 'vue'
import { SHAPE_PRESETS, createRegularPolygonVertices, getPolygonName } from '../../utils/shapeUtils.js'
import ShapeSvgPreview from './ShapeSvgPreview.vue'
import { X, Check, Sparkles, Sliders, Box, Layers } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  selectedBox: { type: Object, default: null },
  currentShape: { type: String, default: 'box' },
  currentVertices: { type: Array, default: null },
  currentWidth: { type: Number, default: 1 },
  currentHeight: { type: Number, default: 1 },
  currentColor: { type: String, default: '#34d399' }
})

const emit = defineEmits(['close', 'apply-to-selected', 'apply-to-default'])

// Estado interno del editor
const activeTab = ref('presets') // 'presets' | 'generator'
const customSides = ref(5) // Default 5 (Pentágono)
const selectedPresetId = ref('box')

const localShape = ref('box')
const localVerts = ref(null)
const localWidth = ref(1)
const localHeight = ref(1)
const localColor = ref('#34d399')

// Inicializar el estado según los props cuando se abre el modal
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.selectedBox) {
        localShape.value = props.selectedBox.shape || 'box'
        localVerts.value = props.selectedBox.vertices ? [...props.selectedBox.vertices] : null
        localWidth.value = props.selectedBox.width || 1
        localHeight.value = props.selectedBox.height || 1
        localColor.value = props.selectedBox.color || '#34d399'
      } else {
        localShape.value = props.currentShape || 'box'
        localVerts.value = props.currentVertices ? [...props.currentVertices] : null
        localWidth.value = props.currentWidth || 1
        localHeight.value = props.currentHeight || 1
        localColor.value = props.currentColor || '#34d399'
      }

      // Detectar preset coincidente si existe
      const found = SHAPE_PRESETS.find(
        (p) =>
          p.shape === localShape.value && (!p.verts || JSON.stringify(p.verts) === JSON.stringify(localVerts.value))
      )
      if (found) {
        selectedPresetId.value = found.id
        if (found.sides >= 3 && found.sides <= 8) customSides.value = found.sides
      } else {
        selectedPresetId.value = 'custom'
      }
    }
  },
  { immediate: true }
)

// Seleccionar un preset de la galería
function selectPreset(preset) {
  selectedPresetId.value = preset.id
  localShape.value = preset.shape
  localVerts.value = preset.verts ? [...preset.verts] : null
  if (preset.sides >= 3 && preset.sides <= 8) {
    customSides.value = preset.sides
  }
}

// Al mover el slider del generador N-Lados
watch(customSides, (newSides) => {
  if (activeTab.value === 'generator') {
    localShape.value = 'polygon'
    localVerts.value = createRegularPolygonVertices(newSides)
    selectedPresetId.value = 'generator-' + newSides
  }
})

// Cambiar a la pestaña del generador
function activateGenerator() {
  activeTab.value = 'generator'
  localShape.value = 'polygon'
  localVerts.value = createRegularPolygonVertices(customSides.value)
}

// Aplicar cambios al objeto seleccionado
function handleApplyToSelected() {
  if (!props.selectedBox) return
  emit('apply-to-selected', {
    id: props.selectedBox.id,
    width: localWidth.value,
    height: localHeight.value,
    shape: localShape.value,
    vertices: localVerts.value
  })
  emit('close')
}

// Aplicar cambios a los valores predeterminados para nuevas cajas
function handleApplyToDefault() {
  emit('apply-to-default', {
    shape: localShape.value,
    vertices: localVerts.value,
    width: localWidth.value,
    height: localHeight.value
  })
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-fade-in"
    @click.self="emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-400"
          >
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Editor Multiforma de Figuras
              <span
                v-if="selectedBox"
                class="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              >
                Editando: {{ selectedBox.label || selectedBox.id }}
              </span>
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Selecciona o diseña cualquier polígono regular (Pentágono, Hexágono, Octágono...)
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Pestañas de navegación -->
      <div class="flex border-b border-gray-200 dark:border-gray-800 px-6 pt-3 gap-2 bg-gray-50/30 dark:bg-gray-950/30">
        <button
          @click="activeTab = 'presets'"
          class="px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2"
          :class="
            activeTab === 'presets'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
        >
          <Layers class="w-4 h-4" />
          Galería de Formas
        </button>
        <button
          @click="activateGenerator"
          class="px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2"
          :class="
            activeTab === 'generator'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 shadow-sm'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
        >
          <Sliders class="w-4 h-4" />
          Generador N-Lados
        </button>
      </div>

      <!-- Contenido Principal -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Vista previa en tiempo real centrada -->
        <div
          class="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/20 border border-gray-200 dark:border-gray-800 shadow-inner"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-3 shadow-md relative"
            >
              <ShapeSvgPreview :shape="localShape" :verts="localVerts" :color="localColor" :size="76" />
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Forma Activa
              </span>
              <h4 class="text-lg font-black text-gray-900 dark:text-white capitalize">
                {{
                  localShape === 'polygon' && localVerts
                    ? getPolygonName(localVerts.length)
                    : localShape === 'circle'
                      ? 'Esfera / Cilindro'
                      : localShape === 'ring'
                        ? 'Anilla / Aro'
                        : 'Caja / Rectángulo'
                }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                <span v-if="localVerts">{{ localVerts.length }} Vértices de colisión</span>
                <span v-else-if="localShape === 'circle'">Geometría circular lisa</span>
                <span v-else-if="localShape === 'ring'">Geometría de aro hueco</span>
                <span v-else>4 Vértices rectangulares</span>
              </p>
            </div>
          </div>

          <!-- Ajuste rápido de dimensiones -->
          <div
            class="flex flex-col gap-2 w-full md:w-48 bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs"
          >
            <label class="font-bold text-gray-700 dark:text-gray-300 flex justify-between">
              <span>{{ localShape === 'circle' || localShape === 'ring' ? 'Diámetro:' : 'Ancho:' }}</span>
              <span class="font-mono text-emerald-600 dark:text-emerald-400">{{ localWidth.toFixed(1) }}m</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="6"
              step="0.1"
              v-model.number="localWidth"
              class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-emerald-500"
            />

            <template v-if="localShape !== 'circle' && localShape !== 'ring'">
              <label class="font-bold text-gray-700 dark:text-gray-300 flex justify-between mt-1">
                <span>Alto:</span>
                <span class="font-mono text-emerald-600 dark:text-emerald-400">{{ localHeight.toFixed(1) }}m</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="6"
                step="0.1"
                v-model.number="localHeight"
                class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-emerald-500"
              />
            </template>
          </div>
        </div>

        <!-- Pestaña 1: Galería de Formas -->
        <div v-if="activeTab === 'presets'" class="space-y-3">
          <h4 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Colección Multiforma
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <button
              v-for="p in SHAPE_PRESETS"
              :key="p.id"
              @click="selectPreset(p)"
              class="flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center group relative overflow-hidden"
              :class="
                selectedPresetId === p.id
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/40'
                  : 'bg-gray-50 dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-400/50 hover:bg-gray-100 dark:hover:bg-gray-800/80'
              "
            >
              <div class="w-12 h-12 flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                <ShapeSvgPreview
                  :shape="p.shape"
                  :verts="p.verts"
                  :color="selectedPresetId === p.id ? '#10b981' : '#64748b'"
                  :size="40"
                />
              </div>
              <span class="text-xs font-bold leading-tight">{{ p.label }}</span>
              <span class="text-[10px] text-gray-400 font-mono mt-0.5">
                {{ p.sides > 0 ? `${p.sides} Lados` : p.shape }}
              </span>
            </button>
          </div>
        </div>

        <!-- Pestaña 2: Generador N-Lados -->
        <div
          v-if="activeTab === 'generator'"
          class="space-y-5 bg-gray-50/50 dark:bg-gray-950/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-bold text-gray-900 dark:text-white">
                Generador de Polígonos Regulares (3 a 8 lados)
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Selecciona la cantidad de lados para generar vértices de colisión física simétricos.
              </p>
            </div>
            <div class="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-mono font-bold text-sm shadow-md">
              {{ customSides }} Lados
            </div>
          </div>

          <!-- Slider de número de lados -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-bold font-mono text-gray-500">
              <span>3 (Triángulo)</span>
              <span>5 (Pentágono)</span>
              <span>6 (Hexágono)</span>
              <span>8 (Octágono)</span>
            </div>
            <input
              type="range"
              min="3"
              max="8"
              step="1"
              v-model.number="customSides"
              class="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <!-- Selector rápido de botones para N-lados -->
          <div class="flex flex-wrap gap-2 pt-2">
            <button
              v-for="n in [3, 4, 5, 6, 7, 8]"
              :key="n"
              @click="customSides = n"
              class="flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              :class="
                customSides === n
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-emerald-400'
              "
            >
              <span>{{ getPolygonName(n).split(' ')[0] }}</span>
              <span class="font-mono text-[10px] opacity-75">({{ n }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer / Acciones -->
      <div
        class="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50"
      >
        <button
          @click="emit('close')"
          class="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancelar
        </button>

        <button
          v-if="selectedBox"
          @click="handleApplyToSelected"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Check class="w-4 h-4" />
          Aplicar a Objeto Seleccionado
        </button>

        <button
          @click="handleApplyToDefault"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          :class="
            selectedBox
              ? 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
          "
        >
          <Box class="w-4 h-4" />
          Usar para Nuevos Objetos
        </button>
      </div>
    </div>
  </div>
</template>
