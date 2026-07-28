# Guía Docente de Fundamentación Física y Dinámica Clásica

Este documento ha sido redactado con extremado rigor científico e ingenieril. Establece, defiende y fundamenta el marco teórico-matemático exacto que subyace a la formulación del código fuente detrás de cada módulo y simulación implementada en el **Simulador Cinemático y Dinámico V1**. 

La guía está concebida para proveer sustento académico a tribunales calificadores, directores de laboratorios físicos y personal docente de la prestigiosa **Universidad de las Fuerzas Armadas (ESPE)**. En ella se garantiza que las integraciones espaciales programadas computacionalmente en el proyecto obedecen de forma inequívoca a los postulados clásicos de la Dinámica Newtoniana.

---

## 1. Cinemática Analítica de Partícula (Dimensión 1D) y Máquina Diferencial

El ecosistema tradicional de las simulaciones pedagógicas basadas en código tiende a adolecer del mismo defecto matemático: la dependencia total de algoritmos de iteración por diferencias finitas (por ejemplo, obtener la velocidad instantánea aplicando $v \approx \frac{x_2 - x_1}{t_2 - t_1}$). A medida que los dominios temporales crecen o las funciones adoptan comportamientos asintóticos o senoidales, estos algoritmos discretos inflacionan el error de truncamiento y propagan ruido numérico a las curvas derivadas de aceleración y fuerza (conocido popularmente como *Jitter* o inestabilidad telemétrica).

### 1.1. Parseo Computacional de Árboles (AST) y Transpilación
El módulo cinemático 1D prescinde frontalmente del método numérico discreto y, en su lugar, delega la transpilación simbólica continua a un poderoso motor alfanumérico implementado a través de `MathJS`. El flujo informático obedece la matemática rigurosa:

1.  **Parseo Abstracto:** El usuario ingresa una posición paramétrica horaria, por ejemplo: $x(t) = 15 \cdot e^{-0.5t} \cdot \cos(2\pi t)$. El software tokeniza esta expresión *String* dividiéndola jerárquicamente en un Árbol de Sintaxis Abstracta (AST), segmentando operando de operador.
2.  **Diferenciación Analítica Pura:** A continuación, el motor algorítmico aplica recursivamente la Teoría General de Cálculo Diferencial (incorporando Regla de la Cadena, Regla del Cociente y Regla del Producto según correspondan) operando sobre el árbol algebraico. Así, el sistema programa internamente y arroja, de forma subyacente, ecuaciones abstractas absolutas y sin pérdida para las derivadas vectoriales:
    $$ \vec{v}(t) = \frac{d}{dt} \left[ \vec{x}(t) \right] \quad \text{y} \quad \vec{a}(t) = \frac{d^2}{dt^2} \left[ \vec{x}(t) \right] $$
El resultado cartográfico son curvas que no sufren degeneración estocástica, lo que resulta crítico para la telemetría precisa en un laboratorio cinemático real.

---

## 2. Geometría Computacional, Densidades y Tensores Estructurales

El Sandbox de Dinámica abandona rápidamente los moldes pre-establecidos, fomentando la pericia constructiva del ingeniero al habilitar la instanciación de figuras poligonales masivas asimétricas ($n$-lados). Al construir dichas piezas, es indispensable que el cálculo de sus propiedades de masa obedezca su geometría volumétrica simulada en planos bidimensionales uniformes.

### 2.1. Área Vectorial (Teorema de Gauss / Shoelace Formula)
Para proporcionar a las ecuaciones de dinámica su masa $m$ precisa y para garantizar colisiones rotacionales plausibles (mediante Inercia), el programa procesa iterativamente las coordenadas puras. Se implementa en el archivo `shapeUtils.js` la matemática topográfica de los Cordones de Gauss, operando determinantes matriciales consecutivos sobre los vértices $(x_i, y_i)$:

$$ A = \frac{1}{2} \left| \sum_{i=1}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) + (x_n y_1 - x_1 y_n) \right| $$

Con base en esta área rigurosa, se postula una densidad de masa escalar equitativa ($\rho = constante$), se integra el Centroide Bi-dimensional y se formula el Momento Polar de Inercia de Masa $I$ (la resistencia innata de la matriz asimétrica al momento flector/rotacional).

---

## 3. Dinámica Multicuerpo de Sólido Rígido y Entrelazamiento Matemático

