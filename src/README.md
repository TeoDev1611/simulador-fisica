# Estado del proyecto — Laboratorio de Simulación ESPE

## Qué es esto

Una app Vue 3 (`<script setup>`) con dos simuladores en pestañas:

1. **Cinemática 1D** — simulador original del usuario (ecuaciones con LaTeX/KaTeX,
   gráficas con Chart.js, teclado virtual). No lo hemos tocado en lógica, solo se
   le quitó su `<header>` propio para vivir dentro del shell compartido.
2. **Sandbox Físico 2D** — motor de físicas 2D interactivo construido con
   **Planck.js** (el sucesor mantenido de Box2D/planck-js) + `<canvas>`.
   Es la parte donde ha pasado casi todo el trabajo reciente.

Stack: Vue 3 + Vite + Tailwind. Sin backend, todo corre en el navegador.

## Estructura de archivos

```
src/
├── App.vue                          # shell: header ESPE + nav de pestañas
├── main.js / style.css              # boilerplate, sin lógica relevante
├── components/
│   ├── EspeLogo.vue                 # logo propio (NO es el escudo oficial, ver abajo)
│   ├── KinematicsSimulator.vue      # simulador 1D original, intacto
│   └── physics/
│       ├── PhysicsSandbox2D.vue     # ORQUESTADOR: dueño del bucle de animación
│       ├── PhysicsCanvas.vue        # dibuja todo en <canvas>, sin lógica física
│       ├── PhysicsControls.vue      # panel izquierdo: herramientas + ajustes
│       └── PhysicsDataPanel.vue     # panel de solo-lectura con datos en vivo
└── composables/
    └── usePlanckWorld.js            # TODA la física vive aquí. Sin DOM, sin Vue-UI.
```

**Regla de oro de la arquitectura:** `usePlanckWorld.js` no sabe que existe un
`<canvas>`. `PhysicsCanvas.vue` no sabe nada de física (solo recibe arrays de
datos ya calculados y los pinta). `PhysicsSandbox2D.vue` es el único que
conecta ambos mundos: llama `step()` cada frame y luego `canvas.draw(...)`.

## Cómo funciona el motor físico (`usePlanckWorld.js`)

Expone un composable con: `bodies` (reactive array: cajas, terreno, anclajes) y
`ropes` (reactive array: cuerdas, resortes, poleas). Todo objeto pesado de
Planck (`body`, `fixture`, `joint`) se guarda con `markRaw()` para que Vue no
intente hacerlo reactivo profundo (rompería la librería).

Funciones clave:
- `addBox`, `updateBoxMass` — masa se controla vía `density = masa/área` +
  `resetMassData()` para cambiarla **en caliente** sin recrear el cuerpo.
- `setGroundPath(points, friction)` — el terreno **ya no es una línea recta con
  ángulo**: es una `Chain` (polilínea) de Planck. Se dibuja a mano con la
  herramienta ✏️ en el canvas.
- `addAnchor(x, y)` — crea un punto fijo en el mundo (cuerpo estático invisible
  salvo por un pin amarillo). Sirve para que cuerda/resorte/polea funcionen
  colgando de **una sola caja**, no forzosamente dos.
- `addRope` / `addSpring` / `addPulley` — los tres son básicamente
  `DistanceJoint` (cuerda = rígida, resorte = con `frequencyHz`/`dampingRatio`)
  o `PulleyJoint`. `setSpringStiffness(id, freq, damping)` cambia la constante
  k **en caliente**.
- `setAppliedForce(id, {enabled, magnitude, angleDeg})` — fuerza externa
  continua aplicada cada frame vía `applyForceToCenter`.
  `applyImpulse(id, magnitude, angleDeg)` — golpe instantáneo, una sola vez.
- `queryPoint`, `startMouseDrag/updateMouseDrag/stopMouseDrag` — soportan
  arrastrar cajas con el mouse usando un `MouseJoint` (patrón estándar de
  Box2D con un "ground body" auxiliar).
- `step(dt)` — orden importante: aplica fuerzas externas → `world.step()` →
  sincroniza posiciones reactivas → calcula Fuerza Normal y Tensión.

### Detalles físicos no obvios (ya verificados en ejecución real, no solo leídos en la doc)

