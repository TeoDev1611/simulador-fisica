<script setup>
import { Settings, X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  unitSystem: { type: String, default: 'metric' },
  labelStyle: { type: String, default: 'color' },
  gravity: { type: Number, default: 9.81 }
})

const emit = defineEmits([
  'close',
  'update-unit-system',
  'update-label-style',
  'update-gravity',
  'import-scene',
  'export-scene'
])
</script>

<template>
  <!-- Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300"
    @click="emit('close')"
  >
    <!-- Modal -->
    <div
      class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden flex flex-col pointer-events-auto"
      @click.stop
    >
      <!-- Header -->
      <div
        class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-950/50"
      >
        <h2
          class="text-sm font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
        >
          <Settings class="w-4 h-4" />
          Ajustes Globales
        </h2>
        <button
          @click="emit('close')"
          class="p-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 flex flex-col gap-6">
        <!-- Unit System -->
        <div>
          <label class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2"
            >Sistema de Unidades</label
          >
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-950/50 p-1.5 rounded-xl shadow-inner w-full">
            <button
              @click="emit('update-unit-system', 'si')"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
              :class="
                unitSystem === 'si'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              "
            >
              SI (m, kg)
            </button>
            <button
              @click="emit('update-unit-system', 'imperial')"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
              :class="
                unitSystem === 'imperial'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              "
            >
              Inglés (ft, lb)
            </button>
          </div>
          <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            El motor físico interno siempre usa MKS. Esta opción solo cambia la forma en que se muestran y se ingresan
            los datos.
          </p>
        </div>

        <!-- Visual Style -->
        <div>
          <label class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2"
            >Estilo de Etiquetas</label
          >
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-950/50 p-1.5 rounded-xl shadow-inner w-full">
            <button
              @click="emit('update-label-style', 'color')"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
              :class="
                labelStyle === 'color'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              "
            >
              Color 🌈
            </button>
            <button
              @click="emit('update-label-style', 'latex')"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
              :class="
                labelStyle === 'latex'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              "
            >
              LaTeX 📐
            </button>
          </div>
          <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            El estilo LaTeX usa tipografía matemática profesional (requiere recargar la simulación).
          </p>
        </div>

        <!-- Gravedad -->
        <div>
          <label
            class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between mb-2"
          >
            <span>Gravedad</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-mono">{{ gravity.toFixed(1) }} m/s²</span>
          </label>
          <div class="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="30"
              step="0.1"
              :value="gravity"
              @input="emit('update-gravity', Number($event.target.value))"
              class="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 touch-none"
            />
            <button
              @click="emit('update-gravity', 9.81)"
              class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-[10px] font-bold text-gray-500 hover:text-emerald-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Archivos -->
        <div>
          <label class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2"
            >Archivos de Simulación</label
          >
          <div class="flex flex-col gap-2">
            <button
              @click="emit('import-scene')"
              class="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-bold text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M10 20H4a2 2 0 0 1-2-2V5.99a2 2 0 0 1 2-2h5.83a2 2 0 0 1 1.69.9L13.41 7H20a2 2 0 0 1 2 2v2" />
                <path d="M21.5 15.5 18 19l-3.5-3.5" />
                <path d="M18 12v7" />
              </svg>
              Cargar Escena (.json)
            </button>
            <button
              @click="emit('export-scene')"
              class="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Guardar Escena (.json)
            </button>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="mt-2 w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-md hover:bg-gray-800 dark:hover:bg-white transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
        >
          Cerrar Ajustes
        </button>
      </div>
    </div>
  </div>
</template>
