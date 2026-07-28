# Documentación Exhaustiva de Arquitectura de Software: Frontend, Rendimiento y Desacoplamiento

El **Simulador Cinemático y Dinámico V1** es una aplicación sumamente intensiva en términos computacionales, operando en el cliente miles de cálculos espaciales vectoriales, resoluciones trigonométricas e integraciones de fuerzas continuas a una alta tasa de refresco (generalmente 60 hercios). Afrontar el reto de construir este ecosistema sobre tecnologías web requerió el diseño de una arquitectura impecable que mitigara totalmente los *cuellos de botella* comunes en el navegador, prestando especial atención a cómo las cargas lógicas (Dinámica y Matemática Pura) interactúan con la capa de presentación (DOM/Vue).

Este documento está concebido como la bitácora arquitectónica definitiva para los ingenieros de software, delineando exactamente el "por qué" y el "cómo" de cada decisión estructural adoptada en el proyecto.

---

## 1. El Desafío Reactivo: Abstracción Aislada de Vue.js y Planck.js

En cualquier entorno web interactivo moderno (como React, Angular o Vue), la reactividad juega un rol crítico: cada variable que se actualiza dispara un ciclo de re-renderizado para plasmar el cambio visual en la pantalla. Sin embargo, al combinar *frameworks* de interfaz de usuario con motores físicos, surge un grave peligro arquitectónico.

### 1.1. El Colapso de los Proxies Iterativos y el Cómputo Circulante
Vue 3, en su núcleo, interpone manejadores denominados **Proxies** (nativos de ES6) a cada objeto que se le instruye observar (`ref` o `reactive`). Estos Proxies rastrean exhaustivamente cada *getter* y *setter* de las propiedades anidadas del objeto.
En paralelo, `Planck.js` basa su supremo rendimiento geométrico en una red infinitamente compleja de objetos que poseen **referencias cruzadas recíprocas**:
*   Un `World` almacena arreglos de iteración hacia cada `Body`.
*   Cada `Body` guarda punteros dobles hacia sus propios polígonos de impacto (`Fixtures`).
*   Cada `Fixture` anida referencias apuntando de retorno a su propio `Body` o a los `Joints` (Restricciones) que posee.

**El Fallo Catastrófico:** Si un objeto de esta naturaleza topológica circular es inyectado sin filtros a un arreglo reactivo de Vue.js, el compilador inicia un rastreo profundo y agresivo de cada nivel de anidación intentando convertir todo el motor físico en propiedades reactivas. Esta cascada infinita de llamadas satura violentamente la Pila de Ejecuciones (Call Stack) provocando un error fulminante: `Maximum call stack size exceeded`. El hilo de ejecución (Main Thread) del motor V8 del navegador colapsa al instante.

### 1.2. El Patrón "Raw Proxy" (Blindaje mediante `markRaw`)
La arquitectura esquiva este abismo implementando rigurosamente el comando `markRaw()` (proveniente del núcleo de Vue 3). Este método actúa como un escudo o etiqueta semántica en la memoria RAM, impidiendo que el motor reactivo convierta un objeto subyacente en Proxy.
Este patrón se aplica desde la capa base `src/composables/usePlanckWorld.js`:

```javascript
import { markRaw } from 'vue'

// 1. Blindaje del Mundo Físico Entero
// Vue será ciego a las operaciones gravitatorias e iteraciones Eulerianas que ocurran aquí dentro.
const world = markRaw(new World({ gravity: Vec2(0, -9.81) }))

// 2. Inyección Aislada de Cuerpos Físicos
// Al crear una entidad para ser "dibujada" en la pantalla, la UI necesita interactuar con ella.
// Se envuelve el objeto Body crudo dentro de markRaw(), pero la capa superior (id, kind) sí puede ser reactiva.
bodies.push({
  id: generateUniqueId(),
  kind: 'box',
  body: markRaw(body),
  color: '#2ecc71',
  label: 'Polígono Dinámico'
})
```
**Flujo Híbrido Resultante:** El *Canvas* interactivo y el Componente (`PhysicsSandbox2D.vue`) se limitan a leer pasivamente las variables. Al invocar el fotograma en `requestAnimationFrame`, Vue interroga velozmente las coordenadas matemáticas del bloque en la memoria cruda (`body.getPosition()`), y las dibuja en pantalla. Las millones de operaciones internas por choque e integración impulsiva del motor se ejecutan en silencio absoluto, maximizando los FPS (Frames Per Second).

---

## 2. Persistencia y Mitigación de Errores: History Stack Estricto

En aplicaciones de dibujo, topografía o construcción, es estadísticamente inevitable el fallo del operador humano. Por consiguiente, la capacidad de *Deshacer (Undo)* y *Rehacer (Redo)* acciones es un pilar de la Experiencia del Usuario (UX). No obstante, clonar un universo bidimensional interconectado con tensores (cuerdas y poleas) no es trivial, y si no se regula, agota la memoria *Heap* del cliente.

