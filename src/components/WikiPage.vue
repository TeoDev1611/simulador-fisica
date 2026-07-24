<script setup>
// src/components/WikiPage.vue
import { ref } from 'vue'
import {
  TrendingUp,
  Magnet,
  Wrench,
  Zap,
  BookOpen,
  Keyboard,
  Settings,
  BarChart2,
  DownloadCloud,
  Pause,
  Radio,
  History,
  CircleDot,
  Square,
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  MousePointer2,
  Box,
  Ruler,
  Link,
  Spline,
  Disc,
  CircleDashed,
  ArrowUpToLine,
  Trash2,
  Maximize,
  EyeOff,
  Play,
  ChevronRight,
  ChevronDown,
  Info,
  Library,
  Globe,
  Compass,
  Anchor
} from 'lucide-vue-next'
import katex from 'katex'

function m(expr) {
  return katex.renderToString(expr, { throwOnError: false })
}

const activeSection = ref('cinematica')

const sections = [
  { id: 'cinematica', label: 'Galileo Lab', icon: TrendingUp },
  { id: 'sandbox-basico', label: 'Sandbox 2D: Conceptos', icon: Magnet },
  { id: 'sandbox-herramientas', label: 'Sandbox 2D: Herramientas', icon: Wrench },
  { id: 'sandbox-dinamica', label: 'Sandbox 2D: Dinámica', icon: Zap }
]
</script>

