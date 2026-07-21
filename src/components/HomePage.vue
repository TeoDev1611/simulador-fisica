<script setup>
// src/components/HomePage.vue
import { TrendingUp, Magnet, Target, Ruler, Zap, BarChart2, Library } from 'lucide-vue-next'
defineEmits(['navigate'])

const apps = [
  {
    id: 'kinematics',
    icon: TrendingUp,
    name: 'Trayectoria',
    kicker: 'Galileo Lab',
    accent: 'emerald',
    summary:
      'Escribe cualquier ecuación de posición x(t) y observa al instante su velocidad y aceleración: derivadas simbólicas, gráficas sincronizadas y una animación del móvil sobre su propio eje.',
    features: [
      'Derivación automática: x(t) → v(t) → a(t), con notación LaTeX en vivo',
      'Tres gráficas sincronizadas (posición, velocidad, aceleración) con Chart.js',
      'Editor con teclado matemático y validación mientras escribes',
      'Ecuaciones de ejemplo: MRU, parabólica, senoidal, exponencial…'
    ],
    cta: 'Abrir Galileo Lab'
  },
  {
    id: 'sandbox2d',
    icon: Magnet,
    name: 'Sandbox 2D',
    kicker: ' Newton Lab',
    accent: 'blue',
    summary:
      'Un entorno de físicas 2D libre, construido sobre un motor real de cuerpos rígidos: dibuja terrenos, suelta cajas, conéctalas con cuerdas, resortes o poleas, y mide fuerza normal y tensión en tiempo real.',
    features: [
      'Motor de físicas continuo (Planck.js) — sin atravesar el suelo ni perder precisión',
      'Terrenos dibujados a mano libre, fricción y masa ajustables en caliente',
      'Cuerdas, resortes (k y amortiguamiento configurables) y poleas',
      'Fuerza Normal y Tensión calculadas y visualizadas en vivo, no solo estimadas',
      'Exportación/Importación de escenas y grabación de telemetría a Excel (CSV)'
    ],
    cta: 'Abrir Newton Lab'
  }
]
</script>

