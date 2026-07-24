// tests/measurementUtils.test.js
import { describe, it, expect } from 'vitest'
import {
  formatValue,
  getUnitLabel,
  parseInputToMetric,
  calculateMeasurementData,
  calculateRestitution
} from '../src/utils/measurementUtils.js'

describe('measurementUtils', () => {
  it('debe formatear valores en Sistema Internacional y Sistema Inglés', () => {
    // 1 metro = 3.28084 pies
    expect(formatValue(1.0, 'length', 'metric', 2)).toBe('1.00')
    expect(formatValue(1.0, 'length', 'imperial', 2)).toBe('3.28')

    // Etiquetas
    expect(getUnitLabel('length', 'metric')).toBe('m')
    expect(getUnitLabel('length', 'imperial')).toBe('ft')
    expect(getUnitLabel('velocity', 'imperial')).toBe('ft/s')
    expect(getUnitLabel('mass', 'imperial')).toBe('lb')
  })

  it('debe convertir entrada de usuario de Imperial a Métrico', () => {
    const feetInput = 3.28084
    const meters = parseInputToMetric(feetInput, 'length', 'imperial')
    expect(meters).toBeCloseTo(1.0, 4)
  })

  it('debe calcular la distancia euclídea y componentes de una cota', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 3, y: 4 }
    const data = calculateMeasurementData(p1, p2)

    expect(data.distance).toBeCloseTo(5.0, 4)
    expect(data.dx).toBeCloseTo(3.0, 4)
    expect(data.dy).toBeCloseTo(4.0, 4)
    expect(data.angleDeg).toBeCloseTo(53.13, 1)
  })

  it('debe calcular el coeficiente de restitución empírico', () => {
    const vIn = { x: 0, y: -10 }
    const vOut = { x: 0, y: 8 }
    const e = calculateRestitution(vIn, vOut)

    expect(e).toBeCloseTo(0.8, 2)
  })
})
