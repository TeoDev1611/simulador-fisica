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

## 🎓 Nivel Pruebas y Exámenes (ESPE / Dinámica de Partículas)
- **`14_medicion_cotas_rampa.json`**: Plano inclinado con esfera cayendo y cotas de ingeniería fijadas ($d, h, \theta$) para cálculo de distancia entre rebotes.
- **`15_cuna_rodillos_impacto.json`**: Cuña triangular montada sobre rodillos apoyados en piso liso sin fricción e impacto oblicuo de esfera (Problemas de cuñas deslizantes de examen).
- **`16_rebote_placas_restitucion.json`**: Pelota en rebote continuo sobre placas con restitución ($e = 0.8$), sensores de altura máxima ($h_{\text{max}}$) y configuración en sistema Inglés ($ft, ft/s$).

