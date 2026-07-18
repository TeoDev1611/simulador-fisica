<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  cursorPosition: { type: Number, required: true },
  parameters: { type: Object, required: true },
  inputEl: { type: [HTMLInputElement, Object], default: null },
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:cursorPosition', 'toggle-parameters'])

const activeKeyboardTab = ref('basic')

const keyboardTabs = [
  { id: 'basic', label: '123' },
  { id: 'functions', label: 'f(x)' },
  { id: 'greek', label: 'αβγ' },
  { id: 'params', label: 'abc' }
]

const basicKeys = [
  { display: '7', insert: '7' },
  { display: '8', insert: '8' },
  { display: '9', insert: '9' },
  { display: '÷', insert: '/' },
  { display: '⌫', action: 'backspace' },
  { display: '4', insert: '4' },
  { display: '5', insert: '5' },
  { display: '6', insert: '6' },
  { display: '×', insert: '*' },
  { display: '(', insert: '(' },
  { display: '1', insert: '1' },
  { display: '2', insert: '2' },
  { display: '3', insert: '3' },
  { display: '−', insert: '-' },
  { display: ')', insert: ')' },
  { display: '0', insert: '0' },
  { display: '.', insert: '.' },
  { display: 't', insert: 't' },
  { display: '+', insert: '+' },
  { display: 'xʸ', insert: '^', cursorOffset: 0 },
  { display: 'π', insert: 'pi' },
  { display: '√', insert: 'sqrt()', cursorOffset: 1 },
  { display: 'x²', insert: '^2' },
  { display: 'x³', insert: '^3' },
  { display: 'C', action: 'clear' }
]

const functionKeys = [
  { display: 'sin(', insert: 'sin()', cursorOffset: 1 },
  { display: 'cos(', insert: 'cos()', cursorOffset: 1 },
  { display: 'tan(', insert: 'tan()', cursorOffset: 1 },
  { display: 'ln(', insert: 'log()', cursorOffset: 1 },
  { display: 'log₁₀(', insert: 'log10()', cursorOffset: 1 },
  { display: 'exp(', insert: 'exp()', cursorOffset: 1 },
  { display: 'abs(', insert: 'abs()', cursorOffset: 1 },
  { display: '√(', insert: 'sqrt()', cursorOffset: 1 },
  { display: 'asin(', insert: 'asin()', cursorOffset: 1 },
  { display: 'acos(', insert: 'acos()', cursorOffset: 1 },
  { display: 'atan(', insert: 'atan()', cursorOffset: 1 },
  { display: 'xʸ', insert: '^', cursorOffset: 0 },
  { display: '⌫', action: 'backspace' },
  { display: '(', insert: '(' },
  { display: ')', insert: ')' },
  { display: 'C', action: 'clear' }
]

const greekKeys = [
  { display: 'π', insert: 'pi' },
  { display: 'τ', insert: 'tau' },
  { display: 'e', insert: 'e' },
  { display: '⌫', action: 'backspace' },
  { display: 'C', action: 'clear' }
]

const paramKeys = computed(() => {
  const keys = Object.keys(props.parameters).map((name) => ({ display: name, insert: name, cursorOffset: 0 }))
  keys.push({ display: '+ param', action: 'openParams' })
  keys.push({ display: '⌫', action: 'backspace' })
  keys.push({ display: 'C', action: 'clear' })
  return keys
})

const currentKeys = computed(() => {
  if (activeKeyboardTab.value === 'functions') return functionKeys
  if (activeKeyboardTab.value === 'greek') return greekKeys
  if (activeKeyboardTab.value === 'params') return paramKeys.value
  return basicKeys
})

function pressKey(key) {
  if (key.action === 'openParams') {
    emit('toggle-parameters')
    return
  }

  const inputElement = props.inputEl
  if (inputElement) inputElement.focus()

  let newVal = props.modelValue
  let newPos = props.cursorPosition

  if (key.action === 'clear') {
    newVal = ''
    newPos = 0
  } else if (key.action === 'backspace') {
    if (newPos > 0) {
      newVal = props.modelValue.slice(0, newPos - 1) + props.modelValue.slice(newPos)
      newPos = newPos - 1
    }
  } else {
    newVal = props.modelValue.slice(0, newPos) + key.insert + props.modelValue.slice(newPos)
    newPos = newPos + key.insert.length - (key.cursorOffset ?? 0)
  }

  emit('update:modelValue', newVal)
  emit('update:cursorPosition', newPos)

  nextTick(() => {
    if (inputElement) {
      inputElement.setSelectionRange(newPos, newPos)
    }
  })
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2 max-h-0"
    enter-to-class="opacity-100 translate-y-0 max-h-[34rem]"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 max-h-[34rem]"
    leave-to-class="opacity-0 max-h-0"
  >
    <div
      v-if="isOpen"
      class="mt-3 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg p-3 overflow-hidden"
    >
      <div class="flex gap-1 mb-2">
        <button
          v-for="tab in keyboardTabs"
          :key="tab.id"
          type="button"
          @click="activeKeyboardTab = tab.id"
          class="flex-1 text-xs font-mono py-1 rounded-md transition-colors duration-150"
          :class="
            activeKeyboardTab === tab.id
              ? 'bg-emerald-200 dark:bg-emerald-600 text-gray-900 dark:text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-700'
          "
        >
          {{ tab.label }}
        </button>
      </div>
      <div
        class="grid gap-1.5"
        :class="
          activeKeyboardTab === 'basic'
            ? 'grid-cols-5'
            : activeKeyboardTab === 'functions'
              ? 'grid-cols-4'
              : activeKeyboardTab === 'params'
                ? 'grid-cols-4'
                : 'grid-cols-5'
        "
      >
        <button
          v-for="(key, idx) in currentKeys"
          :key="idx"
          type="button"
          @mousedown.prevent="pressKey(key)"
          class="font-mono text-sm py-2 rounded-md border transition-all duration-100 active:scale-95"
          :class="
            key.action === 'clear'
              ? 'bg-red-300/40 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-200/50 dark:bg-red-800/50'
              : key.action === 'backspace'
                ? 'bg-yellow-300/30 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200/40 dark:bg-yellow-800/40'
                : key.action === 'openParams'
                  ? 'bg-blue-300/30 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/40 dark:bg-blue-800/40'
                  : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-emerald-300 dark:bg-emerald-700 hover:border-emerald-800 dark:border-emerald-500 hover:text-gray-900 dark:text-white'
          "
        >
          {{ key.display }}
        </button>
      </div>
    </div>
  </Transition>
</template>
