# Simulador Cinemático y Dinámico V1 - Laboratorio Virtual Avanzado

Bienvenidos al **Simulador Cinemático y Dinámico V1**, un entorno virtual inmersivo, altamente interactivo y rigurosamente exacto, desarrollado bajo **Vue 3** y **Vite**. Este proyecto ha sido concebido específicamente para la modelación topológica y la resolución paramétrica de sistemas físicos tanto en cinemática (1D) como en dinámica de cuerpos rígidos (2D). 

Este proyecto trasciende las herramientas de dibujo tradicionales al fusionar un motor de análisis algebraico continuo con un motor de dinámica determinista. Su objetivo no es solo visualizar, sino permitir la recolección, el escrutinio y la experimentación con leyes físicas en tiempo real, garantizando exactitud matemática en cada interacción. 

El sistema opera a través de una arquitectura puramente *Client-Side* (Renderizado del lado del Cliente). Esto garantiza privacidad total, nula latencia de red en las integraciones matemáticas, y la capacidad de operar en entornos sin conexión a internet (*offline*). Está diseñado meticulosamente para estudiantes de ingeniería mecánica, física aplicada, docentes universitarios y entusiastas de la simulación.

---

## 🚀 Análisis Profundo de Características y Arquitectura Funcional

El simulador se divide lógicamente en dos macro-entornos interconectados, diseñados para abarcar el estudio de la mecánica newtoniana en diferentes dimensiones espaciales y conceptuales.

### 1. Submódulo de Cinemática (1D): Análisis Diferencial y Trayectorias

A diferencia de los simuladores pedagógicos básicos que estiman variables mediante algoritmos discretos (como la aproximación $v = \Delta x / \Delta t$, sujeta siempre a un inevitable ruido numérico o error de truncamiento), este módulo emplea un parser algebraico robusto (vía Árboles de Sintaxis Abstracta generados por `MathJS`). Esto permite operar matemáticamente con las mismas funciones continuas que se utilizan en la pizarra de un aula.

*   **Derivación Analítica Automática y Simbólica:** 
    El usuario ingresa una trayectoria posicional paramétrica dependiente del tiempo $x(t)$ (por ejemplo, una ecuación polinómica, trigonométrica o exponencial). El sistema compila y "entiende" la ecuación, procediendo a derivar analíticamente la función de velocidad $v(t) = x'(t)$ y de aceleración $a(t) = v'(t)$. Todo este cómputo simbólico ocurre en milisegundos, graficando las tres curvas simultáneamente de manera exacta, sin recurrir a integraciones numéricas.
*   **Gráficos Telemétricos de Alta Frecuencia:** 
    Se han integrado bibliotecas gráficas de alto rendimiento (Chart.js) para renderizar y graficar series de tiempo densas. Las funciones pueden evaluarse en miles de puntos en el tiempo de forma instantánea, permitiendo análisis granulares y visualizaciones suaves. Además, los datos numéricos tabulados pueden exportarse directamente.
*   **Inyección Dinámica de Parámetros de Simulación:** 
    Una de las características más avanzadas es el reconocimiento inteligente de variables estáticas o abstractas. Si un usuario inyecta variables arbitrarias (e.g., masa $m$, constante elástica $k$, frecuencia armónica angular $\omega$) dentro de su ecuación $x(t)$, el motor las detecta de inmediato, procesa el Árbol de Sintaxis Abstracta (AST), e inyecta dinámicamente un panel de controles deslizantes (sliders). Mover estos sliders regenera la gráfica completa en tiempo real.

### 2. Sandbox de Dinámica (2D): Laboratorio Espacial Computacional

Este entorno está construido utilizando la fiabilidad determinista de `Planck.js`, que es una reescritura pura y estricta en JavaScript del célebre motor Box2D (escrito en C++ por Erin Catto). 

*   **Tipología de Cuerpos y Estados de Agregación:** 
    El motor permite la creación, destrucción y mutación de propiedades de diferentes entidades vectoriales en tiempo de ejecución:
    *   **Estáticos:** Cuerpos anclados al marco inercial (muros, terrenos inclinados, polígonos base).
    *   **Cinemáticos:** Cuerpos que desafían las fuerzas externas pero responden a la manipulación del usuario o del código.
    *   **Dinámicos:** Masas libres (cajas, esferas, polígonos asimétricos masivos) que reaccionan de manera conservativa a fuerzas gravitacionales, empujes externos y choques inelásticos o elásticos.
