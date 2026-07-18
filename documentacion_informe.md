# Informe Técnico y Teórico: Laboratorio de Simulación Física de la ESPE

El presente documento expone el marco teórico, el enfoque metodológico y la arquitectura tecnológica utilizados para el desarrollo del "Simulador Cinemático y Dinámico 2D". Este documento ha sido diseñado para servir de base en la redacción del informe académico final.

---

## 1. Marco Teórico: Fundamentos de la Simulación

La aplicación aborda dos grandes ramas de la mecánica clásica: la cinemática de la partícula en una dimensión (1D) y la dinámica de cuerpos rígidos en dos dimensiones (2D).

### 1.1 Cinemática Unidimensional (1D)
La cinemática estudia el movimiento de los cuerpos sin atender a las causas que lo producen. En nuestra simulación 1D, el movimiento de la partícula se define a partir de una ecuación de posición matemática, denotada como $x(t)$.
A partir de esta ecuación, el sistema calcula de manera automática (mediante derivación analítica) dos magnitudes fundamentales:
- **Velocidad ($v(t)$):** Representa la tasa de cambio de la posición respecto al tiempo. Se define matemáticamente como la primera derivada de la posición: $v = \frac{dx}{dt}$.
- **Aceleración ($a(t)$):** Representa la tasa de cambio de la velocidad respecto al tiempo, definida como la segunda derivada de la posición: $a = \frac{dv}{dt} = \frac{d^2x}{dt^2}$.

### 1.2 Dinámica Bidimensional (2D)
A diferencia de la cinemática, la dinámica sí estudia las fuerzas que originan el movimiento. Nuestro entorno interactivo ("Sandbox 2D") permite experimentar con las Leyes de Newton en un plano cartesiano:
- **Cuerpos Rígidos y Colisiones:** Se implementa un motor de física de "cuerpo rígido" donde los objetos no se deforman al chocar. El sistema calcula los impulsos y transferencias de momento lineal de acuerdo a la masa, geometría y coeficientes de fricción (estática y cinética) de cada cuerpo.
- **Fuerzas Continuas:** Se permite la aplicación constante de vectores de fuerza a un ángulo determinado, emulando la Segunda Ley de Newton ($F = m \cdot a$).
- **Sistemas de Restricción (Joints):** Se incorporaron modelos matemáticos de poleas ideales (distribución de tensiones a lo largo de una cuerda inextensible), resortes regidos por la Ley de Hooke ($F = -k \cdot x$, junto con coeficientes de amortiguamiento) y rieles de movimiento circular que restringen a los bloques a moverse con radio constante.

---

## 2. Marco Técnico y Arquitectura de Software

El simulador fue concebido bajo el paradigma de "Single Page Application" (Aplicación de Página Única) para funcionar íntegramente en el navegador web del usuario, sin requerir la instalación de programas de escritorio ni depender de servidores externos de procesamiento.

### 2.1 Tecnologías Principales (Frontend)
- **Vue.js 3:** Es el framework (marco de trabajo) principal empleado. Vue.js utiliza una arquitectura basada en componentes modulares. Esto significa que piezas visuales como la barra de botones, la pista de cinemática o el panel de gráficas son "bloques de Lego" independientes (refactorizados arquitectónicamente para una gran escalabilidad) que se combinan para formar la aplicación.
- **Vite:** Es la herramienta de empaquetado del proyecto, encargada de tomar todo el código fuente y procesarlo en un archivo compacto listo para la web.
- **Tailwind CSS:** Es un sistema de diseño que permite aplicar estilos modernos (como el "Glassmorphism", sombras, iluminación) directamente mediante clases, acelerando la creación de interfaces de alta fidelidad.

### 2.2 Motores Computacionales
- **Planck.js:** Es el corazón físico del "Sandbox 2D". Es una adaptación para la web del famoso motor "Box2D" (usado en miles de videojuegos e investigaciones simuladas). Se encarga de procesar las colisiones, aplicar la gravedad (9.8 $m/s^2$) y resolver matrices matemáticas gigantescas 60 veces por segundo para calcular tensiones, masas y fuerzas normales.
- **Math.js:** Motor algebraico utilizado en el apartado de cinemática. Su función es "entender" y analizar la ecuación escrita por el usuario, detectando inteligentemente constantes, funciones y los parámetros personalizables de la fórmula para luego calcular la derivada en tiempo real.
- **Chart.js:** Herramienta utilizada para el dibujo y actualización reactiva de las tres curvas matemáticas principales de cinemática (Posición, Velocidad y Aceleración) a lo largo del tiempo de simulación.

