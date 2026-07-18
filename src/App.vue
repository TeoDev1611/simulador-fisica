<script setup>
// src/App.vue
import { ref, shallowRef, computed } from 'vue'
import HomePage from './components/HomePage.vue'
import KinematicsSimulator from './components/KinematicsSimulator.vue'
import PhysicsSandbox2D from './components/physics/PhysicsSandbox2D.vue'
import WikiPage from './components/WikiPage.vue'
import EspeLogo from './components/EspeLogo.vue'
import { useTheme } from './composables/useTheme'

const { isDark, toggleTheme, initTheme } = useTheme()
initTheme()

const tabs = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'kinematics', label: 'Cinemática 1D', icon: '📈', component: shallowRef(KinematicsSimulator) },
  { id: 'sandbox2d', label: 'Sandbox Físico 2D', icon: '🧲', component: shallowRef(PhysicsSandbox2D) },
  { id: 'wiki', label: 'Wiki / Ayuda', icon: '📖', component: shallowRef(WikiPage) }
]

const activeTabId = ref('home')
const activeTab = computed(() => tabs.find((t) => t.id === activeTabId.value))
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <!-- Header adaptativo Glassmorphism -->
    <header
      class="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/60 shadow-md dark:shadow-xl z-50 sticky top-0"
    >
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <EspeLogo :size="42" :dark-mode="true" class="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <div class="flex items-center gap-4">
          <p
            class="hidden md:block text-xs font-semibold uppercase tracking-widest text-right text-emerald-600 dark:text-emerald-400"
          >
            Departamento de Ciencias Exactas<br />
            <span class="font-normal normal-case tracking-normal text-gray-500 dark:text-gray-400">
              Laboratorio de Simulación
            </span>
          </p>
          <button
            @click="toggleTheme"
            class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          >
            <span v-if="isDark" class="text-xl">☀️</span>
            <span v-else class="text-xl">🌙</span>
          </button>
        </div>
      </div>

      <!-- Barra de navegación integrada -->
      <nav class="border-t border-gray-200 dark:border-gray-800/40 bg-gray-100/50 dark:bg-gray-900/40 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 flex flex-wrap gap-2 py-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            @click="activeTabId = tab.id"
            class="flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group"
            :class="
              activeTabId === tab.id
                ? 'text-white shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
            "
          >
            <!-- Fondo animado para la pestaña activa -->
            <div
              v-if="activeTabId === tab.id"
              class="absolute inset-0 bg-gradient-to-r from-emerald-600/80 to-teal-500/80 pointer-events-none"
            ></div>
            <!-- Brillo de hover en inactivas -->
            <div
              v-else
              class="absolute inset-0 bg-gradient-to-r from-gray-700/0 via-gray-700/10 to-gray-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            ></div>

            <span class="relative z-10 drop-shadow-md text-base">{{ tab.icon }}</span>
            <span class="relative z-10 tracking-wide">{{ tab.label }}</span>
          </button>
        </div>
      </nav>
    </header>

    <!-- Contenido principal -->
    <main class="flex-1 flex flex-col relative z-0">
      <HomePage v-if="activeTabId === 'home'" class="flex-1 flex flex-col" @navigate="(id) => (activeTabId = id)" />
      <component v-else :is="activeTab.component.value" :key="activeTab.id" class="flex-1 flex flex-col" />
    </main>

    <!-- Footer Glassmorphism -->
    <footer
      class="border-t border-gray-200 dark:border-gray-800/80 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md text-gray-500 py-4 text-center text-xs tracking-wider z-50"
    >
      <span class="text-emerald-600 dark:text-emerald-500/80 font-bold">ESPE</span> © {{ new Date().getFullYear() }} —
      Ciencias Exactas · Innovación para la Excelencia
    </footer>
  </div>
</template>