### 2.1. Arquitectura de Deserialización y Apilamiento Espacial
En `PhysicsSandbox2D.vue`, el ciclo de rescate de estado no se ejecuta cada fotograma (lo cual colapsaría el rendimiento), sino **sólo cuando se interrumpe un comportamiento mutante**. Se diseñaron interrupciones (*listeners*) que reaccionan tras culminar la eliminación de un ente, al final del arrastre prolongado de un nodo maestro (`MouseUp`), o tras la inserción de un resorte.

**Estrategia de Almacenaje:**
1.  **Serialización Plana:** Se extrae una biometría topológica (Vértices $X,Y$, propiedades, anclas gravitatorias, tipos estáticos) y se comprime en un masivo String JSON plano mediante `JSON.stringify()`.
2.  **Unión de Dominios Matemáticos y Gráficos:** Las estructuras visuales (Cotas, Herramientas Euclidanas de Medición) también sufren una serialización y se empaquetan en bloque hacia el mismo objeto abstracto.
3.  **Filtrado por Recolección de Basura (LIFO Controlado):**
    ```javascript
    function saveHistoryState() {
      // 1. Evitar ciclos vacíos: no hacer push si no hay mutación real.
      // 2. Ejecutar abstracción del mundo a JSON.
      const currentSnapshot = exportStateToJson(); 
      history.value.push(currentSnapshot);
      
      // 3. Purga Estricta: Garantizar consumo local de memoria predecible.
      if (history.value.length > 50) {
        history.value.shift(); // Evacúa los estados más viejos (FIFO cleanup).
      }
    }
    ```
Esta estrategia otorga una robusta garantía de 50 pasos espaciales al estudiante, requiriendo en el peor escenario apenas decenas de Megabytes de memoria *Heap*, lo cual es totalmente despreciable para las computadoras y dispositivos móviles contemporáneos.

---

## 3. Dinámica del DOM y *Listeners* de Alta Prioridad

Para satisfacer las altas demandas de velocidad requeridas por operadores de simuladores (típicamente ingenieros y técnicos), se prescindió del uso de interminables clics de ratón en favor de Atajos de Teclado Asíncronos (*Hotkeys*).

### 3.1. Delegación Segura e Interceptación Condicional
El código base engancha las interrupciones en el evento raíz superior: `window.addEventListener('keydown', ...)`. 
Sin embargo, dado que el sistema posee paneles de edición paramétrica (inputs para editar la masa, campos de texto, editores de funciones algebraicas como $x(t)$), existía la severa colisión funcional donde presionar la letra "V" para tipear la variable $V_0$ desencadenaba por error la herramienta de "Mover Vectorial".
El código remedia esto implementando una compuerta estricta pasiva:

```javascript
const handleKeydown = (e) => {
  // Validación de nodo superior: 
  // Ignorar interrupción si el foco pertenece a formularios
  if (
    e.target.tagName === 'INPUT' || 
    e.target.tagName === 'TEXTAREA' || 
    e.target.isContentEditable
  ) return;

  // Rutador de comandos acelerados
  switch(e.key.toLowerCase()) {
    case 'v': case '1': emit('select-tool', 'move'); break;
    case 'b': case '2': emit('select-tool', 'box'); break;
    // ... rest of tools
  }
}
```
Esta validación in-situ asegura que la captura semántica funcione de forma indetectable sin mermar en lo absoluto las tareas de edición textual o numérica.

---

## 4. Rendimiento en el Subsistema Cinemático (1D y Gráficos)

El componente `KinematicsSimulator.vue` evita el ciclo tradicional del servidor. El *Renderizado Cartesiano* provisto por **Chart.js** tiene que manipular *Datasets* densos.
1.  **Parseo Previo (AST Validation):** Al inyectar un input $x(t)$ (por ejemplo, `5*sin(3*t)`), un analizador lo verifica instantáneamente pre-compilando los operadores algebraicos mediante MathJS (`math.parse`).
2.  **Iteraciones Acumuladas:** La resolución numérica transcurre bajo una matriz discreta densa (ej. bucle FOR iterando por $T_{max}$ con paso $dt=0.05$). Al generarse 3 arrays densos para [x, v, a], Chart.js los inyecta asíncronamente mutando reactivamente sus arreglos observables (`ref`).
3.  La utilización estricta de CSR (Client Side Rendering) evita por completo el envío del String matemático al servidor para ser procesado vía *REST APIs*, retornando los datos transformados en pocos milisegundos y permitiendo un control en tiempo real mediante los controles deslizantes que el usuario maneje, operando al vuelo las recomposiciones vectoriales.