### 2.3 Resumen de Refactorización Arquitectónica
Para garantizar la sostenibilidad a largo plazo y facilidad de lectura técnica del proyecto, el código principal ha sido limpiado y desacoplado:
1. Las gráficas analíticas fueron agrupadas en un submódulo encapsulado.
2. El dibujo visual de la pista 1D interactiva opera ahora de forma independiente.
3. El analizador de ecuaciones de Math.js cuenta con un árbol de sintaxis abstracta (AST) de alta fiabilidad, capaz de distinguir a la perfección funciones trigonométricas/logarítmicas de las variables creadas arbitrariamente por el usuario.

---

## 3. Manual de Usuario V1: Operación del Sistema

Este manual está dirigido a los evaluadores de la Versión 1. El objetivo es proporcionar una guía clara para navegar por ambas plataformas y exprimir sus características clave.

### 3.1 Interfaz General
- **Navegación:** La barra superior sirve como centro de comando. Desde ahí puedes alternar entre la pantalla de Inicio, el Simulador 1D, el Sandbox 2D y el presente Manual (Wiki interactiva).
- **Modo Claro/Oscuro:** En la esquina superior derecha encontrarás un icono (☀️/🌙) que cambia instantáneamente el tema de la aplicación, adaptándose a entornos de mucha luz o de oscuridad sin interrumpir tus simulaciones.

### 3.2 Simulador Cinemático 1D
1. **Ingreso de la Ecuación Base:** Todo comienza escribiendo una ecuación para la posición respecto al tiempo (ej: `x(t) = A * sin(omega * t)`).
2. **Detección Automática de Parámetros:** Si escribes constantes no nativas (como `A` o `omega`), el panel de "Parámetros" las detectará instantáneamente y te ofrecerá barras deslizables para ajustar sus valores en tiempo real.
3. **Derivación Analítica Continua:** Al ingresar la ecuación, el sistema genera de forma automática y en notación matemática exacta (LaTeX) las ecuaciones de la Velocidad ($v(t)$) y la Aceleración ($a(t)$).
4. **Pista de Simulación:** A la derecha, verás un bloque amarillo representando la partícula. Utiliza la barra deslizante de "Tiempo de Simulación" o el botón **Play (▶)** para animar su movimiento. Usa el botón de **Bucle (🔁)** si deseas que la animación se repita indefinidamente.
5. **Paneles de Gráficas Sincronizadas:** En la parte inferior, tienes las gráficas exactas que reflejan el comportamiento cinemático. Al hacer clic sobre cualquier gráfica, esta se expandirá a pantalla completa, permitiéndote rastrear con tu mouse los valores exactos para cada segundo.
6. **Atajos de Teclado:** Presiona la tecla **Enter** mientras escribes tu ecuación matemática para recalcular automáticamente los valores y reanudar la simulación al instante.

### 3.3 Sandbox Físico 2D (Newton Lab)
Este entorno permite crear colisiones y experimentos de física libremente dibujando sobre el lienzo.

1. **La Importancia del Botón "Pausa (⏸)"**
   - El simulador está activo desde que ingresas, aplicando gravedad. Si dibujas cajas en el aire, caerán al instante.
   - **Tip de Uso:** Presiona siempre *Pausa* antes de armar tu experimento. Usa la herramienta **"Mover (✋)"** para reubicar las cajas, construir torres perfectas o trazar cables estáticos. Una vez que estés listo, suelta la pausa (▶) y observa la reacción física.
   - **Atajos Globales:** Pulsa **Espacio** o **Enter** en cualquier momento para alternar rápidamente entre la reproducción y la pausa, sin soltar tu ratón.

2. **Panel de Herramientas (Inferior Centro) y Atajos Rápidos**
   - **Mover (✋) [Tecla 1]:** Arrastra objetos libremente. Al dar clic en un objeto, se despliega el panel de propiedades (derecha) donde puedes editar con precisión la masa, la fricción y sus dimensiones.
   - **Herramientas de Construcción [Teclas 2-7]:** Tienes acceso inmediato a Cajas [2], Terrenos fijos [3], Cuerdas [4], Resortes [5], Poleas [6] y Rieles circulares [7]. Por ejemplo, las poleas funcionan en dos pasos: ancla primero la rueda y luego traza desde el otro objeto exactamente hacia el anclaje.
   - **Fuerza Constante (➤) [Tecla 8]:** Puedes aplicar propulsores continuos a los bloques arrastrando un vector.
   - **Eliminar Objeto [Tecla 9 o Suprimir/Retroceso]:** Borra rápidamente cualquier objeto o restricción.

3. **Panel de Dinámica y Telemetría**
   - En la esquina inferior izquierda verás mediciones exactas del bloque seleccionado, como su centro de masa ($X, Y$) y sus velocidades.
   - Puedes usar la herramienta de **Fuerza (➤)** y apuntarla hacia un bloque para empujarlo activamente y romper su reposo, experimentando cómo la Fricción estática colapsa y entra en acción la cinética.
