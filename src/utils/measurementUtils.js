// src/utils/measurementUtils.js
// Utilidades de conversión de unidades (SI vs Inglés), cálculo de cotas, restitución y sensores.

// Factores de conversión
export const METRIC_TO_IMPERIAL = {
  length: 3.28084,     // m -> ft
  velocity: 3.28084,   // m/s -> ft/s
  accel: 3.28084,      // m/s² -> ft/s²
  mass: 2.20462,       // kg -> lb
  force: 0.224809,     // N -> lbf
  energy: 0.737562     // J -> ft·lb
}

/**
 * Formatea un valor según el sistema de unidades activo ('metric' | 'imperial')
 */
export function formatValue(value, type = 'length', unitSystem = 'metric', decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0.00'
  
  let val = value
  if (unitSystem === 'imperial' && METRIC_TO_IMPERIAL[type]) {
    val = value * METRIC_TO_IMPERIAL[type]
  }

  return val.toFixed(decimals)
}

/**
 * Obtiene la etiqueta de unidad correspondiente al tipo y sistema
 */
export function getUnitLabel(type = 'length', unitSystem = 'metric') {
  const units = {
    metric: {
      length: 'm',
      velocity: 'm/s',
      accel: 'm/s²',
      mass: 'kg',
      force: 'N',
      energy: 'J'
    },
    imperial: {
      length: 'ft',
      velocity: 'ft/s',
      accel: 'ft/s²',
      mass: 'lb',
      force: 'lbf',
      energy: 'ft·lb'
    }
  }
  return units[unitSystem]?.[type] || ''
}

/**
 * Convierte un valor de entrada del usuario de Imperial a Métrico si es necesario
 */
export function parseInputToMetric(value, type = 'length', unitSystem = 'metric') {
  if (unitSystem === 'imperial' && METRIC_TO_IMPERIAL[type]) {
    return value / METRIC_TO_IMPERIAL[type]
  }
  return value
}

/**
 * Calcula los componentes geométricos de una cota entre dos puntos (en metros)
 */
export function calculateMeasurementData(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const distance = Math.hypot(dx, dy)
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI

  return {
    p1,
    p2,
    dx: Math.abs(dx),
    dy: Math.abs(dy),
    distance,
    angleDeg,
    isVertical: Math.abs(dx) < 0.05,
    isHorizontal: Math.abs(dy) < 0.05
  }
}

/**
 * Calcula el coeficiente de restitución empírico entre la velocidad incidente y de salida
 */
export function calculateRestitution(vIn, vOut) {
  const magIn = Math.hypot(vIn.x, vIn.y)
  const magOut = Math.hypot(vOut.x, vOut.y)
  if (magIn < 0.01) return 0
  return Math.min(1.0, magOut / magIn)
}
