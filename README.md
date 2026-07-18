# Simulador Cinemático y Dinámico V1 — Laboratorio de Simulación ESPE

Este proyecto es una aplicación web interactiva desarrollada para la enseñanza y experimentación de conceptos de **Cinemática 1D** y **Dinámica 2D**. Está diseñado con un enfoque moderno, responsivo y orientado a la usabilidad.

## Características Principales

1. **Simulador Cinemático 1D:** 
   - Ingreso de ecuaciones matemáticas de posición en tiempo real (`x(t)`).
   - Derivación analítica automática para obtener la velocidad (`v(t)`) y la aceleración (`a(t)`).
   - Exportación de ecuaciones analíticas generadas a texto (TXT) e imagen (PNG).
   - Gráficas sincronizadas e interactivas generadas con Chart.js con soporte nativo de exportación a PNG.
   - Pista de simulación interactiva con capacidad de grabación de video (WebM).
2. **Sandbox Físico 2D (Newton Lab):** 
   - Motor de físicas 2D realista construido sobre **Planck.js** (basado en Box2D).
   - Sistema de **Deshacer y Rehacer (Undo/Redo)** con atajos de teclado (`Ctrl+Z`, `Ctrl+Y`) capaz de memorizar hasta 50 estados.
   - Herramientas de construcción libres: cajas, terrenos poligonales (múltiples simultáneos), anclajes, cuerdas, poleas, resortes y fuerzas constantes. Snap en vivo para facilitar conexiones.
   - **Persistencia:** Capacidad para Importar y Exportar el estado completo de la escena en archivos `.json`.
   - Soporte para grabar el lienzo dinámico directamente a un archivo de video `.webm`.
   - Modificación en caliente de propiedades físicas como masa, fricción, coeficientes elásticos (k) y amortiguamiento, calculando todo 60 veces por segundo.
3. **Manual / Wiki Integrado:** Documentación interactiva in-app para que el usuario aprenda a utilizar cada módulo.
4. **Modo Claro / Oscuro:** Soporte completo de temas visuales mediante `darkMode: 'class'` de Tailwind CSS, con un diseño "Glassmorphism" en todos los componentes.

## Estructura Actual del Proyecto

El proyecto ha sido refactorizado en componentes modulares altamente desacoplados:

```text
src/
├── App.vue                          # Shell principal: Navbar ESPE + control de temas
├── main.js / style.css              # Entrypoint y estilos globales de Tailwind
├── composables/
│   ├── usePlanckWorld.js            # Motor lógico de físicas 2D (Planck.js). Sin UI.
│   └── useTheme.js                  # Lógica de cambio entre Modo Claro y Oscuro
├── components/
│   ├── EspeLogo.vue                 # Logotipo institucional
│   ├── HomePage.vue                 # Página de bienvenida (Hero section)
│   ├── WikiPage.vue                 # Manual interactivo con soporte KaTeX
│   ├── MathKeyboard.vue             # Teclado virtual matemático
│   ├── KinematicsSimulator.vue      # Orquestador del simulador 1D
│   ├── kinematics/                  # Submódulo: Cinemática 1D
│   │   ├── ChartsPanel.vue          # Lógica visual de gráficos Chart.js
│   │   ├── ResultsCards.vue         # Tarjetas de lectura de resultados instantáneos
│   │   └── Track1D.vue              # Pista visual interactiva
│   └── physics/                     # Submódulo: Sandbox Dinámico 2D
│       ├── PhysicsSandbox2D.vue     # Orquestador: Maneja el bucle de animación y eventos
│       ├── PhysicsCanvas.vue        # Renderizado visual en HTML5 <canvas>
│       ├── ContextPanel.vue         # Panel lateral dinámico de propiedades (masa, resortes...)
│       ├── ToolRail.vue             # Barra de herramientas de construcción interactiva
│       └── PhysicsDataPanel.vue     # Panel de lectura de telemetría (fuerzas, velocidad angular)
```

## Arquitectura y Flujos

### 1. Desacoplamiento (Regla de Oro)
La física y la representación visual están separadas: `usePlanckWorld.js` procesa los vectores matemáticos de los cuerpos y articulaciones usando `markRaw()` para no romper la librería con la reactividad profunda de Vue. `PhysicsSandbox2D.vue` funciona como puente: llama al `step()` del motor 60 veces por segundo y le ordena a `PhysicsCanvas.vue` que dibuje los nuevos arrays de datos.

### 2. Atajos de Teclado Globales (UX)
Se han implementado accesos directos para agilizar el uso en computadoras:
- **`Enter` o `Espacio`:** Alterna de forma global entre Reproducir (▶) y Pausar (⏸) el tiempo en el Sandbox 2D. En Cinemática 1D, `Enter` fuerza el cálculo de la ecuación y reproduce la animación.
- **`Ctrl+Z` / `Ctrl+Y`:** Funciones de Deshacer (Undo) y Rehacer (Redo) el último cambio físico o de dibujo en el Sandbox 2D.
- **Teclas `1-8`:** Cambian inmediatamente la herramienta en el Sandbox 2D (Mover, Caja, Terreno, Cuerda, Resorte, Polea, Riel, Fuerza).
- **`Retroceso` / `Suprimir` (`9`):** Elimina el objeto o anclaje seleccionado.

### 3. SEO Básico y Despliegue
El proyecto cuenta con las etiquetas de optimización y meta descripciones en su archivo `index.html` (apuntando de forma canónica a la universidad). 
No cuenta con backend ni base de datos, toda la simulación se ejecuta directamente en el navegador del cliente (Client-Side). 

## Cómo Instalar y Ejecutar en Local

El gestor de paquetes recomendado es `pnpm`, aunque `npm` también funciona.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar servidor de desarrollo
pnpm run dev

# 3. Empaquetar para producción
pnpm run build
```

*(Nota de dependencias clave: `vue`, `vue-router` [no usado, ruteo por estado], `planck`, `mathjs`, `chart.js`, `katex`, `tailwindcss`).*

## Próximos Pasos (Deuda Técnica / Backlog)

- **Optimización en móviles:** La interfaz del Sandbox 2D (drag & drop) no soporta de forma nativa pantallas táctiles de manera óptima; la UX está diseñada primordialmente para escritorio (teclado + mouse).
- **Soporte PWA (Progresive Web App):** Habilitar el guardado sin conexión instalable en dispositivo.