# Estructura y Arquitectura del Proyecto: Guía para el Informe Final

Este documento detalla la estructura profunda del proyecto "Simulador Cinemático y Dinámico". Está diseñado para que los miembros del equipo de desarrollo comprendan exactamente la separación de responsabilidades del código (dónde es lógica, dónde es interfaz, cómo se calculan las físicas) y cuenten con la base técnica para redactar el informe o tesis final.

---

## 1. Arquitectura General: Desacoplamiento Lógica vs Vista

El proyecto emplea el framework **Vue.js 3** estructurado bajo el paradigma de separación de responsabilidades. Nunca se mezcla la matemática pesada dentro de los archivos que dibujan los botones. 

El código fuente se divide esencialmente en dos grandes áreas:
- **Lógica Pura (`src/composables/`):** Archivos que contienen únicamente algoritmos y estados numéricos. No saben que existen pantallas, navegadores o colores. Su único trabajo es procesar matemáticas.
- **Interfaz y Orquestación (`src/components/`):** Archivos `.vue` que se encargan de capturar el clic del usuario, enviarlo a la lógica, recoger los resultados numéricos de vuelta y finalmente pintar la pantalla.

---

## 2. Módulo Cinemático 1D (Galileo Lab)

Este módulo resuelve analíticamente el movimiento en un solo grado de libertad ($x$).

### 2.1 El Cerebro Lógico (Cálculo)
El motor de este módulo es la librería `math.js`. No usamos derivadas numéricas por pasos de tiempo porque acumulan errores de truncamiento; usamos un motor de **Álgebra Computacional (CAS)**. 

- **¿Cómo se calcula?:** Cuando el usuario ingresa una ecuación de texto plana (ej: `x(t) = A*sin(w*t)`), el sistema la compila en un **Árbol de Sintaxis Abstracta (AST)**. El AST entiende las operaciones matemáticas. El componente llama a `math.derivative('ecuacion', 't')` y la librería aplica reglas de cadena puras para escupir la derivada analítica exacta de la velocidad y aceleración en memoria.

### 2.2 El Orquestador y la Interfaz (`KinematicsSimulator.vue`)
Este archivo actúa como puente:
- **Discretización (Evaluación):** Genera un bucle `for` interno que incrementa la variable `$t$` en pequeños pasos (ej. desde 0 hasta 10 segundos). En cada ciclo, inyecta el valor de `$t$` en el nodo compilado por Math.js. Genera tres enormes arreglos de datos `(x, y)` para las posiciones, velocidades y aceleraciones a lo largo del tiempo.
- **Inyección Visual:** Pasa estos arreglos puros al componente **`ChartsPanel.vue`**. Este componente estrictamente visual utiliza **Chart.js** para inyectar estos puntos en un `<canvas>` HTML5 y generar las tres gráficas sincronizadas.

---

## 3. Módulo Dinámico 2D (Newton Lab)

Este es el sistema más complejo del proyecto. Aquí se resuelve mecánica de cuerpos rígidos con rotación, colisiones, resortes y cuerdas. Se usó una arquitectura de tres capas:

### Capa 1: Lógica Física Pura (`usePlanckWorld.js`)
Aquí reside absolutamente toda la matemática vectorial de las físicas.
- **¿Qué motor usamos y por qué?:** Se integra `Planck.js`, un port web del legendario motor `Box2D`. Se eligió porque no es un "motor falso" de videojuegos; es un **integrador numérico estricto (Symplectic Euler)** iterativo que respeta la conservación del momento y aproxima las soluciones a las ecuaciones diferenciales de Newton-Euler usando pasos discretos (time-steps).
- **El Bucle Matemático:** Exporta la función `step(1/60)`. Al llamarla, resuelve fuerzas, choques, fricciones estáticas/cinéticas de Coulomb de todos los cuerpos y avanza el tiempo simulado en `0.016` segundos. 
- **Inercias Reales:** Al dar de alta un bloque o un polígono (Fixture), este archivo le asigna una densidad estricta y Planck calcula de forma automática su centroide exacto y su tensor de inercia real (la resistencia a girar dependiendo de dónde reciba el golpe).

