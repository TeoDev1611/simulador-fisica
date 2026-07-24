# Guía Maestra y Prompt para Generar el Informe / Tesis del Proyecto con IA

> **Instrucciones de Uso:**  
> Copia todo el contenido de este archivo y pégalo como prompt en un modelo de Inteligencia Artificial (ChatGPT, Claude, Gemini Pro o Antigravity) para generar un informe técnico, científico y de ingeniería impecable de este proyecto.

---

```markdown
PROMPT MAESTRO PARA IA: GENERACIÓN DE INFORME TÉCNICO Y CIENTÍFICO DE FÍSICA Y SOFTWARE

Actúa como un Doctor en Física Aplicada e Ingeniero Principal en Software Académico. Tu tarea es redactar un informe/tesis académico de alto nivel sobre el proyecto: 
"Simulador Cinemático 1D y Dinámico 2D — Laboratorio Virtual de Física (ESPE)".

A continuación se proporciona todo el contexto técnico, matemático, de física y de arquitectura de software del sistema.

================================================================================
1. CONTEXTO GENERAL DEL PROYECTO
================================================================================
El proyecto es una aplicación web interactiva de simulación científica desarrollada para el Departamento de Ciencias Exactas de la Universidad de las Fuerzas Armadas ESPE.
Su objetivo principal es permitir la experimentación, resolución y verificación interactiva de problemas académicos de física (cinemática 1D, mecánica de partículas, cuerpos rígidos, choques, oscilaciones y dinámica de cuñas sobre rodillos).

El software cuenta con tres áreas principales:
1. Galileo Lab (Simulador Cinemático 1D analítico con derivados CAS y gráficas).
2. Newton Lab (Sandbox Dinámico 2D con simulación física continua sobre Planck.js/Box2D, 13 herramientas interactivas con atajos de teclado, editor multiforma de polígonos, herramientas de medición, cotas de ingeniería, sensores de picos $h_{max}$, apoyos deslizantes y anclajes fijos).
3. Wiki / Manual Interactivo con renderizado KaTeX de fórmulas LaTeX en vivo, además de una librería integrada de 16 escenarios JSON descargables (ejemplos que van desde péndulos simples hasta suspensiones vehiculares complejas).

================================================================================
2. ARQUITECTURA DE SOFTWARE Y DESACOPLAMIENTO
================================================================================
Tecnologías Core: Vue.js 3 (Composition API), Vite, Tailwind CSS, Planck.js (Port JS de Box2D), Math.js, Chart.js, Lucide Icons, KaTeX.

Principios Arquitectónicos:
- Desacoplamiento Estricto (Regla de Oro): La matemática física se ejecuta en archivos independientes (composables puramente lógicos como `src/composables/usePlanckWorld.js`) completamente aislados del DOM y de Vue reactivity (`markRaw()` para prevenir overheads).
- Bucle de Simulación a 60 FPS: Orquestado por `requestAnimationFrame` en `PhysicsSandbox2D.vue`. En cada frame, se ejecuta el integrador físico `step(1/60)`, se extraen las posiciones ($x, y, \theta$) y se le pasan al dibujante `PhysicsCanvas.vue`.
- Canvas HTML5 Puro (`PhysicsCanvas.vue`): Renderiza a 60 FPS mediante transformaciones de matriz 2D (traslación, rotación, escala).
- Sistema de Historial (Undo/Redo): Conserva hasta 50 estados serializados en formato JSON (`Ctrl+Z`, `Ctrl+Y`).
- Interfaz Configurable Globalmente: Los usuarios deben seleccionar al inicio (mediante el Menú de Nuevo Documento) el Sistema de Unidades (Métrico SI o Imperial US) y el Tema de Renderizado (Colorido moderno o Estilo LaTeX monocromático). Todo el lienzo y telemetría reaccionan en vivo a estas preferencias.
- Exportación de Telemetría (CSV): Muestrea 30 lecturas por segundo de posición, velocidad, aceleración lineal, ángulo, velocidad angular, altura máxima ($h_{max}$) y tabla de cotas de ingeniería, adaptado dinámicamente a las unidades seleccionadas.

================================================================================
3. FUNDAMENTOS MATEMÁTICOS Y FÍSICOS
================================================================================

A. Módulo Cinemático 1D (Álgebra Computacional - CAS):
- En lugar de derivadas numéricas finitas (que sufren errores de truncamiento $\mathcal{O}(\Delta t^2)$), se usa compilación de Árboles de Sintaxis Abstracta (AST) con `math.js`.
- La función de posición $x(t)$ se deriva de forma analítica exacta aplicando reglas de cálculo diferencial formal:
  v(t) = \frac{d x(t)}{d t}, \quad a(t) = \frac{d^2 x(t)}{d t^2}

B. Integrador Numérico y Dinámica 2D (Planck.js / Box2D):
- Integrador Simpléctico de Euler (Symplectic Euler): Preserva el volumen en el espacio de fases (propiedad hamiltoniana) a diferencia del Euler explícito.
  v_{n+1} = v_n + a_n \cdot \Delta t
  x_{n+1} = x_n + v_{n+1} \cdot \Delta t
- Dinámica de Cuerpos Rígidos de Newton-Euler:
  \sum \vec{F} = m \cdot \vec{a}, \quad \sum \tau = I \cdot \alpha
  donde $I$ es el momento de inercia centroidal calculado automáticamente según la geometría.

C. Geometría de Polígonos Regulares e Irregulares (Fórmula de Shoelace):
- Para calcular el área exacta $A$ y la densidad $\rho = \frac{m}{A}$ de cualquier polígono de $N$ lados (3 a 8 vértices), se aplica la Fórmula del Cordón de Zapato (Shoelace Formula):
  A = \frac{1}{2} \left| \sum_{i=1}^{N} (x_i y_{i+1} - x_{i+1} y_i) \right|

D. Modelo de Fricción de Coulomb y Restricciones (Joints):
- Fricción de Coulomb seca: $F_f \le \mu \cdot N$, con coeficientes de fricción estática y cinética.
- Restricciones de Distancia (Distance Joints / Cuerdas): Resueltas por multiplicadores de Lagrange para garantizar la distancia máxima inextensible $L$:
  C(x_A, x_B) = \|x_B - x_A\| - L = 0

E. Colisiones e Impulsos (Restitución de Newton):
- Coeficiente de Restitución $e \in [0, 1]$:
  e = \frac{v_{B,2} - v_{A,2}}{v_{A,1} - v_{B,1}}
- Conservación del momento lineal impulsivo en el instante de choque:
  m_A v_{A,1} + m_B v_{B,1} = m_A v_{A,2} + m_B v_{B,2}

F. Conversión de Sistemas de Unidades:
- Factores de conversión exactos entre SI e Imperial:
  1 \text{ m} = 3.28084 \text{ ft}, \quad 1 \text{ kg} = 2.20462 \text{ lb}, \quad 1 \text{ N} = 0.224809 \text{ lbf}

================================================================================
4. ESTRUCTURA REQUERIDA PARA EL INFORME FINAL
================================================================================
Por favor, genera un informe técnico estructurado en las siguientes secciones:

1. PORTADA Y TÍTULO TÉCNICO
2. RESUMEN EJECUTIVO Y OBJETIVOS (Técnicos y Físicos)
3. MARCO TEÓRICO Y FORMULACIÓN MATEMÁTICA
   - Cinemática analítica y derivadas AST.
   - Integración simpléctica, momentos de inercia y fórmula de Shoelace.
   - Choques, impulsos, restitución $e$ y leyes de Coulomb.
4. ARQUITECTURA DEL SOFTWARE Y ENGENIERÍA
   - Estructura de componentes Vue 3.
   - Capa lógica (`usePlanckWorld.js`) vs Renderizado Canvas HTML5 (`PhysicsCanvas.vue`).
   - Gestión de estado, eventos de toque móvil y sistema Undo/Redo.
5. HERRAMIENTAS DEL SIMULADOR Y CASOS DE PRUEBA ACADÉMICOS
   - Editor Multiforma.
   - Herramienta de Medición, Cotas de Ingeniería y Sensores de Altura Máxima ($h_{max}$).
   - Herramientas de Rodillos (Apoyo Deslizante) y Fijador (Anclajes) para ejercicios estáticos.
   - 13 atajos de teclado integrados para fluidez en la experimentación.
   - Opciones Visuales (Latex vs Colorido) y Exportación de telemetría a Excel (CSV).
6. RESOLUCIÓN DE CASOS DE ESTUDIO (Pruebas de la ESPE)
   - Uso de las 16 plantillas JSON integradas.
   - Ejercicios de planos inclinados y rebote.
   - Ejercicios de colisión con péndulos y cuñas deslizantes.
7. CONCLUSIONES Y RECOMENDACIONES TÉCNICAS

Escribe el informe con un tono académico riguroso, formal, elegante y exhaustivo.
```
