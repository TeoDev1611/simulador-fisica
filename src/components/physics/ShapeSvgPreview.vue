<script setup>
// src/components/physics/ShapeSvgPreview.vue
// Componente de vista previa SVG dinámica para formas multiforma.

defineProps({
  shape: { type: String, default: 'box' },
  verts: { type: Array, default: () => null },
  color: { type: String, default: '#34d399' },
  size: { type: Number, default: 48 },
  strokeWidth: { type: Number, default: 2 }
})
</script>

<template>
  <svg
    viewBox="-0.65 -0.65 1.3 1.3"
    :width="size"
    :height="size"
    class="overflow-visible inline-block transition-transform duration-200"
  >
    <!-- Polígono genérico -->
    <polygon
      v-if="shape === 'polygon' && verts && verts.length >= 3"
      :points="verts.map((v) => `${v.x},${-v.y}`).join(' ')"
      :fill="color"
      fill-opacity="0.85"
      stroke="currentColor"
      :stroke-width="strokeWidth / 30"
      stroke-linejoin="round"
    />

    <!-- Anilla / Aro hueco -->
    <g v-else-if="shape === 'ring'">
      <path
        d="M 0 -0.5 A 0.5 0.5 0 1 0 0.001 -0.5 M 0 -0.3 A 0.3 0.3 0 1 1 0.001 -0.3"
        :fill="color"
        fill-opacity="0.85"
        fill-rule="evenodd"
        stroke="currentColor"
        :stroke-width="strokeWidth / 30"
      />
    </g>

    <!-- Esfera / Círculo -->
    <circle
      v-else-if="shape === 'circle'"
      cx="0"
      cy="0"
      r="0.48"
      :fill="color"
      fill-opacity="0.85"
      stroke="currentColor"
      :stroke-width="strokeWidth / 30"
    />

    <!-- Rectángulo / Caja por defecto -->
    <rect
      v-else
      x="-0.48"
      y="-0.48"
      width="0.96"
      height="0.96"
      rx="0.08"
      :fill="color"
      fill-opacity="0.85"
      stroke="currentColor"
      :stroke-width="strokeWidth / 30"
    />
  </svg>
</template>
