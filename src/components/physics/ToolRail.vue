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
  { id: 'drag', label: 'Mover / Seleccionar' },
  { id: 'box', label: 'Crear caja' },
  { id: 'ground', label: 'Dibujar suelo' },
  { id: 'rope', label: 'Cuerda' },
  { id: 'spring', label: 'Resorte' },
  { id: 'pulley', label: 'Polea' },
  { id: 'circular', label: 'Riel circular (collar)' },
  { id: 'force', label: 'Fuerza / Impulso' },
  { id: 'delete', label: 'Borrar' }
]

const iconPaths = {
  drag: `<path d="M3 3l7 19 2.051-6.154a6 6 0 0 1 3.795-3.795L22 10 3 3z"/>`,
  box: `<path d="m3.514 6.61c-.317.179-.514.519-.514.887v8.95c0 .37.197.708.514.887 1.597.901 6.456 3.639 8.005 4.512.152.085.319.128.487.128.164 0 .328-.041.477-.123 1.549-.855 6.39-3.523 7.994-4.408.323-.177.523-.519.523-.891v-9.055c0-.368-.197-.708-.515-.887-1.595-.899-6.444-3.632-7.999-4.508-.151-.085-.319-.128-.486-.128-.168 0-.335.043-.486.128-1.555.876-6.405 3.609-8 4.508m15.986 2.115v7.525l-6.75 3.722v-7.578zm-15 7.425v-7.458l6.75 3.75v7.511zm.736-8.769 6.764-3.813 6.801 3.834-6.801 3.716z" fill-rule="nonzero"/>`,
  ground: `<path d="M18.363 8.464l1.433 1.431-12.67 12.669-7.125 1.436 1.439-7.127 12.665-12.668 1.431 1.431-12.255 12.224-.726 3.584 3.584-.723 12.224-12.257zm-.056-8.464l-2.815 2.817 5.691 5.692 2.817-2.821-5.693-5.688zm-12.318 18.718l11.313-11.316-.705-.707-11.313 11.314.705.709z"/>`,
  rope: `<path d="M2 12c2-5 4-5 5-2s2 5 5 2 3-5 5-2 3 5 5 2"/>`,
  spring: `<path d="M3.732 13h1.504s2.32-8.403 2.799-10.263c.156-.605.646-.738.965-.737.319.001.826.224.947.74.581 2.466 3.11 13.908 3.11 13.908s1.597-6.441 1.943-7.891c.101-.425.536-.757 1-.757.464 0 .865.343 1 .707.312.841 1.675 4.287 1.677 4.293h1.591c.346-.598.992-1 1.732-1 1.104 0 2 .896 2 2s-.896 2-2 2c-.741 0-1.388-.404-1.734-1.003-.939-.001-1.856 0-2.266.003-.503.004-.774-.289-.928-.629l-.852-2.128s-1.828 7.367-2.25 8.999c-.153.595-.646.762-.97.758-.324-.004-.847-.198-.976-.783-.549-2.487-2.081-9.369-3.123-14.053 0 0-1.555 5.764-1.936 7.099-.13.454-.431.731-.965.737h-2.268c-.346.598-.992 1-1.732 1-1.104 0-2-.896-2-2s.896-2 2-2c.74 0 1.386.402 1.732 1z"/>`,
  pulley: `<path d="M14 3.269C14 2.568 13.432 2 12.731 2H11.27C10.568 2 10 2.568 10 3.269v0c0 .578-.396 1.074-.935 1.286-.085.034-.17.07-.253.106-.531.23-1.162.16-1.572-.249v0a1.269 1.269 0 0 0-1.794 0L4.412 5.446a1.269 1.269 0 0 0 0 1.794v0c.41.41.48 1.04.248 1.572a7.946 7.946 0 0 0-.105.253c-.212.539-.708.935-1.286.935v0C2.568 10 2 10.568 2 11.269v1.462C2 13.432 2.568 14 3.269 14v0c.578 0 1.074.396 1.286.935.034.085.07.17.105.253.231.531.161 1.162-.248 1.572v0a1.269 1.269 0 0 0 0 1.794l1.034 1.034a1.269 1.269 0 0 0 1.794 0v0c.41-.41 1.04-.48 1.572-.249.083.037.168.072.253.106.539.212.935.708.935 1.286v0c0 .701.568 1.269 1.269 1.269h1.462c.701 0 1.269-.568 1.269-1.269v0c0-.578.396-1.074.935-1.287.085-.033.17-.068.253-.104.531-.232 1.162-.161 1.571.248v0a1.269 1.269 0 0 0 1.795 0l1.034-1.034a1.269 1.269 0 0 0 0-1.794v0c-.41-.41-.48-1.04-.249-1.572.037-.083.072-.168.106-.253.212-.539.708-.935 1.286-.935v0c.701 0 1.269-.568 1.269-1.269V11.27c0-.701-.568-1.269-1.269-1.269v0c-.578 0-1.074-.396-1.287-.935a7.755 7.755 0 0 0-.105-.253c-.23-.531-.16-1.162.249-1.572v0a1.269 1.269 0 0 0 0-1.794l-1.034-1.034a1.269 1.269 0 0 0-1.794 0v0c-.41.41-1.04.48-1.572.249a7.913 7.913 0 0 0-.253-.106C14.396 4.343 14 3.847 14 3.27v0z"/><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>`,
  circular: `<path d="M5.344 19.442l-1.186 1.628c-2.305-1.995-3.842-4.85-4.107-8.07h2c.255 2.553 1.48 4.819 3.293 6.442zm16.605-6.442c-.256 2.56-1.487 4.831-3.308 6.455l1.183 1.631c2.315-1.997 3.858-4.858 4.125-8.086h-2zm-19.898-2c.256-2.561 1.487-4.832 3.309-6.456l-1.183-1.631c-2.317 1.996-3.86 4.858-4.126 8.087h2zm4.927-7.633c1.477-.864 3.19-1.367 5.022-1.367 1.839 0 3.558.507 5.039 1.377l1.183-1.624c-1.817-1.105-3.941-1.753-6.222-1.753-2.272 0-4.39.644-6.201 1.741l1.179 1.626zm12.863-.438l-1.186 1.628c1.813 1.624 3.039 3.889 3.294 6.443h2c-.265-3.221-1.802-6.076-4.108-8.071zm-2.817 17.703c-1.478.864-3.192 1.368-5.024 1.368-1.84 0-3.56-.508-5.042-1.378l-1.183 1.624c1.818 1.106 3.943 1.754 6.225 1.754 2.273 0 4.392-.644 6.203-1.742l-1.179-1.626z"/>`,
  force: `<path d="M12 22V7"/><path d="M5 14l7-7 7 7"/><path d="M3 2h18"/>`,
  delete: `<path d="m4.015 5.494h-.253c-.413 0-.747-.335-.747-.747s.334-.747.747-.747h5.253v-1c0-.535.474-1 1-1h4c.526 0 1 .465 1 1v1h5.254c.412 0 .746.335.746.747s-.334.747-.746.747h-.254v15.435c0 .591-.448 1.071-1 1.071-2.873 0-11.127 0-14 0-.552 0-1-.48-1-1.071zm14.5 0h-13v15.006h13zm-4.25 2.506c-.414 0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm-4.5 0c-.414 0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm3.75-4v-.5h-3v.5z" fill-rule="nonzero"/>`
}
</script>

<template>
  <div
    class="pointer-events-auto flex flex-col gap-1 bg-white/90 dark:bg-gray-950/90 backdrop-blur border border-gray-300 dark:border-gray-800 rounded-xl p-1.5 shadow-md dark:shadow-xl"
  >
    <div class="group relative" v-for="t in tools" :key="t.id">
      <button
        type="button"
        @click="emit('select-tool', t.id)"
        class="w-10 h-10 flex items-center justify-center rounded-lg border transition-colors duration-150"
        :class="
          activeTool === t.id
            ? 'bg-emerald-300 dark:bg-emerald-700 border-emerald-800 dark:border-emerald-500 text-gray-900 dark:text-white'
            : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-800 hover:border-gray-300 dark:border-gray-700'
        "
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5"
          v-html="iconPaths[t.id]"
        ></svg>
      </button>
      <!-- Tooltip: aparece a la derecha del rail, no empuja el layout -->
      <span
        class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-[11px] font-semibold bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-30 shadow-lg"
      >
        {{ t.label }}
      </span>
    </div>
  </div>
</template>
