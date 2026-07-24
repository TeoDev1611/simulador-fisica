// tests/usePlanckWorld.test.js
import { describe, it, expect } from 'vitest'
import { usePlanckWorld } from '../src/composables/usePlanckWorld.js'

describe('usePlanckWorld - Motor Lógico Físico 2D', () => {
  it('debe crear cuerpos dinámicos y avanzar la simulación en el tiempo', () => {
    const { addBox, step, bodies } = usePlanckWorld()

    const boxId = addBox({
      x: 0,
      y: 10,
      width: 1.0,
      height: 1.0,
      mass: 2.0,
      friction: 0.3,
      restitution: 0.5,
      vx: 5.0,
      vy: 0
    })

    expect(boxId).toBeDefined()
    expect(bodies.length).toBe(1)
    const box = bodies.find((b) => b.id === boxId)
    expect(box.position.x).toBe(0)
    expect(box.position.y).toBe(10)

    // Avanzar 10 pasos de tiempo (10 x 1/60s)
    for (let i = 0; i < 10; i++) {
      step(1 / 60)
    }

    // La gravedad debe haber hecho caer el objeto (y disminuye) y la velocidad x lo desplaza
    expect(box.position.x).toBeGreaterThan(0)
    expect(box.position.y).toBeLessThan(10)
    expect(box.maxHeightReached).toBeGreaterThanOrEqual(10)
  })

  it('debe permitir alternar apoyos de rodillos en un objeto', () => {
    const { addBox, toggleRollers, bodies } = usePlanckWorld()

    const id = addBox({
      x: 0,
      y: 2,
      width: 2.0,
      height: 1.0,
      mass: 3.0
    })

    const hasRollers = toggleRollers(id)
    expect(hasRollers).toBe(true)

    const box = bodies.find((b) => b.id === id)
    expect(box.hasRollers).toBe(true)

    const hasRollersDisabled = toggleRollers(id)
    expect(hasRollersDisabled).toBe(false)
    expect(box.hasRollers).toBe(false)
  })

  it('debe permitir actualizar masa, fricción y restitución', () => {
    const { addBox, updateBoxMass, updateBoxFriction, updateBoxRestitution, bodies } = usePlanckWorld()

    const id = addBox({
      x: 0,
      y: 5,
      width: 1.0,
      height: 1.0,
      mass: 1.0
    })

    updateBoxMass(id, 5.0)
    updateBoxFriction(id, 0.8)
    updateBoxRestitution(id, 0.9)

    const box = bodies.find((b) => b.id === id)
    expect(box.mass).toBe(5.0)
    expect(box.friction).toBe(0.8)
    expect(box.restitution).toBe(0.9)
  })
})
