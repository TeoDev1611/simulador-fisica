<script setup>
// src/components/EspeLogo.vue
defineProps({
  size: { type: Number, default: 40 },
  darkMode: { type: Boolean, default: false }
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <img src="../img/logo.png" :style="{ height: size + 'px' }" alt="ESPE" />
    <div class="leading-none">
      <div class="flex items-baseline gap-1">
        <span
          class="font-black tracking-tight"
          :class="darkMode ? 'text-emerald-300' : 'text-emerald-800'"
          style="font-size: 1.35rem;"
        >
          ESPE
        </span>
      </div>
      <div
        class="h-[3px] w-full rounded-full mt-0.5 mb-1"
        :class="darkMode ? 'bg-red-500' : 'bg-red-600'"
      ></div>
      <p
        class="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide leading-tight"
        :class="darkMode ? 'text-emerald-400/80' : 'text-emerald-900'"
      >
        Universidad de las Fuerzas Armadas
      </p>
    </div>
  </div>
</template>