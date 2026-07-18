<script setup>
defineProps({
  position: { type: Number, required: true },
  velocity: { type: Number, required: true },
  acceleration: { type: Number, required: true }
})

function fmt(value) {
  if (typeof value !== 'number' || !isFinite(value)) return '---'
  return value.toFixed(2)
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 relative z-10">
    <div
      class="bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl p-5 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-shadow"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-emerald-300/20 dark:from-emerald-900/20 to-transparent pointer-events-none"
      ></div>
      <span
        class="absolute top-0 right-0 h-full w-1.5 bg-emerald-800 dark:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]"
      ></span>
      <p class="text-[11px] uppercase tracking-wider text-gray-600 dark:text-gray-400 relative z-10">Posición x(t)</p>
      <p class="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1 relative z-10 drop-shadow-md">
        {{ fmt(position) }} <span class="text-sm text-gray-600 dark:text-gray-500">m</span>
      </p>
    </div>

    <div
      class="bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-md border border-yellow-200/60 dark:border-yellow-800/60 rounded-2xl p-5 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-shadow"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-yellow-300/20 dark:from-yellow-900/20 to-transparent pointer-events-none"
      ></div>
      <span
        class="absolute top-0 right-0 h-full w-1.5 bg-yellow-700 dark:bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,1)]"
      ></span>
      <p class="text-[11px] uppercase tracking-wider text-gray-600 dark:text-gray-400 relative z-10">Velocidad v(t)</p>
      <p class="text-3xl font-black text-yellow-700 dark:text-yellow-300 font-mono mt-1 relative z-10 drop-shadow-md">
        {{ fmt(velocity) }} <span class="text-sm text-gray-600 dark:text-gray-500">m/s</span>
      </p>
    </div>

    <div
      class="bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-md border border-blue-200/60 dark:border-blue-800/60 rounded-2xl p-5 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(96,165,250,0.2)] transition-shadow"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-300/20 dark:from-blue-900/20 to-transparent pointer-events-none"
      ></div>
      <span
        class="absolute top-0 right-0 h-full w-1.5 bg-blue-700 dark:bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"
      ></span>
      <p class="text-[11px] uppercase tracking-wider text-gray-600 dark:text-gray-400 relative z-10">
        Aceleración a(t)
      </p>
      <p class="text-3xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 relative z-10 drop-shadow-md">
        {{ fmt(acceleration) }} <span class="text-sm text-gray-600 dark:text-gray-500">m/s²</span>
      </p>
    </div>
  </div>
</template>