### Capa 2: El Orquestador Intermedio (`PhysicsSandbox2D.vue`)
Es el archivo jefe del simulador, el cual une al usuario con la física.
- **El Bucle Principal (Game Loop):** Inicia un `requestAnimationFrame` que se ejecuta 60 veces por segundo. 
  1. En cada iteración, ordena a `usePlanckWorld.js` hacer un `step()` físico matemático.
  2. Luego, rastrea la memoria del motor físico, pidiéndole las coordenadas actuales ($x,y$, y ángulo $\theta$) a cada objeto.
  3. Le envía esos datos al dibujante (Capa 3).
- **El Sistema de Raycasting Inverso:** Si el usuario hace clic en un píxel en pantalla (Interfaz), este componente hace una matemática inversa: le resta el centro de la pantalla y divide por la escala (zoom) para transformar el punto de "Píxeles" a "Metros físicos reales". Finalmente, le manda ese punto al mundo físico de Planck (`queryPoint`) preguntando: *"¿Existe algún sólido en estas coordenadas matemáticas?"*.
- **Historial (Ctrl+Z):** Este orquestador toma una copia instantánea del estado físico completo (`bodies`, `joints`) cada vez que hay una modificación, empacándola como un objeto serializado ligero. Para el "Deshacer", destruye el mundo lógico y ordena la recreación total del mismo.

### Capa 3: El Renderizador Visual (`PhysicsCanvas.vue`)
Es un componente 100% "tonto" o agnóstico de la física.
- Su única labor es recibir un listado JSON inmenso de objetos (Cajas, Anclajes, Cuerdas) con sus números de posiciones y ángulos ya calculados.
- **Transformación Visual:** Utiliza la API nativa de `<canvas>` HTML5 (`ctx`). Escala el origen central del canvas usando matrices de traslación. Pinta las cajas (Multiplicando metros por píxeles) y rota el contexto usando el `angleRad` puro proporcionado por la Capa 2. 

**Resumen del Flujo Dinámico (Para el reporte final):**
1. El Motor Lógico (`Planck.js`) calcula el paso $\rightarrow$ Produce variables $x, y, \theta$ puras.
2. El Orquestador (`PhysicsSandbox2D.vue`) extrae esas variables.
3. El Dibujante (`PhysicsCanvas.vue`) multiplica esas variables por una escala, y pinta cuadrados y líneas en un `<canvas>` web.
*(Nota arquitectónica importante: El Cerebro Lógico se encapsula dentro del comando `markRaw()` de Vue, previniendo que Vue rastree cada molécula microscópica 60 veces por segundo, lo cual quemaría los recursos de hardware).*

---

## 4. Telemetría y Extracción de Datos (El porqué académico)

Para darle la rigurosidad a este simulador exigida en laboratorios físicos universitarios, se programó la adquisición de datos crudos.

- **¿Dónde ocurre?** Dentro del orquestador (`PhysicsSandbox2D.vue`).
- **¿Cómo se calcula?** Al activar la grabación, el bucle principal abre un colector temporal en la memoria RAM. En cada paso de tiempo (frame), extrae directo de las ecuaciones de estado interno de Planck.js: velocidad lineal absoluta de los centroides $(v_x, v_y)$ y velocidades angulares instantáneas $\omega$ antes de que sean dibujadas. 
- **¿Para qué sirve?** Empaqueta esta inmensa matriz muestreada a 30 Hz y la inyecta mediante librerías de conversión en un archivo `.CSV`. Esto delega el procesamiento matemático final (Validación empírica, Energía, Conservación del momento, Integración) al estudiante usuario final usando Microsoft Excel, Python o Matlab.

---

## 5. Anatomía de las Herramientas: ¿Cómo se programa cada objeto?

Si en la defensa del proyecto se pregunta *"¿Cómo hicieron el resorte o la polea?"*, la respuesta no es *"Usamos un componente de Vue"*. La respuesta debe explicar la **matemática de la Restricción (Joint)** dentro de `usePlanckWorld.js`. A continuación se detalla exactamente qué código y qué principios físicos se ejecutan detrás de cada botón de la interfaz.