*   **Restricciones Topológicas Avanzadas (Joints):**
    Más allá del movimiento libre, el sistema permite interconectar entidades mediante constricciones geométricas denominadas *Joints*:
    *   **Amortiguamiento y Resortes (Distance Joint):** Aplicación estricta de la Ley de Hooke tridimensional. Se otorgan parámetros de usuario para ajustar la rigidez y el disipador (amortiguamiento).
    *   **Poleas y Cuerdas (Pulley Joint):** Modelado exacto de tensores inelásticos. La ecuación de conservación asegura que la suma de segmentos suspendidos se mantenga constante, simulando una transmisión de fuerza idónea.
    *   **Apoyos y Rodillos:** Utilizando la manipulación extrema de la propiedad física de fricción ($\mu \to 0$), es posible diseñar bloques y rampas que operan como correderas ideales de nulo roce transversal.
*   **Instrumentación Topográfica, Medición y Telemetría Virtual:**
    Se diseñaron herramientas analíticas no intrusivas:
    *   **Regla Euclideana:** Extrae la longitud exacta $\sqrt{dx^2 + dy^2}$ entre dos nodos.
    *   **Sensores Angulares:** Medición del ángulo polar $\theta$ respecto al eje inercial.
    *   **Telemetría de Altura:** Detecta iterativamente la coordenada máxima $Y$ alcanzada por un cuerpo masivo, simulando el cálculo de $h_{\text{max}}$ en un lanzamiento balístico o parabólico.

### 3. Orquestación del Rendimiento, Memoria y Experiencia del Usuario (UX)

Para que el software web actúe como un programa nativo compilado, su arquitectura subyacente ha sido fuertemente intervenida y optimizada.

*   **Aislamiento de Lógica Computacional (Vue + Planck):** 
    El núcleo más delicado de este simulador recae en la perfecta pero peligrosa coexistencia entre el DOM Reactivo (Vue.js) y el Loop Cíclico Numérico (Planck.js). Se ha diseñado una arquitectura donde la interfaz nunca invade la memoria del motor físico. Para lograr esto, se encapsuló toda instanciación de Box2D/Planck utilizando Proxies crudos (`markRaw` en Vue 3), lo cual detiene el rastreo de dependencias de Vue. Esto garantiza que las millones de operaciones flotantes ejecutadas a 60 FPS ocurran de manera fluida y libre del embotellamiento del recolector de basura de JavaScript.
*   **Gestor de Estados (Sistema Undo/Redo Profundo):** 
    Se ha integrado un poderoso administrador de instantáneas (*snapshots*) apiladas tipo LIFO (Last-In, First-Out). Cada acción destructiva o constructiva desencadena una serialización binaria/JSON de todo el universo físico actual (vértices topológicos, uniones, propiedades materiales). Este historial mantiene una profundidad de 50 pasos, mitigando todo error humano durante laboratorios experimentales, sin llegar a sofocar la memoria RAM del cliente.
*   **Atajos Teclados Asíncronos Avanzados:**
    Para usuarios frecuentes, docentes y creadores de contenido, la velocidad de modelado es crucial. Se integró un Listener asíncrono para mutar herramientas mediante atajos rápidos de teclado (ej. presionar `B` o `2` activa Cajas, `F` o `8` inyecta Fuerzas puras). El sistema es lo suficientemente robusto como para evadir ejecuciones fantasma cuando el usuario está tecleando ecuaciones en las barras laterales.

---

## 🛠️ Stack Tecnológico Completo y Ecosistema de Librerías

El desarrollo de este sistema está respaldado por las dependencias web más veloces y estrictas disponibles en el mercado actual (2024+). Todo ha sido integrado siguiendo patrones *Enterprise* para aplicaciones matemáticas.