<template>
  <div
    class="flex flex-col md:flex-row h-full overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200"
  >
    <!-- Sidebar de Navegación -->
    <aside
      class="w-full md:w-72 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-r border-gray-300/60 dark:border-gray-800/60 flex-shrink-0 flex flex-col z-10 shadow-md dark:shadow-xl"
    >
      <div class="p-6 border-b border-gray-300/60 dark:border-gray-800/60 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-300/20 dark:from-emerald-900/20 to-transparent pointer-events-none"
        ></div>
        <h2
          class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 dark:from-emerald-400 to-teal-200 flex items-center gap-3 relative z-10 drop-shadow-md"
        >
          <BookOpen class="w-7 h-7 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> Manual
        </h2>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 relative z-10 font-medium tracking-wide">
          Guía interactiva de herramientas
        </p>
      </div>
      <nav class="flex-1 overflow-y-auto p-4 space-y-2 relative">
        <button
          v-for="sec in sections"
          :key="sec.id"
          @click="activeSection = sec.id"
          class="w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 relative overflow-hidden group"
          :class="
            activeSection === sec.id
              ? 'text-gray-900 dark:text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
          "
        >
          <div
            v-if="activeSection === sec.id"
            class="absolute inset-0 bg-gradient-to-r from-emerald-200/80 dark:from-emerald-600/80 to-emerald-300/40 dark:to-emerald-900/40 pointer-events-none border border-emerald-800/50 dark:border-emerald-500/50 rounded-xl"
          ></div>
          <div
            v-else
            class="absolute inset-0 bg-gray-200/0 dark:bg-gray-800/0 group-hover:bg-gray-200/40 dark:bg-gray-800/40 transition-colors duration-300 pointer-events-none rounded-xl"
          ></div>

          <component :is="sec.icon" class="w-5 h-5 relative z-10 drop-shadow-md" />
          <span class="relative z-10 tracking-wide">{{ sec.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Área de Contenido Principal -->
    <main class="flex-1 overflow-y-auto p-6 md:p-10 relative">
      <div class="max-w-4xl mx-auto space-y-12 pb-20">
        <!-- SECCIÓN: Galileo Lab -->
        <section v-if="activeSection === 'cinematica'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            <TrendingUp class="w-8 h-8 inline-block mr-2" /> Galileo Lab (Cinemática 1D)
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Keyboard class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Ingreso de Ecuaciones
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                El corazón del simulador de cinemática es la barra de funciones donde escribes la ecuación de
                <strong>posición x(t)</strong>. El sistema calculará automáticamente la
                <strong>velocidad v(t)</strong> (primera derivada) y la <strong>aceleración a(t)</strong> (segunda
                derivada).
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  Usa
                  <kbd
                    class="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-1.5 py-0.5 rounded font-mono text-emerald-700 dark:text-emerald-300"
                    >t</kbd
                  >
                  como la variable independiente de tiempo.
                </li>
                <li>
                  Usa el botón <strong>"Mostrar teclado"</strong> para abrir un teclado virtual matemático si necesitas
                  funciones como <code class="text-emerald-700 dark:text-emerald-300">sin</code>,
                  <code class="text-emerald-700 dark:text-emerald-300">cos</code> o
                  <code class="text-emerald-700 dark:text-emerald-300">exp</code>.
                </li>
                <li>
                  Cualquier letra que no sea 't' (ej. <code class="text-emerald-700 dark:text-emerald-300">A</code>,
                  <code class="text-emerald-700 dark:text-emerald-300">omega</code>) se detectará automáticamente como
                  un <strong>parámetro deslizable</strong>.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Settings class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Parámetros y Tiempo
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Una vez que ingresas variables personalizadas (por ejemplo, `A*sin(omega*t)`), aparecerán en el
                <strong>Panel de Parámetros</strong>.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  Puedes ajustar cada parámetro deslizando la barra o escribiendo un valor numérico exacto en la casilla
                  adjunta.
                </li>
                <li>
                  En el <strong>Control de tiempo</strong>, define el Tiempo Máximo de simulación y usa los botones de
                  <strong>Reproducir (▶)</strong> y <strong>Bucle (🔁)</strong> para animar la partícula a lo largo del
                  eje.
                </li>
                <li>
                  <strong>Atajos Rápidos:</strong> Puedes presionar la tecla <strong>Espacio</strong> o
                  <strong>Enter</strong> para Calcular inmediatamente o alternar entre Pausa y Reproducción.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <BarChart2 class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Gráficos y Resultados en Tiempo
                Real
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                El análisis cuantitativo es fundamental para entender el movimiento de la partícula.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  <strong>Tarjetas Numéricas:</strong> Debajo del bloque de controles, tres grandes tarjetas muestran
                  los valores instantáneos de la Posición (<span v-html="m('m')"></span>), Velocidad (<span
                    v-html="m('m/s')"
                  ></span
                  >) y Aceleración (<span v-html="m('m/s^2')"></span>) calculados para el instante
                  <span v-html="m('t')"></span> actual.
                </li>
                <li>
                  <strong>Tres Gráficas Sincronizadas:</strong> Al fondo de la pantalla encontrarás las curvas de
                  <span v-html="m('x(t)')"></span>, <span v-html="m('v(t)')"></span> y <span v-html="m('a(t)')"></span>.
                  Haz clic sobre cualquiera de las tres gráficas para expandirla a pantalla completa, permitiéndote
                  rastrear con tu mouse los valores exactos, máximos y mínimos con precisión.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <DownloadCloud class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Exportación y Grabación
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                El simulador incluye herramientas nativas para documentar tu experimento:
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  <strong>Exportación de Ecuaciones:</strong> Abre el modal de <em>Desarrollo Analítico</em>. Verás
                  opciones para descargar todas las fórmulas en texto plano (<strong>TXT</strong>) o capturarlas como
                  una imagen renderizada matemáticamente perfecta (<strong>PNG</strong>).
                </li>
                <li>
                  <strong>Guardado de Gráficas:</strong> Cada gráfica (pequeña o ampliada) tiene un botón de descarga
                  (<Download class="w-4 h-4 inline" />). Púlsalo para extraer un archivo PNG limpio de las curvas y sus
                  ejes.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Conceptos -->
        <section v-if="activeSection === 'sandbox-basico'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            <Magnet class="w-8 h-8 inline-block mr-2" /> Newton Lab: Conceptos
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Pause class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Modo Construcción vs Reproducción
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                A diferencia de la cinemática que es predictiva, el Sandbox 2D resuelve dinámicas complejas (colisiones,
                poleas, gravedad) usando un motor físico en tiempo real (Planck.js).
              </p>
              <div
                class="bg-blue-300/20 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 p-4 rounded-lg"
              >
                <h4 class="text-blue-700 dark:text-blue-300 font-bold mb-2">💡 Tip pro: Construye en Pausa</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Presiona el botón de Pausa (<Pause class="w-4 h-4 inline" />) en el panel superior derecho (o presiona
                  la tecla <strong>Espacio</strong> o <strong>Enter</strong>). Mientras está en pausa, la gravedad no
                  afecta a los objetos. Usa la herramienta
                  <strong>Mover (<MousePointer2 class="w-4 h-4 inline" />)</strong> para arrastrar las cajas, apilarlas,
                  cambiar su ángulo y tamaño libremente en el aire. Cuando tengas el escenario listo, dale al Play
                  (<Play class="w-4 h-4 inline" />) (o vuelve a presionar <strong>Espacio</strong>) para que actúe la
                  gravedad.
                </p>
              </div>

              <h4 class="text-emerald-700 dark:text-emerald-300 font-bold mt-6 mb-2">Atajos de Teclado Extendidos</h4>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-2">
                <li><strong>1 a 8:</strong> Cambiar de herramienta rápidamente.</li>
                <li><strong>H:</strong> Seleccionar la herramienta Mano (Mover Cámara).</li>
                <li><strong>Rueda del ratón</strong> o <strong>Teclas + / -:</strong> Hacer Zoom In o Zoom Out.</li>
                <li><strong>Retroceso / Suprimir (o 9):</strong> Herramienta borrar.</li>
                <li><strong>Ctrl + Z / Ctrl + Y:</strong> Deshacer / Rehacer historial.</li>
                <li><strong>Ctrl + R:</strong> Iniciar / Detener grabación de telemetría.</li>
              </ul>
            </div>

            <!-- NUEVO: SISTEMA DE UNIDADES -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Globe class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Sistema Internacional vs Inglés
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                El simulador permite alternar libremente entre dos sistemas de unidades para todo el lienzo.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  <strong>Sistema Internacional (SI):</strong> Trabaja en metros (m) para distancia, kilogramos (kg) para masa, y metros por segundo cuadrado (m/s²) para aceleración.
                </li>
                <li>
                  <strong>Sistema Inglés (US):</strong> Trabaja en pies (ft) para distancia, libras de masa (lb) para masa, y pies por segundo cuadrado (ft/s²) para aceleración.
                </li>
              </ul>
              <div
                class="mt-4 bg-emerald-300/20 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 p-4 rounded-lg"
              >
                <h4 class="text-emerald-700 dark:text-emerald-300 font-bold mb-2">💡 ¿Cómo cambiar de sistema?</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                  En el panel derecho (Panel de Contexto), verás un interruptor <strong>(SI / US)</strong>. Al hacer clic, el entorno completo cambiará sus unidades (incluidas las herramientas de medición, la telemetría, y la gravedad que pasará de 9.81 a 32.174).
                </p>
              </div>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <FolderOpen class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Plantillas y Ejemplos
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                El simulador incluye 16 archivos JSON de ejemplos integrados que abarcan desde conceptos básicos hasta
                montajes complejos (poleas, vehículos, péndulos dobles, rieles y catapultas).
              </p>
              <div
                class="bg-emerald-300/20 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 p-4 rounded-lg"
              >
                <h4 class="text-emerald-700 dark:text-emerald-300 font-bold mb-2">💡 ¿Cómo usarlos?</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                  En el simulador 2D, haz clic en el botón de
                  <strong>Biblioteca (<Library class="w-4 h-4 inline" />)</strong> de la barra superior. Esto te llevará
                  directamente al repositorio en GitHub. Descarga cualquiera de los archivos JSON de la carpeta
                  <code>ejemplos/</code> y luego usa el botón
                  <strong>Cargar Escena (<FolderOpen class="w-4 h-4 inline" />)</strong> para abrirlos en tu lienzo.
                </p>
              </div>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Radio class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Telemetría (Panel de Datos)
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                En la esquina inferior izquierda puedes visualizar el <strong>Centro de Telemetría</strong>. Por defecto
                se encuentra oculto para darte un espacio de trabajo limpio, pero puedes activarlo en cualquier momento
                usando el botón de <strong>Estadísticas (<BarChart2 class="w-4 h-4 inline" />)</strong> en la barra
                superior.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  Muestra la <strong>Aceleración de Gravedad</strong> (fija en
                  <span v-html="m('9.81 \\, m/s^2')"></span> hacia el sur del lienzo).
                </li>
                <li>
                  Al dar clic en una caja con la herramienta Mover (<MousePointer2 class="w-4 h-4 inline" />),
                  observarás su Masa actual, Coeficiente de Fricción, y las coordenadas cartesianas de su Centro de Masa
                  (X, Y).
                </li>
                <li>
                  Además, verás vectores interactivos de <strong>Velocidad Lineal</strong> (<span
                    v-html="m('v_x, v_y')"
                  ></span
                  >) y <strong>Velocidad Angular</strong> (<span v-html="m('\\omega')"></span>). Esta telemetría es útil
                  para confirmar experimentalmente si un sistema ha alcanzado el equilibrio estático o si retiene
                  energía residual invisible a simple vista.
                </li>
              </ul>
              <div
                class="mt-4 bg-emerald-300/20 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 p-4 rounded-lg"
              >
                <h4 class="text-emerald-700 dark:text-emerald-300 font-bold mb-2">📊 Grabador de Telemetría (NUEVO)</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                  En la barra superior, junto a "Importar", dispones del botón
                  <strong><CircleDot class="w-4 h-4 inline" /> (Grabar)</strong>. Al pulsarlo, el simulador empezará a
                  grabar internamente todas las posiciones, velocidades, <strong>aceleraciones (X, Y)</strong> y ángulos
                  de todas las cajas y anillas a 30 muestras por segundo.
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Pulsa luego en <strong><Square class="w-4 h-4 inline" /> (Exportar CSV)</strong> para descargar un
                  archivo que podrás abrir nativamente en <strong>Microsoft Excel</strong> para realizar análisis
                  matemáticos del experimento.
                  <em>Atajo: Usa <strong>Ctrl + R</strong> para iniciar/detener la grabación rápidamente.</em>
                </p>
              </div>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Maximize class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Interfaz y Responsividad
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                El simulador está diseñado para darte el máximo espacio posible, especialmente en dispositivos móviles.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  <strong>Forzado a Horizontal (Landscape):</strong> Si usas un celular, al darle al botón de Pantalla
                  Completa (<Maximize class="w-4 h-4 inline" />) tu dispositivo rotará automáticamente a horizontal,
                  dándote todo el ancho necesario para operar las herramientas cómodamente.
                </li>
                <li>
                  <strong>Barra de Herramientas Deslizable:</strong> En pantallas pequeñas, la barra de herramientas
                  inferior se vuelve deslizable de forma horizontal (scroll) para asegurar que todos los íconos quepan
                  perfectamente sin dañar la vista del experimento.
                </li>
                <li>
                  <strong>Ocultar Propiedades (<EyeOff class="w-4 h-4 inline" />):</strong> El panel de propiedades
                  (donde cambias masas y ángulos) tiene un botón de "Ojo" en la esquina superior derecha. Tócalo para
                  colapsar todo el panel en un diminuto círculo y liberar aún más pantalla.
                </li>
                <li>
                  <strong>Temas y Modo Oscuro:</strong> El simulador soporta un tema claro (colorido) y un modo oscuro (elegante) estilo LaTeX. Para cambiar entre ellos, usa el interruptor situado en la esquina superior derecha de la aplicación.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <History class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Historial y Persistencia (Deshacer y
                Exportar)
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                El entorno tiene un manejo de estado seguro. Nunca perderás tus experimentos.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  <strong>Deshacer y Rehacer:</strong> Presiona <strong>Ctrl + Z</strong> para deshacer el último
                  objeto, choque, o eliminación que hayas realizado. El motor memoriza hasta 50 estados completos
                  anteriores. También puedes usar <strong>Ctrl + Y</strong> para rehacer. <em>Nota:</em> También existen
                  botones gráficos (<Undo2 class="w-4 h-4 inline" /> / <Redo2 class="w-4 h-4 inline" />) en el panel
                  superior.
                </li>
                <li>
                  <strong>Guardar y Cargar:</strong> Usa los botones de <strong>Exportar Escena</strong> (<Download
                    class="w-4 h-4 inline"
                  />) e <strong>Importar Escena</strong> (<FolderOpen class="w-4 h-4 inline" />) para extraer y cargar
                  archivos <code>.json</code>. Esto te permite compartir tus laboratorios con terceros.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Herramientas -->
        <section v-if="activeSection === 'sandbox-herramientas'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            <Wrench class="w-8 h-8 inline-block mr-2" /> Herramientas de Construcción (Sandbox)
          </h1>
          <p
            class="text-sm text-gray-700 dark:text-gray-300 mb-6 bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-300 dark:border-gray-700"
          >
            <strong>💡 Atajos de teclado:</strong> Puedes cambiar rápidamente de herramienta presionando los números del
            teclado. <br />
            [1]: Mover, [2]: Caja, [3]: Terreno, [4]: Cuerda, [5]: Resorte, [6]: Polea, [7]: Riel, [8]: Fuerza.
            [Suprimir/Retroceso]: Borrar objeto.
          </p>

          <div class="space-y-8">
            <!-- HERRAMIENTA 1: MOVER Y CAJAS -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <span class="flex items-center gap-1"
                    ><MousePointer2 class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> /
                    <Box class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                  /></span>
                  Mover, Propiedades y Cajas
                </h3>
                <div class="flex gap-2">
                  <span
                    class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                    >Atajos: 1 y 2</span
                  >
                </div>
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Usa la tecla <strong>2</strong> para soltar bloques de madera sobre el lienzo. Usa la tecla
                  <strong>1</strong> para arrastrarlos con el ratón. Al dar clic en un bloque con la herramienta Mover,
                  se abre el <strong>Panel Derecho</strong> de propiedades.
                </p>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <BookOpen class="w-4 h-4 text-emerald-600" /> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  En el panel lateral interactúas directamente con las <strong>Leyes de Newton</strong>:
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Masa (<span v-html="m('m')"></span>):</strong> Modificarla altera la inercia del cuerpo. El
                    simulador recalcula internamente la densidad (<span v-html="m('\\rho')"></span>) para mantener el
                    volumen físico intacto.
                  </li>
                  <li>
                    <strong>Fricción (<span v-html="m('\\mu')"></span>):</strong> Controla el coeficiente de roce. Si lo
                    subes al máximo, las cajas no resbalarán en planos inclinados.
                  </li>
                  <li><strong>Restitución:</strong> El "rebote" (elasticidad) de las colisiones.</li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Puedes cambiar la geometría (ancho y alto) en caliente; el motor físico empujará
                  instantáneamente cualquier objeto que se superponga (resolución de interpenetración).
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 2.5: MEDICIÓN Y COTAS -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Compass class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Medición y Cotas
                </h3>
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra el ratón desde cualquier punto del lienzo hasta otro. El simulador trazará una cota de arquitectura permanente, mostrando la distancia exacta entre ambos puntos en el sistema de unidades actual.
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA: FIJADOR Y RODILLOS -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Anchor class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Fijador y 
                  <CircleDot class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Rodillos
                </h3>
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Fijador (Anclaje):</strong> Da clic en cualquier cuerpo dinámico con la herramienta Fijador. Esto convertirá el objeto instantáneamente en un cuerpo estático de masa infinita (anclado en el espacio). Vuelve a dar clic para liberarlo.
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Rodillos:</strong> Da clic en cualquier objeto estático o dinámico con la herramienta Rodillos. Esto le agregará un apoyo deslizante en la parte inferior, ideal para simular carritos de dinámica sin preocuparse por rotaciones complejas.
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 3: TERRENO -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Ruler class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Terrenos y Planos Inclinados
                </h3>
                <span
                  class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                  >Atajo: 3</span
                >
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra el ratón libremente por el fondo para esculpir montañas de colisión. Alterna al
                  <strong>Modo Recto</strong> y escribe un ángulo numérico exacto para generar rampas perfectas.
                  <strong>Novedad:</strong> Cada vez que dibujas, el terreno se *añade* (no se borra el anterior). Esto
                  te permite dibujar múltiples barreras y pisos en el mismo mapa.
                </p>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <BookOpen class="w-4 h-4 text-emerald-600" /> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  El terreno funciona como un <strong>Cuerpo Estático (Static Body)</strong> de masa infinita: nunca se
                  moverá, sin importar la fuerza de los impactos.
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Plano Inclinado:</strong> Ideal para experimentar con la descomposición del peso: Fuerza
                    Normal (<span v-html="m('N = m \\cdot g \\cdot \\cos(\\theta)')"></span>) y Fuerza Tangencial (<span
                      v-html="m('P_t = m \\cdot g \\cdot \\sin(\\theta)')"
                    ></span
                    >).
                  </li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Con la herramienta Mover (1), da clic sobre el terreno dibujado. Podrás editar su coeficiente
                  de fricción específico en el panel derecho (hielo vs. asfalto).
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 4: CUERDAS -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Link class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Cuerdas Rígidas
                </h3>
                <span
                  class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                  >Atajo: 4</span
                >
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra desde el centro de una caja hasta otra para unirlas permanentemente con una cadena
                  inextensible. Al arrastrar, <strong>verás que el sistema inteligente hará "snap"</strong> (atraerá tu
                  ratón al objetivo) y proyectará un brillo verde para confirmar con qué cuerpo vas a enganchar la
                  cuerda.
                </p>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <BookOpen class="w-4 h-4 text-emerald-600" /> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  En física algorítmica, esto se denomina un <strong>Distance Joint</strong> (Restricción de Distancia).
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Tensión Dinámica:</strong> Mientras la distancia entre cuerpos intente ser mayor a la
                    longitud de la cuerda, el motor ejercerá una fuerza de reacción instantánea. Visualmente, verás una
                    <strong>flecha roja (Vector de Tensión)</strong> a lo largo de la cuerda.
                  </li>
                  <li>
                    Si los objetos se acercan, la cuerda se "afloja" y no ejerce fuerza, desapareciendo la flecha roja.
                  </li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Usa Pausa (Espacio) antes de colocar cuerdas. Así evitarás que las cajas colapsen mientras las
                  conectas.
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 5: RESORTES -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Spline class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Resortes Elásticos
                </h3>
                <span
                  class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                  >Atajo: 5</span
                >
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra de caja a caja, o de caja a vacío. Aparecerá una banda morada ondulada. Selecciona el resorte
                  con la herramienta Mover (1) para abrir sus ajustes avanzados.
                </p>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <span class="text-emerald-600">📚</span> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Regido enteramente por la <strong>Ley de Hooke Generalizada</strong>
                  <span v-html="m('F = -k \\cdot x - c \\cdot v')"></span>. En el panel puedes modificar:
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Frecuencia (Hz) - Constante k:</strong> Rigidez. Un valor alto (ej: 10 Hz) crea un muelle
                    tenso y rápido; un valor bajo (1 Hz) simula una liga elástica suave.
                  </li>
                  <li>
                    <strong>Amortiguamiento (<span v-html="m('c')"></span>):</strong> Disipa la energía estiramiento
                    tras estiramiento, forzando al sistema a estabilizarse.
                  </li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Arma un bloque colgado de un resorte. Abre el Panel de Telemetría (inferior izquierdo) y mira
                  cómo las gráficas de Velocidad Lineal Y trazan senoides perfectas perdiendo amplitud.
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 6: POLEAS -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <Disc class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Poleas Ideales
                </h3>
                <span
                  class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                  >Atajo: 6</span
                >
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express (Dos Pasos)
                </h4>
                <ol class="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                  <li>
                    Arrastra desde la <strong>Caja A</strong> hasta la pared/techo. Esto anclará la rueda (pin
                    amarillo).
                  </li>
                  <li>
                    Arrastra desde la <strong>Caja B</strong> y
                    <strong>suelta exactamente sobre el pin amarillo</strong>. ¡El sistema de polea se cerrará!
                  </li>
                </ol>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <BookOpen class="w-4 h-4 text-emerald-600" /> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  La polea ideal asume una cuerda de longitud constante <span v-html="m('L = l_1 + l_2')"></span> sin
                  fricción interna en la rueda.
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Tensión Uniforme:</strong> La magnitud de la tensión (que verás dibujada como flechas rojas)
                    es matemáticamente idéntica en ambos segmentos del cable.
                  </li>
                  <li>
                    <strong>Máquina de Atwood:</strong> Si conectas dos masas diferentes y dejas caer el sistema, la
                    telemetría registrará una aceleración neta proporcional a
                    <span v-html="m('\\frac{m_1 - m_2}{m_1 + m_2} \\cdot g')"></span>.
                  </li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Para borrar una polea o una cuerda mal hecha, simplemente presiona el atajo
                  <strong>Suprimir/Retroceso</strong> mientras arrastras, o usa la herramienta Mover y luego bórrala.
                </p>
              </div>
            </div>

            <!-- HERRAMIENTA 7: RIEL -->
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300"
            >
              <div
                class="flex flex-wrap items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 gap-2"
              >
                <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                  <CircleDashed class="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Riel de Movimiento Circular
                </h3>
                <span
                  class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-700"
                  >Atajo: 7</span
                >
              </div>

              <div class="mb-5">
                <h4
                  class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap class="w-4 h-4 text-emerald-500" /> Uso Express
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra desde una caja hasta un punto vacío. Se dibujará una órbita circular transparente. La caja
                  quedará confinada a deslizarse permanentemente por el perímetro de dicho círculo.
                </p>
              </div>

              <div
                class="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
              >
                <h4
                  class="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 uppercase tracking-wider flex items-center gap-2"
                >
                  <BookOpen class="w-4 h-4 text-emerald-600" /> Fundamento Físico y Datos
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Es una variante extrema de restricción geométrica donde el radio de curvatura
                  <span v-html="m('R')"></span> es absolutamente inmutable.
                </p>
                <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Aceleración Centrípeta:</strong> El riel absorbe toda la inercia radial de la caja,
                    garantizando que el bloque tenga componentes angulares (<span v-html="m('\\omega')"></span>)
                    perfectas.
                  </li>
                </ul>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  💡 Tip: Excelente para demostrar que, incluso en el punto más bajo de un péndulo, la aceleración no es
                  cero debido al empuje centrípeto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Dinámica -->
        <section v-if="activeSection === 'sandbox-dinamica'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            <Zap class="w-8 h-8 inline-block mr-2" /> Sandbox 2D: Dinámica y Fuerzas
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-orange-400 mb-3 flex items-center gap-2">
                <ArrowUpToLine class="w-6 h-6 text-orange-400" /> Aplicar Fuerza Continua o Impulsos
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Selecciona la herramienta de Fuerza (➤) y luego haz clic sobre una caja para convertirla en tu objetivo.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-orange-300 font-bold mb-2">Fuerza Continua (Motor)</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Ingresa una Magnitud (N) y un Ángulo (°). Presiona
                    <strong><Play class="w-4 h-4 inline" /> Activar continua</strong>.
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    El motor físico le inyectará esa fuerza en cada fotograma, simulando un cohete propulsor o alguien
                    empujando constantemente el bloque.
                  </p>
                </div>
                <div>
                  <h4 class="text-amber-300 font-bold mb-2">Impulso Único (Golpe)</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Usando los mismos parámetros numéricos, presiona
                    <strong><Zap class="w-4 h-4 inline" /> Aplicar impulso único</strong>.
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Le aplicará toda esa energía en un solo instante, simulando un bate de béisbol golpeando la caja o
                    una bala impactando contra ella.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
