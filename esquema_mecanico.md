# Base de Conocimiento Estructural y Físico: Mecánica Newtoniana Aplicada al Simulador V1

## 1. Desglose Estructural y Arquitectura de Software

### 1.1 Mapeo de Componentes Core
#### 1.1.1 Submódulo Cinemático (`src/components/KinematicsSimulator.vue`)
- **a. Lógica y Responsabilidad**: Módulo de evaluación continua escalar y derivación paramétrica temporal. Carece de motor estocástico de iteración continua; en su lugar, transige ecuaciones vectoriales y compila una curva espacio-tiempo $x(t)$.
#### 1.1.2 Orquestador de Interfaz (`src/components/physics/PhysicsSandbox2D.vue`)
- **a. Lógica y Responsabilidad**: Sistema "View-Controller" que envuelve el *Canvas HTML5*, manejando la captura de eventos en tiempo real (clics, arrastre). Es el puente estático entre las directivas matemáticas asíncronas y el visualizador en pantalla.
#### 1.1.3 Motor Abstracto 2D (`src/composables/usePlanckWorld.js`)
- **a. Lógica y Responsabilidad**: Encapsulación absoluta de Box2D (Planck.js). Responsable de la integración explícita de Euler semielástica, inyección gravimétrica vectorial ($\vec{g}$) y resolución recursiva de restricciones (*constraints*).

### 1.2 Patrones de Diseño y Rendimiento
#### 1.2.1 Aislamiento de Estado Matemático (`markRaw()`)
- **a. Fundamentación Técnica**: Las librerías de físicas como Planck instancian clases (`Body`, `Joint`) fuertemente acopladas y con referencias circulares para iteraciones a 60Hz. El código las aísla de los Proxies reactivos de Vue utilizando la función `markRaw()`, permitiendo que el motor calcule la mecánica newtoniana a nivel de JavaScript base (CPU sin penalidad), mientras la vista solo interroga sus coordenadas al dibujar el fotograma.

### 1.3 Lógica de Interfaz y UX
#### 1.3.1 Telemetría y Exportación CSV
- **a. Metodología de Muestreo**: En la cinemática, el dominio temporal $t \in [T_{\text{min}}, T_{\text{max}}]$ se fragmenta en resoluciones discretas (ej. $\Delta t = 0.05$). Estas iteraciones guardan matrices de Posición, Velocidad y Aceleración, concatenando las salidas en formato *Comma Separated Values* (`data:text/csv;charset=utf-8,`) inyectable como descarga Blob.
#### 1.3.2 Estados en Memoria (Snapshot History)
- **a. Persistencia**: Usa algoritmos de *State Exportation*, iterando los nodos topológicos del motor físico, exportando centros geométricos y restricciones a un JSON transitorio, empilándolos en memoria RAM con un límite de *LIFO* para asegurar el *Undo/Redo* sin desborde de memoria.

---

## 2. Fundamentación Física y Mecánica Newtoniana

### 2.1 Cinemática del Punto Material (1D)
#### 2.1.1 Derivación Analítica Continua
- **a. Fundamentación Mecánica**: El software no emplea el método discreto por diferencias finitas $v \approx \frac{\Delta x}{\Delta t}$, mitigando ruido telemétrico. Se usa el analizador MathJS para generar árboles sintácticos.
- **b. Lógica en Código**:
  ```javascript
  const velocityNode = math.derivative(cleanInput, 't')
  const accelerationNode = math.derivative(velocityNode, 't')
  ```
- **c. Nota para LaTeX**: Aquí se debe formular el formalismo diferencial estricto de la cinemática de la partícula ideal: 
  \[ v(t) = \frac{d}{dt} \left[ x(t) \right] \quad \text{y} \quad a(t) = \frac{d^2}{dt^2} \left[ x(t) \right] \]

### 2.2 Dinámica del Sólido Rígido (2D)
#### 2.2.1 Ecuaciones de Newton-Euler
- **a. Fundamentación Mecánica**: La librería subyacente asigna propiedades másicas rigurosas (no puntuales) basadas en densidad $\rho$ del área topológica. El iterador resuelve dinámicamente:
  - Traslación de Centroide: $\sum \vec{F}_{ext} = m \vec{a}_{cm}$
  - Rotación: $\sum \vec{M}_{cm} = I \vec{\alpha}$ (donde $I$ es el momento polar de inercia y $\alpha$ aceleración angular).
