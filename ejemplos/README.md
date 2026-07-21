# Ejemplos de Newton Lab (Sandbox 2D)

Esta carpeta contiene 13 archivos JSON de escenas listas para importar en el simulador. Cada uno demuestra el uso del código y sirve para poner a prueba las distintas funcionalidades del motor físico. Puedes cargarlos directamente en el simulador usando el botón de **📂 Importar**.

## 🟢 Nivel Básico (Ideal para empezar)
- **`4_caja_simple.json`**: Una simple caja cayendo sobre un suelo. El ejemplo más puro.
- **`5_pendulo_simple.json`**: Una masa esférica colgada de un techo (pivote) mediante una cuerda.
- **`6_sistema_resortes.json`**: Dos bloques en una pista de hielo unidos por un resorte en el centro.
- **`11_billar_elastico.json`**: Tres esferas con "restitución 1.0" (rebote perfecto) y fricción 0 para estudiar colisiones elásticas puras.

## 🟡 Nivel Intermedio (Estudio de dinámicas)
- **`1_polea_mesa.json`**: El clásico ejercicio de una polea uniendo un bloque en la mesa y otro colgando en el vacío.
- **`7_dos_poleas_colgantes.json`**: Un sistema de 3 masas colgantes conectadas por 2 poleas distintas simultáneamente.
- **`8_plano_inclinado_friccion.json`**: Tres cajas (Hielo, Madera, Goma) sobre una rampa pronunciada. Perfecto para ver cómo sus distintos coeficientes de fricción afectan su deslizamiento.
- **`9_pendulo_doble.json`**: Demuestra la física del caos. Un anclaje conectado a un círculo, que a su vez está conectado a un segundo círculo.

## 🔴 Nivel Avanzado (Ingeniería y Mecanismos)
- **`2_collarin_resorte.json`**: Una anilla unida a un riel circular, traccionada por un resorte desde el techo.
- **`3_rampa_y_obstaculo.json`**: Demuestra el uso del generador de terrenos poligonales, obstáculos triangulares personalizados y amarras.
- **`10_coche_amortiguado.json`**: ¡Construcción de un chasis de automóvil! Dos ruedas unidas a un bloque central mediante 2 resortes que actúan como suspensión sobre un terreno montañoso.
- **`12_catapulta_balancin.json`**: Aprovecha una cuerda muy corta unida al centro de una tabla para crear un pivote/bisagra. Una masa pesada cae sobre un lado del balancín para disparar un proyectil.
- **`13_puente_colgante.json`**: Varios "tramos" de tabla amarrados entre sí por pequeñas cuerdas en secuencia, anclados a dos columnas maestras, soportando el peso de una carga pesada.