- **Fuerza Normal** no es un dato nativo de Planck (es un solver de impulsos).
  Se reconstruye como `Σ(normalImpulse de contactos activos) / dt`. Se validó
  que para una caja en reposo da `N ≈ m·g`.
- **Tensión** sí es nativa: `joint.getReactionForce(1/dt)`.
- **Bug real que ya está resuelto:** Planck "duerme" los cuerpos en reposo por
  optimización. Si inclinas/mueves el terreno o creas un joint nuevo mientras
  el cuerpo está dormido, no reacciona o incluso puede tronar
  `getReactionForce`. Por eso casi cada función de edición en caliente termina
  con `body.setAwake(true)` sobre los cuerpos afectados. Si alguien agrega una
  función nueva que modifica algo en caliente, **debe acordarse de este
  patrón** o volverá el bug.

## Cómo funciona la interacción (`PhysicsSandbox2D.vue`)

Hay una única variable `activeTool` que decide qué hace el click/arrastre en
el canvas: `drag | box | ground | rope | spring | pulley | force | delete`.
El flujo pointer down/move/up vive todo en este archivo (`handleCanvasDown/
Move/Up`), enruta según `activeTool`, y llama a las funciones del composable.

Puntos importantes:
- Herramienta **`ground`**: arrastrar acumula puntos en `groundDrawPoints`
  (con un umbral de distancia para no saturar) y al soltar llama
  `setGroundPath`.
- Herramienta **`force`**: arrastrar desde una caja — la distancia arrastrada
  define la magnitud (8 N por metro) y la dirección define el ángulo.
- Herramientas **`rope/spring/pulley`**: si sueltas sobre una caja, conecta
  ambas; si sueltas sobre lienzo vacío, crea un `addAnchor` ahí mismo.
- El bucle `requestAnimationFrame` vive en `loop()`, con paso fijo `1/60` para
  estabilidad numérica (no usa el `dt` variable del navegador).
- Play/Pausa/Reiniciar están en una barra flotante **dentro** del contenedor
  del canvas (no solo en el panel lateral), a pedido explícito del usuario.

## Identidad visual

- Paleta: verde institucional (`emerald-*`) para toda la UI de chrome
  (títulos, botones, acentos). Los colores **funcionales** del canvas NO se
  tocaron porque llevan significado físico: rojo = peso, amarillo = tensión,
  morado = resorte, naranja = fuerza aplicada.
- `EspeLogo.vue` es un escudo geométrico **propio**, no el escudo oficial de
  la universidad (ese tiene derechos de autor y no se puede reproducir). El
  archivo trae instrucciones comentadas para reemplazarlo por el PNG oficial
  si el usuario lo consigue (`src/assets/logo-espe.png`).

## Cómo instalar / correr

```bash
npm install        # o pnpm install — el usuario usa pnpm
npm install planck # dependencia añadida para el sandbox físico
npm run dev
```

⚠️ Ojo con un error real que ya ocurrió: el usuario una vez instaló **`plank`**
(sin la "c") en vez de **`planck`** — son paquetes distintos. Si Vite tira
`Failed to resolve import "planck"`, lo primero es revisar el nombre exacto
en `package.json`.

## Qué NO se ha hecho / posibles siguientes pasos

- No hay guardado/carga de escenas (todo se pierde al recargar la página).
- No hay deshacer/rehacer.
- El terreno dibujado a mano (`Chain`) reemplaza el anterior por completo
  cada vez que se dibuja uno nuevo (no se pueden tener dos terrenos separados
  a la vez).
- Los anclajes (`kind: 'anchor'`) no se pueden borrar individualmente desde la
  UI todavía (sí se limpian con "Reiniciar" o si se borra la caja que los usa,
  vía `removeBody` → limpia joints asociados, pero el anclaje en sí queda
  huérfano en `bodies` — es una fuga menor pendiente de limpiar).
- No hay colisión entre cajas y el "preview" de fuerza/junta antes de soltar
  el mouse (solo se ve la línea guía, no un cálculo en vivo).
- Todo el estado de validación de este proyecto se hizo corriendo Planck.js
  real en Node (no solo leyendo su documentación/tipos), así que los datos
  físicos (masa, tensión, fuerza normal) están confirmados correctos, no solo
  "parecen correctos".