### 5.1 Cajas y Masas (`addBox`)
- **Lógica en el código:** Cuando el usuario dibuja una caja, la función `addBox(width, height, mass, x, y)` crea una instancia pura de `planck.Body` de tipo `dynamic`. 
- **La matemática:** Inmediatamente se le anexa un "Fixture" (la geometría) usando `planck.Box`. Al asignarle masa, el motor internamente calcula el **Tensor de Inercia** (su resistencia matemática a rotar basándose en el teorema de ejes paralelos). No programamos rotaciones falsas; la caja rota de acuerdo a las leyes de Newton-Euler gracias a esta densidad matemática.

### 5.2 El Terreno Fijo (`addGround`)
- **Lógica en el código:** La función `addGround(points)` genera un cuerpo `static`. 
- **La matemática:** Se le asigna una geometría de tipo `Edge` (si es un plano recto) o `Chain` (si son varios polígonos unidos). Al ser un cuerpo *static*, el integrador Symplectic Euler le asigna masa infinita e inercia infinita. Ninguna fuerza en el universo simulado puede moverlo. Todo cálculo de colisión contra el terreno absorberá la energía de las cajas basado en el coeficiente de restitución.

### 5.3 Cuerdas y Resortes (`addRope` y `addSpring`)
Ambos objetos utilizan exactamente la misma restricción matemática subyacente: el `DistanceJoint` (Restricción de Distancia) de Planck.js.
- **La Cuerda (`addRope`):** Conecta los centroides de dos cuerpos. Matemáticamente le asignamos una `frequencyHz = 0`. Esto significa que es **completamente rígida**, funcionando como un cable ideal de masa nula que impide estrictamente que los dos objetos se separen más allá de la longitud inicial.
- **El Resorte (`addSpring`):** También conecta dos cuerpos, pero usamos `frequencyHz > 0` (por defecto 2.0 Hz) y un `dampingRatio` (tasa de amortiguamiento, ej: 0.1). Esto transforma la restricción rígida en una ecuación de oscilador armónico subamortiguado. Así es como logramos que el bloque rebote matemáticamente perfecto simulando la **Ley de Hooke ($F = -kx - cv$)** sin tener que programar fuerzas manuales en cada iteración.

### 5.4 Poleas Ideales (`addPulley`)
- **Lógica en el código:** La función `addPulley(bodyA, bodyB, anchor)` utiliza el modelo avanzado `PulleyJoint`.
- **La matemática:** No dibujamos un círculo que da vueltas; programamos un sistema de transmisión de tensión pura. La ecuación que el motor resuelve 60 veces por segundo es: $Longitud_A + Longitud_B = Constante$. 
Esto asegura que si la Caja A baja 1 metro debido a la gravedad, la tensión se transmite perfectamente por el anclaje central y empuja a la Caja B exactamente 1 metro hacia arriba. Es el modelo perfecto de una *Máquina de Atwood* ideal, asumiendo masa y fricción nulas en el punto de apoyo.

### 5.5 Rieles / Collarines (`addCircularTrack`)
- **Lógica en el código:** La interfaz muestra un aro por donde se desliza una anilla, pero bajo el capó (en `addCircularTrack`), programamos una ilusión matemática.
- **La matemática:** Aplicamos nuevamente un `DistanceJoint` con `frequencyHz = 0` (hilo rígido) conectando la Anilla (Caja) con el centro fijo del riel (Anclaje). ¿Qué produce esto? Prohíbe que la anilla se aleje o se acerque al centro (manteniendo el radio intacto), pero deja la rotación completamente libre. Físicamente, el comportamiento es **idéntico al de una cuenta o collarín ensartado en un alambre circular ideal sin fricción**, que ejerce fuerza normal hacia adentro o hacia afuera para mantener a la partícula en su órbita.

### 5.6 Fuerzas e Impulsos Dinámicos (`applyForce` y `applyImpulse`)
Cuando el usuario arrastra la flecha de la herramienta Fuerza (➤):
- **La Fuerza Constante:** Llama a `body.applyForceToCenter(vector)`. Esto suma un vector de Newtons continuo al sumatorio de fuerzas de la caja ($\Sigma F$). Genera una aceleración sostenida a lo largo de los cuadros por segundo.
- **El Impulso (Empujón):** Llama a `body.applyLinearImpulse(vector)`. Esto no aplica aceleración progresiva, sino un salto de energía instantáneo (Delta de Momento Lineal, $\Delta p$). Se usa para simular "golpes" o explosiones en una fracción de segundo.
