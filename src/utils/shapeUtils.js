// src/utils/shapeUtils.js
// Utilidades para la generación y gestión de polígonos y formas geométricas multiforma.

/**
 * Genera vértices normalizados en el rango [-0.5, 0.5] para un polígono regular de N lados.
 * @param {number} sides - Número de lados (3 a 8)
 * @returns {Array<{x: number, y: number}>}
 */
export function createRegularPolygonVertices(sides) {
  const n = Math.max(3, Math.min(8, Math.round(sides)))
  const verts = []
  // Empezar en Math.PI / 2 para que el primer vértice apunte hacia ARRIBA (en coordenadas de física +Y arriba)
  const startAngle = Math.PI / 2
  for (let i = 0; i < n; i++) {
    const angle = startAngle + (2 * Math.PI * i) / n
    const x = Math.round(0.5 * Math.cos(angle) * 10000) / 10000
    const y = Math.round(0.5 * Math.sin(angle) * 10000) / 10000
    verts.push({ x, y })
  }
  return verts
}

/**
 * Calcula el área exacta normalizada de un polígono usando la fórmula del cordón (Shoelace formula).
 * @param {Array<{x: number, y: number}>} vertices
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function calculatePolygonArea(vertices, width, height) {
  if (!vertices || vertices.length < 3) return width * height * 0.5
  const n = vertices.length
  let areaSum = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    areaSum += vertices[i].x * vertices[j].y
    areaSum -= vertices[j].x * vertices[i].y
  }
  const normalizedArea = Math.abs(areaSum / 2)
  return Math.max(0.01, normalizedArea * width * height)
}

/**
 * Obtiene el nombre en español del polígono según su número de lados.
 * @param {number} sides
 * @returns {string}
 */
export function getPolygonName(sides) {
  const names = {
    3: 'Triángulo',
    4: 'Cuadrado / Rombo',
    5: 'Pentágono',
    6: 'Hexágono',
    7: 'Heptágono',
    8: 'Octágono'
  }
  return names[sides] || `Polígono (${sides} lados)`
}

/**
 * Galería de formas geométricas predeterminadas (Multiforma).
 */
export const SHAPE_PRESETS = [
  {
    id: 'box',
    label: 'Caja',
    shape: 'box',
    sides: 4,
    description: 'Rectángulo o cuadrado estándar'
  },
  {
    id: 'circle',
    label: 'Esfera',
    shape: 'circle',
    sides: 0,
    description: 'Círculo / Esfera perfecta'
  },
  {
    id: 'ring',
    label: 'Anilla',
    shape: 'ring',
    sides: 0,
    description: 'Aro hueco o collarín'
  },
  {
    id: 'ramp',
    label: 'Rampa',
    shape: 'polygon',
    sides: 3,
    description: 'Triángulo rectángulo ideal para planos inclinados',
    verts: [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: -0.5 },
      { x: -0.5, y: 0.5 }
    ]
  },
  {
    id: 'triangle',
    label: 'Triángulo',
    shape: 'polygon',
    sides: 3,
    description: 'Triángulo equilátero regular',
    verts: createRegularPolygonVertices(3)
  },
  {
    id: 'diamond',
    label: 'Rombo',
    shape: 'polygon',
    sides: 4,
    description: 'Cuadrado rotado a 45 grados',
    verts: createRegularPolygonVertices(4)
  },
  {
    id: 'pentagon',
    label: 'Pentágono',
    shape: 'polygon',
    sides: 5,
    description: 'Polígono regular de 5 lados',
    verts: createRegularPolygonVertices(5)
  },
  {
    id: 'hexagon',
    label: 'Hexágono',
    shape: 'polygon',
    sides: 6,
    description: 'Polígono regular de 6 lados',
    verts: createRegularPolygonVertices(6)
  },
  {
    id: 'heptagon',
    label: 'Heptágono',
    shape: 'polygon',
    sides: 7,
    description: 'Polígono regular de 7 lados',
    verts: createRegularPolygonVertices(7)
  },
  {
    id: 'octagon',
    label: 'Octágono',
    shape: 'polygon',
    sides: 8,
    description: 'Polígono regular de 8 lados (Forma de pare)',
    verts: createRegularPolygonVertices(8)
  },
  {
    id: 'trapezoid',
    label: 'Trapecio',
    shape: 'polygon',
    sides: 4,
    description: 'Cuadrilátero con base mayor y menor',
    verts: [
      { x: -0.3, y: 0.5 },
      { x: 0.3, y: 0.5 },
      { x: 0.5, y: -0.5 },
      { x: -0.5, y: -0.5 }
    ]
  }
]
