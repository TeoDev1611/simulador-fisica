<script setup>
// src/components/HomePage.vue
defineEmits(['navigate'])

const apps = [
  {
    id: 'kinematics',
    icon: '📈',
    name: 'Trayectoria',
    kicker: 'Cinemática 1D',
    accent: 'emerald',
    summary:
      'Escribe cualquier ecuación de posición x(t) y observa al instante su velocidad y aceleración: derivadas simbólicas, gráficas sincronizadas y una animación del móvil sobre su propio eje.',
    features: [
      'Derivación automática: x(t) → v(t) → a(t), con notación LaTeX en vivo',
      'Tres gráficas sincronizadas (posición, velocidad, aceleración) con Chart.js',
      'Editor con teclado matemático y validación mientras escribes',
      'Ecuaciones de ejemplo: MRU, parabólica, senoidal, exponencial…'
    ],
    cta: 'Abrir Trayectoria'
  },
  {
    id: 'sandbox2d',
    icon: '🧲',
    name: 'Newton Lab',
    kicker: 'Sandbox Físico 2D',
    accent: 'blue',
    summary:
      'Un entorno de físicas 2D libre, construido sobre un motor real de cuerpos rígidos: dibuja terrenos, suelta cajas, conéctalas con cuerdas, resortes o poleas, y mide fuerza normal y tensión en tiempo real.',
    features: [
      'Motor de físicas continuo (Planck.js) — sin atravesar el suelo ni perder precisión',
      'Terrenos dibujados a mano libre, con fricción ajustable en caliente',
      'Cuerdas, resortes (k y amortiguamiento configurables) y poleas',
      'Fuerza Normal y Tensión calculadas y visualizadas en vivo, no solo estimadas'
    ],
    cta: 'Abrir Newton Lab'
  }
]
</script>

<template>
  <div class="relative flex-1 flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
    <!-- Fondo decorativo: trayectoria suave -->
    <svg
      class="pointer-events-none absolute inset-x-0 top-0 w-full h-[420px] opacity-10"
      viewBox="0 0 1000 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        id="home-trajectory"
        d="M -40 380 Q 300 -40 500 200 Q 700 420 1040 40"
        fill="none"
        stroke="#10b981"
        stroke-width="1.5"
        stroke-dasharray="2 10"
        stroke-linecap="round"
      />
      <circle r="5" fill="#34d399">
        <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
          <mpath href="#home-trajectory" />
        </animateMotion>
      </circle>
    </svg>

    <div class="relative flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 py-8">
      <!-- Encabezado -->
      <section class="text-center mb-10">
        <p class="text-[11px] font-bold tracking-[0.35em] text-emerald-600 uppercase mb-2">
          Departamento de Ciencias Exactas
        </p>
        <h1 class="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Laboratorio de Simulación <span class="text-emerald-600">ESPE</span>
        </h1>
        <p class="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mt-3">
          Dos entornos interactivos para experimentar con cinemática y con las Leyes de Newton,
          directo en el navegador — sin instalar nada. Elige uno para empezar.
        </p>
      </section>

      <!-- Tarjetas de simuladores -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <article
          v-for="app in apps"
          :key="app.id"
          class="group flex flex-col bg-white border border-gray-200 rounded-2xl p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-200"
          :class="app.accent === 'emerald' ? 'hover:border-emerald-300' : 'hover:border-blue-300'"
        >
          <div class="flex items-center gap-3.5 mb-4">
            <span
              class="w-12 h-12 flex items-center justify-center text-2xl rounded-xl border shrink-0"
              :class="app.accent === 'emerald'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-blue-50 border-blue-200'"
            >
              {{ app.icon }}
            </span>
            <div class="leading-tight">
              <h2 class="text-xl font-bold text-gray-900">{{ app.name }}</h2>
              <p
                class="text-[11px] font-semibold uppercase tracking-wide"
                :class="app.accent === 'emerald' ? 'text-emerald-600' : 'text-blue-600'"
              >
                {{ app.kicker }}
              </p>
            </div>
          </div>

          <p class="text-sm text-gray-700 leading-relaxed mb-4">{{ app.summary }}</p>

          <ul class="text-xs text-gray-600 space-y-2 mb-5 flex-1">
            <li v-for="f in app.features" :key="f" class="flex gap-2">
              <span :class="app.accent === 'emerald' ? 'text-emerald-500' : 'text-blue-500'">›</span>
              <span>{{ f }}</span>
            </li>
          </ul>

          <button
            type="button"
            @click="$emit('navigate', app.id)"
            class="w-full flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide
                   px-5 py-3 rounded-xl shadow transition-colors duration-150"
            :class="app.accent === 'emerald'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'"
          >
            {{ app.cta }}
            <span class="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </button>
        </article>
      </section>

      <!-- Sección informativa adicional: ¿Para qué sirve? -->
      <section class="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <span class="text-2xl">🎯</span> Objetivos educativos
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
          <div class="flex flex-col items-start gap-2">
            <span class="text-emerald-600 text-2xl">📐</span>
            <h3 class="font-semibold text-gray-800">Modelado matemático</h3>
            <p>Relaciona ecuaciones con movimiento real, visualiza derivadas e integrales de manera intuitiva.</p>
          </div>
          <div class="flex flex-col items-start gap-2">
            <span class="text-blue-600 text-2xl">⚡</span>
            <h3 class="font-semibold text-gray-800">Física interactiva</h3>
            <p>Experimenta con fuerzas, resortes, poleas y fricción en un entorno 2D realista y sin riesgos.</p>
          </div>
          <div class="flex flex-col items-start gap-2">
            <span class="text-purple-600 text-2xl">📊</span>
            <h3 class="font-semibold text-gray-800">Análisis en tiempo real</h3>
            <p>Observa gráficas sincronizadas y datos numéricos mientras manipulas los parámetros al instante.</p>
          </div>
        </div>
      </section>

      <!-- Llamada a la acción extra -->
      <div class="text-center pb-6">
        <p class="text-sm text-gray-500">
          ¿Prefieres empezar con una guía? Visita la sección
          <span class="text-emerald-600 font-semibold">Inicio</span> para más recursos.
        </p>
      </div>
    </div>
  </div>
</template>