*   **Core / Framework de UI:** [Vue.js 3](https://vuejs.org/). Implementación exhaustiva bajo el paradigma *Composition API* (`<script setup>`), otorgando separación lógica y extrema reutilización de *composables*.
*   **Motor Estilizado Global:** [Tailwind CSS 3](https://tailwindcss.com/). Un diseño de interfaces de usuario construido mediante el modelo *Utility-First*. Soporta perfiles responsivos (móviles/tablets) de las barras de herramientas de manera condicional, paletas semánticas y un robusto soporte de Modo Oscuro nativo a nivel del sistema operativo.
*   **Procesamiento Matemático:** [MathJS](https://mathjs.org/). El parser algebraico de referencia para computación simbólica en Node.js y la Web.
*   **Motor Físico (Dinámica 2D):** [Planck.js](https://piqnt.com/planck.js/). Solución determinista y compatible *cross-platform* que aplica integración paramétrica de choques impulsivos elásticos.
*   **Renderizado Cartesiano y Análisis:** [Chart.js](https://www.chartjs.org/) + *vue-chartjs*. Utilizado para la telemétrica en la vista de cinemática, soportando miles de marcas (`ticks`) temporales sin bloqueo (non-blocking render).
*   **Sintaxis Tipográfica Científica:** [KaTeX](https://katex.org/). Para mantener un estándar universitario, los símbolos, variables, resultados y funciones paramétricas se envían como `Strings` puras de texto al renderizador KaTeX, que las proyecta como gráficos matemáticos nítidos y ultra rápidos, superando a competidores como MathJax.
*   **Iconografía Vectorial:** Lucide Vue Next. Empleo de SVGs ultra-ligeros e incrustados para la UI, sin necesidad de cargar pesadas fuentes iconográficas externas.
*   **Construcción y Empaquetado:** [Vite](https://vitejs.dev/). Empaquetador *Rollup-based* responsable de la experiencia de desarrollo (Hot Module Replacement instantáneo) y la minimización radical del empaquetado para producción (Tree Shaking, Minification).

---

## 📂 Árbol Arquitectónico de Directorios del Proyecto

La estructura del código fuente obedece al diseño por dominios y separación de lógicas de presentación contra dominios matemáticos.

```text
espe-simulador-cinematico/
├── public/                 # Archivos estáticos inmutables (Favicons, webmanifest).
├── src/
│   ├── assets/             # Recursos estáticos locales para el compilador (tipografías KaTeX, CSS Base).
│   ├── components/         # Capa superior de Controladores de Vista.
│   │   ├── kinematics/     # Submódulo Cinemático 1D (Sliders abstractos, Gráficas Chart.js).
│   │   ├── physics/        # Submódulo Dinámico 2D (Canvas interactivos HTML5, Configuración de Escenarios, Barras de Herramientas Inteligentes).
│   │   ├── KinematicsSimulator.vue  # Componente orquestador maestro para físicas de punto material.
│   │   └── WikiPage.vue    # Módulo de aprendizaje incorporado (Leyes de Newton, Guías).
│   ├── composables/
│   │   └── usePlanckWorld.js # El núcleo matemático. Conecta la capa de UI de Vue con el simulador abstracto de Box2D. Maneja inicialización de cuerpos, iteraciones 60hz, y aplicación de markRaw().
│   ├── utils/
│   │   ├── downloadCsv.js  # Lógica binaria (Blob) que transfiere arrays a hojas tabulares in-memory para descarga sin requerir servidor.
│   │   └── shapeUtils.js   # Librería trigonométrica pesada. Implementa el "Shoelace Algorithm" (Teorema de Gauss) para calcular áreas exactas de polígonos complejos dibujados a mano alzada.
│   ├── App.vue             # Raíz reactiva. Renderiza condicionalmente entre Simulador 1D, 2D y la Enciclopedia.
│   └── main.js             # Punto de inicialización de la SPA. Define el montaje y el contexto global de Vue.
├── ejemplos/               # Base de datos local (JSON Files) que contiene 21 simulaciones arquitectónicas pre-guardadas, incluyendo péndulos dobles, puentes y máquinas de Atwood.
├── package.json            # Metadatos NPM, versiones dependientes estrictas y Scripts CLI de despliegue.
├── tailwind.config.js      # Declaración de variables y estilos de utilidad, modos oscuros.
└── vite.config.js          # Directivas críticas para la resolución de módulos (Paths) y optimizaciones de compilación para la V8/Browser.
```

---

## ⚙️ Procedimiento de Instalación, Compilación y Despliegue

Dada su naturaleza basada en NPM (*Node Package Manager*), el proyecto carece de las pesadas dependencias backend que involucran lenguajes como Python, Java o bases de datos como SQL. Esto posibilita un despliegue increíblemente ágil.
Asegúrate de contar con [Node.js](https://nodejs.org/) (versión 18 LTS o superior) correctamente instalado en tu variable `PATH` antes de proceder.

```bash
# 1. Obtención del Código Fuente: Clonación desde el Repositorio de Control de Versiones
git clone <url-del-repositorio>

# 2. Posicionamiento en el Árbol de Trabajo
cd fisica

# 3. Instalación Masiva de Dependencias de Terceros
# Esto procesará el package.json y creará una carpeta node_modules localmente.
npm install

# 4. Levantamiento del Servidor de Desarrollo Local con Vite
# (Activa recargas modulares instantáneas en la ruta http://localhost:5173)
npm run dev

# 5. [Flujo de Producción] Compilación, Transpilación y Minificación
# Ejecuta el optimizador Rollup. Empaqueta todo el proyecto Vue+Tailwind
# en la subcarpeta /dist/, listo para ser desplegado de manera puramente 
# estática en cualquier host global (e.g., Vercel, Netlify, GitHub Pages, AWS S3).
npm run build
```

Una vez que el entorno de desarrollo sea levantado (`npm run dev`), el sistema está listo para simular, graficar y registrar métricas sin depender absolutamente de la red exterior. Experimenta libremente.