- **b. Lógica de Fuerzas**: Las herramientas inyectan un diferencial puro llamando a `body.applyForceToCenter(forceVec)`.
- **c. Nota para LaTeX**: Insertar las Ecuaciones de Newton-Euler bidimensionales de traslación y momento rotacional de inercia de masa transversal.

### 2.3 Teoría de Colisiones y Conservación de Energía
#### 2.3.1 Restitución Newtoniana
- **a. Fundamentación Mecánica**: Aplicado en las *fixtures* individuales. La restitución $e \in [0,1]$ dictamina si el impacto es perfectamente plástico ($e=0$) limitando el rebote térmico, o elástico asintótico ideal ($e=1$). 
- **b. Nota para LaTeX**: Insertar la ecuación de restitución empírica para la sección de colisiones:
  \[ e = -\frac{v_{2,f} - v_{1,f}}{v_{2,i} - v_{1,i}} \]
#### 2.3.2 Modelos de Fricción Coulombiana ($\mu_s, \mu_k$)
- **a. Fundamentación**: El código asigna el parámetro de roce al contacto material (suelos y polígonos). El motor itera la componente de fuerza normal interactuando contra este factor escalar para limitar el deslizamiento transversal.

### 2.4 Restricciones Cinemáticas y Vínculos (Joints)
#### 2.4.1 Resorte Armónico Lineal
- **a. Lógica en Código**: El "Resorte" implementa un `DistanceJoint` paramétrico provisto de Frecuencia Hertziana ($f$) y *Damping Ratio* ($\zeta$). 
- **b. Nota para LaTeX**: Formular la ecuación íntegro-diferencial acoplada y la Ley de Hooke amortiguada: $\vec{F} = -k\vec{x} - c\vec{v}$.
#### 2.4.2 Tensión Múltiple y Poleas
- **a. Lógica en Código**: El "PulleyJoint" ataca dos componentes mecánicos desde *pivotes fijos (anclas)*. Consigna la conservación topológica de longitud inelástica: $L_1 + L_2 = \text{constante}$.
- **b. Nota para LaTeX**: Agregar restricción lineal de cables tensores.
#### 2.4.3 Grados de Libertad y Apoyos Deslizantes (Rodillos)
- **a. Mecanismo Físico**: Al setear el componente en modo `rollers`, el código anula la fricción escalar en la superficie del polígono ($\mu \to 0$). Mecánicamente restringe la traslación vertical al suelo, pero otorga plena cinemática rotacional sin empuje transversal.

---

## 3. Extracción de Modelos Matemáticos de Geometría

### 3.1 Geometría Computacional
#### 3.1.1 Fórmula de Shoelace (Área y Centroide)
- **a. Extracción**: Para la construcción de $n$-lados generados en el `ShapeEditor`, el cálculo local utiliza determinantes iterativos vectoriales.
- **b. Código Base**:
  ```javascript
  areaSum += vertices[i].x * vertices[j].y
  areaSum -= vertices[j].x * vertices[i].y
  ```
- **c. Nota para LaTeX**: Plasmar la fórmula de los cordones de Gauss: $A = \frac{1}{2} \left| \sum_{i=1}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$.

### 3.2 Proyección Espacial Continua (Raycast y Query)
#### 3.2.1 Contención Geométrica AABB
- **a. Extracción**: El sistema proyecta el cursor (puntero láser) intersecando un *Axis-Aligned Bounding Box* microscópico iterando la geometría matricial `fixture.testPoint(Vec2(x, y))` para discriminar intersección del sólido continuo.

### 3.3 Cotas, Sensores y Topografía Computacional
#### 3.3.1 Teorema de Pitágoras y Desnivel Euclideano
- **a. Matemáticas**: Distancia rectilínea para la herramienta de medidas.
- **b. Nota para LaTeX**: Escribir norma del vector métrico: $d = \sqrt{\Delta x^2 + \Delta y^2}$.
#### 3.3.2 Polaridad Angular ($\theta$)
- **a. Abstracción de Código**: La herramienta "Regla" detecta su inclinación contra el semi-eje polar estático vía `Math.atan2(dy, dx)`.
- **b. Nota para LaTeX**: Plasmar arcotangente direccional plena de los 4 cuadrantes trigonométricos.
#### 3.3.3 Captura Telemétrica del Sensor Máximo ($h_{\text{max}}$)
- **a. Mecánica Discreta**: A cada $1/60s$, se compara la ordenada local de vuelo de los polígonos libres respecto al valor apilado $h_n$. Si $\vec{r}_{n}(t)\cdot \hat{j} > h_{n-1}$, muta el escalar máximo en el fotograma exacto previo al colapso descendente.
