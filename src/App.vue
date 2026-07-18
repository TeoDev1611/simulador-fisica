<script setup>
// src/App.vue
import { ref, shallowRef, computed } from 'vue'
import HomePage from './components/HomePage.vue'
import KinematicsSimulator from './components/KinematicsSimulator.vue'
import PhysicsSandbox2D from './components/physics/PhysicsSandbox2D.vue'
import EspeLogo from './components/EspeLogo.vue'

const tabs = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'kinematics', label: 'Cinemática 1D', icon: '📈', component: shallowRef(KinematicsSimulator) },
  { id: 'sandbox2d', label: 'Sandbox Físico 2D', icon: '🧲', component: shallowRef(PhysicsSandbox2D) }
]

const activeTabId = ref('home')
const activeTab = computed(() => tabs.find((t) => t.id === activeTabId.value))
const isDarkMode = computed(() => activeTabId.value !== 'home')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
    <!-- Header adaptativo -->
    <header
      class="border-b-4 border-emerald-700 shadow-sm transition-colors duration-300"
      :class="isDarkMode ? 'bg-gray-900' : 'bg-white'"
    >
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <EspeLogo :size="42" :dark-mode="isDarkMode" />
        <p
          class="hidden md:block text-xs font-semibold uppercase tracking-wider text-right"
          :class="isDarkMode ? 'text-emerald-300' : 'text-emerald-800'"
        >
          Departamento de Ciencias Exactas<br />
          <span class="font-normal normal-case tracking-normal" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
            Laboratorio de Simulación
          </span>
        </p>
      </div>
    </header>

    <!-- Barra de navegación (siempre verde institucional) -->
    <nav class="bg-emerald-800 border-b border-emerald-900/60 shadow-md">
      <div class="max-w-7xl mx-auto px-4 flex flex-wrap gap-1 py-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          @click="activeTabId = tab.id"
          class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 rounded-md transition-colors duration-150"
          :class="activeTabId === tab.id
            ? 'bg-white text-emerald-900 shadow-sm'
            : 'text-emerald-100 hover:bg-emerald-700/70'"
        >
          <span>{{ tab.icon }}</span> {{ tab.label }}
        </button>
      </div>
    </nav>

    <!-- Contenido principal -->
    <HomePage v-if="activeTabId === 'home'" class="flex-1 flex flex-col" @navigate="(id) => (activeTabId = id)" />
    <component v-else :is="activeTab.component.value" :key="activeTab.id" class="flex-1 flex flex-col" />

    <!-- Footer adaptativo -->
    <footer
      class="border-t-4 border-emerald-700 py-3 text-center text-[11px] transition-colors duration-300"
      :class="isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'"
    >
      ESPE © {{ new Date().getFullYear() }} — Departamento de Ciencias Exactas · Innovación para la Excelencia
    </footer>
  </div>
</template>