Las fuerzas externas dentro del espacio 2D del simulador están atadas a la integración iterativa semi-implícita de Euler implementada mediante `Planck.js`, evaluando incesantemente (a una frecuencia computacional de 60 Hertz):
*   **Aceleración Traslacional Vectorial del Centro de Masa:** $\sum \vec{F}_{ext} = m \cdot \vec{a}_{cm}$
*   **Momento Torcional Restrictivo Angular:** $\sum \vec{M}_{cm} = I \cdot \vec{\alpha}$

### 3.1. Ecuaciones Armónicas Acopladas (Resortes)
El comportamiento de los tensores tipo "Resorte" es modelado a través de interconexiones dependientes de la distancia (`DistanceJoint`). El programa implementa la Ley de Hooke tridimensional, otorgándole al operador parámetros directos:
*   Frecuencia Natural de Oscilación ($f$ en Hertz).
*   Proporción de Amortiguamiento (*Damping Ratio* $\zeta$), responsable de la mitigación de la energía mecánica.
De esta manera, la ecuación diferencial acoplada obedece estricta disipación e intervención elástica computada a cada instante:
$$ \sum \vec{F}_{neta} = m\cdot\vec{a}_{cm} - c\cdot\vec{v} - k\cdot\vec{x}_{elongacion} = 0 $$

### 3.2. Transmisión Conservativa y Orientación Vectorial (Poleas)

> [!WARNING]  
> **Requisito Mecánico Crítico de Configuración (ATWOOD SYSTEMS):**
> Se previene e instruye obligatoriamente que, para avalar el análisis cinemático-teórico íntegro durante los laboratorios de ingeniería, las **anclas estáticas espaciales** empleadas para instaurar tensores del sistema constructivo de "Poleas" **DEBEN SER TRAZADAS SIEMPRE EN DISPOSICIÓN VERTICAL PLANA DIRECTA** hacia las cargas sujetas. Disponer poleas cruzadas o en ángulos horizontales pervertirá falsamente los torques y cálculos numéricos puros de tensiones esperadas por la fórmula de la Máquina de Atwood, ya que el motor introduciría derivadas complejas no-ortogonales incalculables manualmente de forma simple.

Al someterse a esta disposición fundamental, el software respeta el tensor inelástico: $s_1 + s_2 = L$ , forzando a la componente longitudinal a permanecer invariable independientemente de la carga diferencial vertical o de elongaciones térmicas ilusorias.

### 3.3. Fricción Transversal Coulombiana y Correderas (Rodillos)
Los polígonos del simulador están equipados, paramétricamente por defecto, con factores de roce estáticos ($\mu_s$) y cinéticos ($\mu_k$). No obstante, al implementar la restricción cinemática de `Rodillos` a un prisma conllevado, el código manipula dinámicamente y superpone el factor transversal dictaminando $\mu \to 0$. Esto crea, artificialmente, un bloque deslizante puro que carece totalmente de freno superficial longitudinal, dependiente de manera íntegra e instantánea del empuje externo o de la componente vectorizada gravitatoria normal sobre planos inclinados ($m\vec{g} \cdot \sin(\phi)$).

---

## 4. Colisión Termodinámica Asintótica y Sensores Raycast

### 4.1. Restitución Paramétrica ($e$) y Plástica
Los eventos de intersección de escombros dentro de la vista visual no se basan en extrapolación óptica. Provienen de la severa detección y posterior reacción (Constraint Resolution) de choque térmico matemático en el motor central. El coeficiente de Restitución $e$ dicta el post-estado vectorial:
$$ e = - \frac{\vec{v}_{2,f} - \vec{v}_{1,f}}{\vec{v}_{2,i} - \vec{v}_{1,i}} $$
Dicho factor es manipulable por el usuario para crear entes perversamente plásticos ($e=0$), en donde la carencia rotacional aglutina vectores térmicos, o en simuladores elásticos puros asintóticos limitados ($e=1$).

### 4.2. Contención y Metrología Topográfica (Física Espacial)
Para otorgar retroalimentación paramétrica continua e invisible (sin obstaculizar el motor principal de colisión geométrica):
*   **Sensor Puntual del Clic (AABB Raycast):** Durante un ensayo, al hacer clic sobre una estructura en movimiento libre para atar un ancla, el software dispara un Vector Infinitesimal o AABB (*Axis-Aligned Bounding Box*) iterativo con volumen local de compensación mínima temporal $\pm 0.001$. Discrimina matemáticamente su área con la del polígono para devolver instantáneamente una booleana de intercepción espacial afirmativa en menos de $1/60s$, logrando empalmar tensores perfectos en masas durante su vuelo balístico ininterrumpido.