<template>
  <div class="relative flex-1 flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
    <!-- Elementos decorativos (Blur Orbs) -->
    <div
      class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
    ></div>
    <div
      class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
    ></div>

    <!-- Fondo decorativo: trayectoria suave -->
    <svg
      class="pointer-events-none absolute inset-x-0 top-0 w-full h-[420px] opacity-20"
      viewBox="0 0 1000 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        id="home-trajectory"
        d="M -40 380 Q 300 -40 500 200 Q 700 420 1040 40"
        fill="none"
        stroke="url(#grad)"
        stroke-width="1.5"
        stroke-dasharray="4 8"
        stroke-linecap="round"
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <circle r="6" fill="#34d399" class="shadow-[0_0_10px_#34d399]">
        <animateMotion dur="8s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1">
          <mpath href="#home-trajectory" />
        </animateMotion>
      </circle>
    </svg>

    <div class="relative flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 py-8">
      <!-- Encabezado -->
      <section class="text-center mb-14 mt-4 relative z-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/60 text-[10px] font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-400 uppercase mb-6 backdrop-blur-md"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Departamento de Ciencias Exactas
        </div>
        <h1
          class="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight drop-shadow-lg dark:shadow-2xl mb-4"
        >
          Laboratorio de <br class="hidden sm:block" />
          <span
            class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300"
            >Simulación ESPE</span
          >
        </h1>
        <p
          class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed mt-4 font-light"
        >
          Dos entornos físicos de grado profesional para experimentar con la cinemática y las Leyes de Newton directo en
          el navegador.
          <strong class="text-gray-700 dark:text-gray-300 font-medium">Ninguna instalación requerida.</strong>
        </p>
      </section>

      <!-- Tarjetas de simuladores -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
        <article
          v-for="app in apps"
          :key="app.id"
          class="group flex flex-col bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg dark:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
          :class="
            app.accent === 'emerald'
              ? 'hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] hover:border-emerald-500/50'
              : 'hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] hover:border-blue-500/50'
          "
        >
          <!-- Resplandor superior sutil -->
          <div
            class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"
            :class="
              app.accent === 'emerald'
                ? 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_70%)]'
                : 'bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)]'
            "
          ></div>

          <div class="flex items-center gap-4 mb-6 relative z-10">
            <span
              class="w-14 h-14 flex items-center justify-center text-3xl rounded-2xl border shrink-0 shadow-inner"
              :class="
                app.accent === 'emerald'
                  ? 'bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-emerald-950/50 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-900/20'
                  : 'bg-blue-50 dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-blue-950/50 border-blue-200 dark:border-blue-800/50 shadow-blue-900/20'
              "
            >
              <component :is="app.icon" class="w-8 h-8" />
            </span>
            <div class="leading-tight">
              <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{{ app.name }}</h2>
              <p
                class="text-xs font-bold uppercase tracking-widest mt-1"
                :class="
                  app.accent === 'emerald'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-blue-600 dark:text-blue-400'
                "
              >
                {{ app.kicker }}
              </p>
            </div>
          </div>

          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6 relative z-10">{{ app.summary }}</p>

          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-8 flex-1 relative z-10">
            <li v-for="f in app.features" :key="f" class="flex gap-3 items-start">
              <span class="mt-0.5 text-lg" :class="app.accent === 'emerald' ? 'text-emerald-500' : 'text-blue-500'"
                >•</span
              >
              <span class="leading-snug">{{ f }}</span>
            </li>
          </ul>

          <button
            type="button"
            @click="$emit('navigate', app.id)"
            class="w-full relative z-10 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest px-6 py-4 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
            :class="
              app.accent === 'emerald'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-emerald-900/30'
                : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white shadow-blue-900/30'
            "
          >
            {{ app.cta }}
            <span class="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </button>
        </article>
      </section>

      <!-- Sección informativa adicional: ¿Para qué sirve? -->
      <section
        class="bg-gray-50 dark:bg-gray-900/30 backdrop-blur-md border border-gray-200 dark:border-gray-800/60 rounded-[2rem] p-8 md:p-10 shadow-lg dark:shadow-2xl mb-8 relative overflow-hidden z-10"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-900/5 dark:from-emerald-900/10 to-blue-900/5 dark:to-blue-900/10 pointer-events-none"
        ></div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 mb-6 relative z-10">
          <Target class="w-8 h-8 text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]" /> Objetivos educativos
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-700 dark:text-gray-300 relative z-10">
          <div class="flex flex-col items-start gap-3">
            <Ruler class="w-8 h-8 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
            <h3 class="font-bold text-gray-900 dark:text-gray-200 text-base">Modelado matemático</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Relaciona ecuaciones con movimiento real, visualiza derivadas e integrales de manera súper intuitiva.
            </p>
          </div>
          <div class="flex flex-col items-start gap-3">
            <Zap class="w-8 h-8 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]" />
            <h3 class="font-bold text-gray-900 dark:text-gray-200 text-base">Física interactiva</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Experimenta con fuerzas, resortes, poleas y fricción en un entorno 2D realista de grado profesional.
            </p>
          </div>
          <div class="flex flex-col items-start gap-3">
            <BarChart2
              class="w-8 h-8 text-purple-500 dark:text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]"
            />
            <h3 class="font-bold text-gray-900 dark:text-gray-200 text-base">Análisis en tiempo real</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Observa gráficas sincronizadas y vectores numéricos mientras manipulas los parámetros al instante.
            </p>
          </div>
        </div>
      </section>

      <!-- Banner de Ejemplos -->
      <section
        class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-8 shadow-xl mb-8 relative overflow-hidden z-10 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div
          class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50"
        ></div>
        <div class="relative z-10 text-white md:w-2/3">
          <h2 class="text-2xl font-black mb-2 flex items-center gap-2">
            <Library class="w-7 h-7" /> Explora las Plantillas y Ejemplos
          </h2>
          <p class="text-emerald-50 text-sm leading-relaxed">
            Hemos preparado 13 escenarios (básicos, intermedios y avanzados) como péndulos dobles, catapultas, pistas de
            hielo y suspensiones vehiculares. Descárgalos gratis e impórtalos en el Newton Lab 2D.
          </p>
        </div>
        <a
          href="https://github.com/TeoDev1611/simulador-fisica/tree/main/ejemplos"
          target="_blank"
          class="relative z-10 bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 whitespace-nowrap flex items-center gap-2"
        >
          Ver Ejemplos
          <span class="text-lg">→</span>
        </a>
      </section>

      <!-- Llamada a la acción extra -->
      <div class="text-center pb-8 relative z-10">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          ¿Tienes dudas sobre cómo empezar? Consulta nuestro
          <button
            @click="$emit('navigate', 'wiki')"
            class="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline decoration-emerald-500/30 underline-offset-4"
          >
            Manual de Usuario (Wiki)
          </button>
          para más recursos.
        </p>
      </div>
    </div>
  </div>
</template>
