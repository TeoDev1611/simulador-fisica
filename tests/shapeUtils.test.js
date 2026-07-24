// tests/shapeUtils.test.js
import { describe, it, expect } from 'vitest'
import { createRegularPolygonVertices, calculatePolygonArea, SHAPE_PRESETS } from '../src/utils/shapeUtils.js'

describe('shapeUtils', () => {
  it('debe generar vértices de polígonos regulares correctamente para N=3..8', () => {
    for (let n = 3; n <= 8; n++) {
      const vertices = createRegularPolygonVertices(n)
      expect(vertices.length).toBe(n)
      // Comprobar que los vértices están acotados
      for (const v of vertices) {
        expect(v.x).toBeGreaterThanOrEqual(-0.6)
        expect(v.x).toBeLessThanOrEqual(0.6)
        expect(v.y).toBeGreaterThanOrEqual(-0.6)
        expect(v.y).toBeLessThanOrEqual(0.6)
      }
    }
  })

  it('debe calcular el área del rectángulo correctamente vía fórmula Shoelace', () => {
    // Vértices normalizados de un rectángulo 1x1
    const vertices = [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: -0.5 },
      { x: 0.5, y: 0.5 },
      { x: -0.5, y: 0.5 }
    ]
    const area = calculatePolygonArea(vertices, 2.0, 3.0)
    expect(area).toBeCloseTo(6.0, 4)
  })

  it('debe contener los presets de formas principales', () => {
    expect(SHAPE_PRESETS.length).toBeGreaterThanOrEqual(6)
    const triangle = SHAPE_PRESETS.find((s) => s.id === 'triangle')
    expect(triangle).toBeDefined()
    expect(triangle.sides).toBe(3)
  })
})
