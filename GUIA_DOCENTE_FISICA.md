# Guía Técnica Docente: Capacidades del Laboratorio de Simulación Física

Este documento está diseñado específicamente para Ingenieros Físicos y docentes universitarios de mecánica clásica. Su objetivo es exponer las capacidades computacionales y de modelado físico-matemático del software, omitiendo detalles de ingeniería de software. 

La plataforma se divide en dos laboratorios independientes, diseñados para abarcar desde los fundamentos del cálculo diferencial aplicado a la cinemática, hasta el modelado de dinámicas complejas de sistemas multicuerpo.

---

## 1. Galileo Lab: Cinemática Analítica en 1D

Este módulo está enfocado en el análisis analítico y gráfico de una partícula restringida a un grado de libertad (movimiento rectilíneo). Su núcleo es un motor de álgebra computacional (CAS).

### Capacidades Físico-Matemáticas:
- **Funciones de Posición $x(t)$**: Permite la inyección directa de funciones no lineales (polinómicas, trigonométricas armónicas, exponenciales para osciladores amortiguados).
- **Cálculo Diferencial en Tiempo Real**: Ejecuta derivaciones simbólicas estrictas para obtener de forma analítica exacta (sin errores de truncamiento numérico) la velocidad $v(t) = \frac{dx}{dt}$ y la aceleración $a(t) = \frac{d^2x}{dt^2}$.
- **Análisis de Gráficas Cinemáticas**: Dibuja simultáneamente las tres curvas ($x, v, a$ vs $t$). Es la herramienta pedagógica ideal para demostrar que los ceros (raíces) de la velocidad coinciden geométricamente con los extremos relativos (puntos de inflexión) de la posición.
- **Exportación Analítica**: Capacidad de exportar el desarrollo analítico renderizado en notación formal $\LaTeX$ para ser incrustado en informes académicos.

---

## 2. Newton Lab: Dinámica de Cuerpos Rígidos en 2D

A diferencia del módulo cinemático (basado en álgebra pura), Newton Lab utiliza un integrador numérico (Symplectic Euler basado en la arquitectura Box2D) que evalúa las ecuaciones diferenciales de Newton-Euler 60 veces por segundo. 

La gravedad predeterminada se asume como el vector $\vec{g} = (0, -9.81 \, m/s^2)$ en el **Sistema Internacional (SI)**, pudiendo alternar al **Sistema Inglés (US)** con $\vec{g} = (0, -32.174 \, ft/s^2)$. Todo el espacio se trata en un sistema de referencia inercial cartesiano estricto.

### A. Naturaleza de los Cuerpos (Bodies)
- **Cuerpos Dinámicos (Masas, Anillas)**: Resuelven ecuaciones de traslación ($\Sigma \vec{F} = m\vec{a}$) y rotación ($\Sigma \tau = I\alpha$). Al asignar masa, el motor calcula automáticamente la inercia rotacional ($I$) en función del tensor geométrico de la forma.
- **Formas Geométricas**:
  - *Partículas / Anillas:* Modeladas físicamente como circunferencias perfectas sin resistencia al rodamiento. Ideales para simular masas puntuales o collares en varillas.
  - *Cuerpos Rígidos (Cajas, Polígonos):* Calculan torque por fricción, colisiones con momento angular y traslacional.
- **Cuerpos Estáticos (Anclajes, Suelos):** Cuerpos con masa infinita e inercia rotacional infinita. No responden a fuerzas, operando como referencias rígidas inerciales.

### B. Propiedades Termodinámicas e Interactuantes de Superficie
- **Coeficientes de Fricción ($\mu$)**: Modelado empírico del rozamiento de Coulomb. Al chocar o deslizarse, el motor transiciona internamente entre fricción estática ($\mu_s$) y fricción cinética ($\mu_k$).
- **Coeficiente de Restitución ($e$)**: Rango $e \in [0, 1]$. Define si la colisión es inelástica perfecta ($e=0$, donde la energía cinética máxima se disipa) o elástica pura ($e=1$, conservación teórica total de la energía cinética y cantidad de movimiento lineal).

### C. Restricciones y Uniones Físicas (Joints)
El motor resuelve sistemas de restricciones holonómicas y no holonómicas mediante multiplicadores de Lagrange. Las herramientas en la interfaz crean uniones físicas:
- **Resortes Lineales**: Obedecen la Ley de Hooke amortiguada: $F = -k(\Delta x) - cv$. El usuario no ingresa el valor arbitrario de $k$, sino la **frecuencia natural ($f_n$, en Hertz)** y la **razón de amortiguamiento ($\zeta$)**. Esto permite a los ingenieros modelar osciladores subamortiguados ($\zeta < 1$) o críticamente amortiguados ($\zeta = 1$) con precisión analítica, independientemente de la masa anclada.
- **Cuerdas y Poleas Ideales**: Se modelan como varillas de longitud máxima inextensibles con masa y fricción nulas. Las poleas conservan la transmisión de la tensión del cable, reduciendo el problema mecánicamente a una máquina de Atwood clásica.
- **Rieles**: Aplican una restricción de distancia constante respecto a un punto, obligando a una partícula (anilla) a trasladarse sobre una curva o trayectoria fija sin ser absorbida por fuerzas normales.
- **Fijador (Anclaje Rígido)**: Transforma matemáticamente un cuerpo dinámico a estático en tiempo de ejecución, eliminando instantáneamente sus seis grados de libertad.
- **Rodillos (Apoyo Deslizante)**: Condición de frontera especial que anula la fricción inferior del cuerpo y transfiere toda la inercia a la traslación, evitando el torque por rodadura (ideal para simular carritos de laboratorio sin fricción).
- **Cotas de Medición**: Herramienta de telemetría in situ que extrae la distancia euclidiana paramétrica exacta entre dos coordenadas del plano inercial.

### D. Sistema de Adquisición de Datos (Telemetría/DAQ)
Newton Lab cuenta con un sistema robusto de toma de datos empíricos. Al presionar **Grabar Datos**, el motor toma 30 muestras discretas por segundo de los siguientes vectores referenciados al Centro de Masa (CM) de todos los cuerpos en movimiento:
- Posición absoluta $(X, Y)$ en metros.
- Velocidad lineal absoluta $(v_x, v_y)$ en m/s.
- Aceleración lineal resultante $(a_x, a_y)$ en m/s².
- Desplazamiento angular ($\theta$) en grados.
- Velocidad angular ($\omega$) en grad/s.

Al detener la grabación, se consolida una matriz en un archivo CSV. Esto está pensado para que el investigador o estudiante someta los datos crudos a análisis en Excel, Python o MATLAB, y valide empíricamente teoremas como el de **Trabajo-Energía ($W = \Delta K$)** o el de **Conservación de la Energía Mecánica ($E = K + U_g + U_e$)** a lo largo del tiempo de la simulación discreta.
