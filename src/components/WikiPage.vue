<script setup>
// src/components/WikiPage.vue
import { ref } from 'vue'
import katex from 'katex'

function m(expr) {
  return katex.renderToString(expr, { throwOnError: false })
}

const activeSection = ref('cinematica')

const sections = [
  { id: 'cinematica', label: 'Cinemática 1D', icon: '📈' },
  { id: 'sandbox-basico', label: 'Sandbox 2D: Conceptos', icon: '🧲' },
  { id: 'sandbox-herramientas', label: 'Sandbox 2D: Herramientas', icon: '🛠️' },
  { id: 'sandbox-dinamica', label: 'Sandbox 2D: Dinámica', icon: '⚡' }
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
          <span class="text-2xl drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">📖</span> Manual
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

          <span class="relative z-10 text-lg drop-shadow-md">{{ sec.icon }}</span>
          <span class="relative z-10 tracking-wide">{{ sec.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Área de Contenido Principal -->
    <main class="flex-1 overflow-y-auto p-6 md:p-10 relative">
      <div class="max-w-4xl mx-auto space-y-12 pb-20">
        <!-- SECCIÓN: Cinemática 1D -->
        <section v-if="activeSection === 'cinematica'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            📈 Simulador de Cinemática 1D
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <span>⌨️</span> Ingreso de Ecuaciones
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
                <span>⚙️</span> Parámetros y Tiempo
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
                <span>📊</span> Gráficos y Resultados en Tiempo Real
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
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Conceptos -->
        <section v-if="activeSection === 'sandbox-basico'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            🧲 Sandbox Físico 2D: Conceptos
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <span>⏸️</span> Modo Construcción vs Reproducción
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
                  Presiona el botón de Pausa ⏸ en el panel superior derecho (o presiona la tecla
                  <strong>Espacio</strong> o <strong>Enter</strong>). Mientras está en pausa, la gravedad no afecta a
                  los objetos. Usa la herramienta <strong>Mover (✋)</strong> para arrastrar las cajas, apilarlas,
                  cambiar su ángulo y tamaño libremente en el aire. Cuando tengas el escenario listo, dale al Play ▶ (o
                  vuelve a presionar <strong>Espacio</strong>) para que actúe la gravedad.
                </p>
              </div>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <span>📡</span> Telemetría (Panel de Datos)
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                En la esquina inferior izquierda verás un pequeño panel translúcido: el
                <strong>Centro de Telemetría</strong>.
              </p>
              <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  Muestra la <strong>Aceleración de Gravedad</strong> (fija en
                  <span v-html="m('9.81 \\, m/s^2')"></span> hacia el sur del lienzo).
                </li>
                <li>
                  Al dar clic en una caja con la herramienta ✋, observarás su Masa actual, Coeficiente de Fricción, y
                  las coordenadas cartesianas de su Centro de Masa (X, Y).
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
            </div>
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Herramientas -->
        <section v-if="activeSection === 'sandbox-herramientas'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            🛠️ Herramientas de Construcción (Sandbox)
          </h1>
          <p
            class="text-sm text-gray-700 dark:text-gray-300 mb-6 bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-300 dark:border-gray-700"
          >
            <strong>💡 Atajos de teclado:</strong> Puedes cambiar rápidamente de herramienta presionando los números del
            teclado. <br />
            [1]: Mover, [2]: Caja, [3]: Terreno, [4]: Cuerda, [5]: Resorte, [6]: Polea, [7]: Riel, [8]: Fuerza.
            [Suprimir/Retroceso]: Borrar objeto.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>✋</span> Mover y Modificar
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                La herramienta principal. Arrastra objetos para moverlos. Haz clic en una caja para abrir su panel de
                propiedades, donde puedes definir con precisión numérica:
              </p>
              <ul class="text-xs text-gray-600 dark:text-gray-500 list-disc list-inside space-y-1">
                <li><strong>Masa:</strong> Afecta la inercia y gravedad.</li>
                <li><strong>Fricción:</strong> Rugosidad del material.</li>
                <li>
                  <strong>Ángulo, Ancho, Alto:</strong> Modifican la geometría. La densidad se ajusta sola para mantener
                  la masa.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>✏️</span> Dibujar Terreno
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Crea suelos estáticos. Puedes trazar un piso <strong>Libre</strong> arrastrando por la pantalla, o
                cambiar al modo <strong>Recto 📐</strong> para crear un plano inclinado exacto definiendo el ángulo
                numéricamente.
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-500">
                Haz clic en un terreno ya dibujado (con la herramienta Mover) para cambiarle su fricción independiente.
              </p>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>〰️</span> Cuerdas y Resortes
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Arrastra desde una caja hasta otra para unirlas. Si sueltas el ratón en el aire vacío, se creará un
                punto de anclaje <strong>Fijo (marcado en amarillo)</strong>.
              </p>
              <ul class="text-xs text-gray-600 dark:text-gray-500 list-disc list-inside space-y-1">
                <li>
                  <strong>Cuerdas:</strong> Mantienen una distancia máxima estricta. Verás la flecha roja de
                  <em>Tensión</em> si la cuerda está tensa, y desaparecerá si la cuerda se afloja.
                </li>
                <li>
                  <strong>Resortes:</strong> Permiten oscilación libre (Ley de Hooke). Desde el panel de propiedades
                  puedes afinar su Frecuencia elástica (<span v-html="m('k')"></span>) y su Amortiguamiento para simular
                  resortes de coche, gomas elásticas, etc.
                </li>
              </ul>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>🎡</span> Poleas (Flujo de 2 pasos)
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Para crear una polea real (donde el cable de un lado tira del otro sobre una misma rueda):
              </p>
              <ol class="text-xs text-gray-600 dark:text-gray-500 list-decimal list-inside space-y-1">
                <li>
                  Arrastra desde la Caja A hasta la esquina (por ejemplo, de un acantilado). Esto crea la
                  <strong>rueda</strong> (punto amarillo).
                </li>
                <li>
                  Arrastra desde la Caja B y suelta <strong>exactamente sobre la rueda amarilla</strong> para cerrar el
                  sistema.
                </li>
              </ol>
            </div>

            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-3xl p-6 shadow-md dark:shadow-xl relative overflow-hidden group md:col-span-2 hover:shadow-[0_10px_20px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <h3 class="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>⭕</span> Riel Circular (Collar)
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Restringe el movimiento de una caja a una trayectoria circular perfecta. Arrastra desde la caja hasta el
                centro deseado. Útil para simular un péndulo estricto o una cuenta deslizando por un alambre curvo.
              </p>
            </div>
          </div>
        </section>

        <!-- SECCIÓN: Sandbox 2D Dinámica -->
        <section v-if="activeSection === 'sandbox-dinamica'" class="animate-fade-in">
          <h1
            class="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-300 dark:border-gray-800 pb-4"
          >
            ⚡ Sandbox 2D: Dinámica y Fuerzas
          </h1>

          <div class="space-y-8">
            <div
              class="bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-300/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-lg dark:shadow-2xl relative overflow-hidden group hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500"
            >
              <h3 class="text-xl font-bold text-orange-400 mb-3 flex items-center gap-2">
                <span>➤</span> Aplicar Fuerza Continua o Impulsos
              </h3>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                Selecciona la herramienta de Fuerza (➤) y luego haz clic sobre una caja para convertirla en tu objetivo.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-orange-300 font-bold mb-2">Fuerza Continua (Motor)</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Ingresa una Magnitud (N) y un Ángulo (°). Presiona <strong>▶ Activar continua</strong>.
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    El motor físico le inyectará esa fuerza en cada fotograma, simulando un cohete propulsor o alguien
                    empujando constantemente el bloque.
                  </p>
                </div>
                <div>
                  <h4 class="text-amber-300 font-bold mb-2">Impulso Único (Golpe)</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Usando los mismos parámetros numéricos, presiona <strong>⚡ Aplicar impulso único</strong>.
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
