// src/composables/usePlanckWorld.js
import { reactive, markRaw } from 'vue'
import { World, Box, Edge, Chain, Vec2, DistanceJoint, PulleyJoint, MouseJoint, AABB } from 'planck'

const DEFAULT_GRAVITY = 9.81

export function usePlanckWorld(gravityMagnitude = DEFAULT_GRAVITY) {
    const world = markRaw(new World({ gravity: Vec2(0, -gravityMagnitude) }))

    const bodies = reactive([]) // kind: 'box' | 'ground' | 'anchor'
    const ropes = reactive([])  // kind: 'rope' | 'spring' | 'pulley'

    let counter = 0
    const nextId = (prefix) => `${prefix}_${++counter}`

    let m_mouseJoint = null
    let m_groundBody = null

    function getGroundBody() {
        if (!m_groundBody) m_groundBody = world.createBody()
        return m_groundBody
    }

    // Distancia mínima de un punto a un segmento (para detectar clics sobre
    // un trozo de suelo dibujado a mano, que no es un polígono con área).
    function distPointToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay
        const lenSq = dx * dx + dy * dy
        let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0
        t = Math.max(0, Math.min(1, t))
        const cx = ax + t * dx, cy = ay + t * dy
        return Math.hypot(px - cx, py - cy)
    }

    // includeStatic: además de cajas (dinámicas), detecta anclajes y trozos de
    // suelo. Se usa para "seleccionar/borrar suelo" o "borrar anclaje", pero
    // NO para arrastrar/crear cuerdas (ahí solo interesan las cajas).
    function queryPoint(x, y, { includeStatic = false } = {}) {
        const point = Vec2(x, y)
        const aabb = new AABB(Vec2(x - 0.05, y - 0.05), Vec2(x + 0.05, y + 0.05))
        let foundId = null

        world.queryAABB(aabb, (fixture) => {
            if (fixture.getBody().getType() === 'dynamic' && fixture.testPoint(point)) {
                const b = bodies.find(entry => entry.body === fixture.getBody())
                if (b) {
                    foundId = b.id
                    return false
                }
            }
            return true
        })
        if (foundId || !includeStatic) return foundId

        const HIT_R = 0.18
        for (const b of bodies) {
            if (b.kind === 'anchor') {
                if (Math.hypot(b.position.x - x, b.position.y - y) <= HIT_R) return b.id
            }
        }
        for (const b of bodies) {
            if (b.kind === 'ground' && b.points && b.points.length > 1) {
                for (let i = 0; i < b.points.length - 1; i++) {
                    const p1 = b.points[i], p2 = b.points[i + 1]
                    if (distPointToSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= HIT_R) return b.id
                }
            }
        }
        return null
    }

    function startMouseDrag(id, x, y) {
        const entry = bodies.find(b => b.id === id)
        if (!entry || entry.kind !== 'box') return

        const body = entry.body
        body.setAwake(true)

        m_mouseJoint = new MouseJoint({
            target: Vec2(x, y),
            maxForce: 500.0 * body.getMass(),
            frequencyHz: 5,
            dampingRatio: 0.7
        }, getGroundBody(), body)

        world.createJoint(m_mouseJoint)
    }

    function updateMouseDrag(x, y) {
        if (m_mouseJoint) m_mouseJoint.setTarget(Vec2(x, y))
    }

    function stopMouseDrag() {
        if (m_mouseJoint) {
            world.destroyJoint(m_mouseJoint)
            m_mouseJoint = null
        }
    }

    // ----------------------------------------------------------------
    // Cajas
    // ----------------------------------------------------------------
    function addBox({ x, y, width = 1, height = 1, mass = 1, angle = 0, friction = 0.3, restitution = 0.1, color = '#34d399', label = '' }) {
        const area = width * height
        const density = area > 0 ? mass / area : 1
        const body = world.createDynamicBody({ position: Vec2(x, y), angle })

        // MEJORA: Habilitar "Bullet" (Continuous Collision Detection) 
        // Evita que la caja atraviese el suelo si se arrastra muy rápido
        body.setBullet(true)

        body.createFixture({ shape: new Box(width / 2, height / 2), density, friction, restitution })

        const id = nextId('box')
        bodies.push({
            id, kind: 'box', body: markRaw(body), label: label || id,
            width, height, mass, friction, color, position: { x, y }, angleRad: angle,
            normalForce: 0, weightForce: mass * gravityMagnitude,
            appliedForce: { enabled: false, magnitude: 0, angleDeg: 0 }
        })
        return id
    }

    function updateBoxFriction(id, newFriction) {
        const entry = bodies.find((b) => b.id === id && b.kind === 'box')
        if (!entry) return
        const safeFriction = Math.max(0, Math.min(2, newFriction))
        const fixture = entry.body.getFixtureList()
        if (fixture) {
            fixture.setFriction(safeFriction)
            entry.body.setAwake(true)
        }
        entry.friction = safeFriction
    }

    function updateBoxMass(id, newMass) {
        const entry = bodies.find((b) => b.id === id && b.kind === 'box')
        if (!entry) return
        const area = entry.width * entry.height
        const safeMass = Math.max(0.1, newMass)
        const density = area > 0 ? safeMass / area : 1

        const fixture = entry.body.getFixtureList()
        if (fixture) {
            fixture.setDensity(density)
            entry.body.resetMassData()
            entry.body.setAwake(true)
        }
        entry.mass = safeMass
        entry.weightForce = safeMass * gravityMagnitude
    }

    function setAppliedForce(id, { enabled, magnitude, angleDeg }) {
        const entry = bodies.find((b) => b.id === id && b.kind === 'box')
        if (!entry) return
        entry.appliedForce.enabled = enabled
        entry.appliedForce.magnitude = magnitude
        entry.appliedForce.angleDeg = angleDeg
        if (enabled) entry.body.setAwake(true)
    }

    function applyImpulse(id, magnitude, angleDeg) {
        const entry = bodies.find((b) => b.id === id && b.kind === 'box')
        if (!entry) return
        const rad = (angleDeg * Math.PI) / 180
        entry.body.setAwake(true)
        entry.body.applyLinearImpulse(Vec2(magnitude * Math.cos(rad), magnitude * Math.sin(rad)), entry.body.getWorldCenter(), true)
    }

    // ----------------------------------------------------------------
    // Terreno: uno o varios trozos independientes ("mesa" + "suelo" + ...)
    // ----------------------------------------------------------------
    // Antes solo podía existir UN suelo (dibujar uno nuevo borraba el
    // anterior). Ahora cada llamada a addGround AGREGA un trozo nuevo sin
    // tocar los demás — necesario para ejercicios de polea con dos alturas
    // (ej. mesa + piso) o con dos rampas separadas.
    let groundIds = []

    function addGround(points, friction = 0.5) {
        // Filtrar puntos para evitar vértices superpuestos que rompan Planck
        const validPoints = []
        for (const p of points) {
            if (validPoints.length === 0) {
                validPoints.push(p)
            } else {
                const prev = validPoints[validPoints.length - 1]
                const distSq = (p.x - prev.x) ** 2 + (p.y - prev.y) ** 2
                if (distSq > 0.01) validPoints.push(p)
            }
        }

        if (validPoints.length < 2) return null

        const vecs = validPoints.map((p) => Vec2(p.x, p.y))
        const body = world.createBody({ type: 'static' })
        body.createFixture({ shape: new Chain(vecs, false), friction })

        const id = nextId('ground')
        groundIds.push(id)
        bodies.push({
            id, kind: 'ground', body: markRaw(body),
            label: `Suelo ${groundIds.length}`, points: validPoints.map((p) => ({ x: p.x, y: p.y })),
            friction, color: '#9ca3af'
        })

        for (const b of bodies) if (b.kind === 'box') b.body.setAwake(true)
        return id
    }

    // Ahora recibe el id del trozo de suelo a editar (antes asumía que
    // solo existía uno). Cada trozo guarda su propia fricción.
    function setGroundFriction(id, friction) {
        const entry = bodies.find((b) => b.id === id && b.kind === 'ground')
        if (!entry) return
        const fixture = entry.body.getFixtureList()
        if (fixture) fixture.setFriction(friction)
        entry.friction = friction
        for (const b of bodies) if (b.kind === 'box') b.body.setAwake(true)
    }

    function getGroundIds() {
        return groundIds.slice()
    }

    // ----------------------------------------------------------------
    // Anclajes fijos
    // ----------------------------------------------------------------
    function addAnchor(x, y) {
        const body = world.createBody({ type: 'static', position: Vec2(x, y) })
        const id = nextId('anchor')
        bodies.push({ id, kind: 'anchor', body: markRaw(body), label: 'Anclaje', position: { x, y }, angleRad: 0 })
        return id
    }

    // Reposiciona un anclaje ya existente (ej. la rueda de una polea) para
    // poder ajustarla con precisión DESPUÉS de crearla, sin tener que borrar
    // todo y volver a dibujar. Un anclaje es estático, así que se mueve
    // directamente (no hay MouseJoint); si hay poleas que usan este anclaje
    // como su rueda, se reconstruyen (Planck no permite mover el ancla de
    // una PulleyJoint ya creada) conservando las mismas cajas conectadas.
    function moveAnchor(id, x, y) {
        const entry = bodies.find(b => b.id === id && b.kind === 'anchor')
        if (!entry) return
        entry.body.setPosition(Vec2(x, y))
        entry.position.x = x
        entry.position.y = y

        const affected = ropes.filter(r => r.kind === 'pulley' && r.wheelId === id)
        for (const r of affected) {
            const { bodyAId, bodyBId } = r
            removeRope(r.id)
            addPulley(bodyAId, bodyBId, id)
        }
    }

    // ----------------------------------------------------------------
    // Conectores
    // ----------------------------------------------------------------
    function addRope(idA, idB) {
        const entryA = bodies.find(b => b.id === idA)
        const entryB = bodies.find(b => b.id === idB)
        if (!entryA || !entryB) return null

        const anchorA = entryA.body.getWorldCenter()
        const anchorB = entryB.body.getWorldCenter()
        const length = Vec2.distance(anchorA, anchorB)

        const joint = new DistanceJoint({ frequencyHz: 0, dampingRatio: 0, length }, entryA.body, entryB.body, anchorA, anchorB)
        const created = world.createJoint(joint)

        const id = nextId('rope')
        ropes.push({ id, kind: 'rope', joint: markRaw(created), bodyAId: idA, bodyBId: idB, tension: 0, length })
        return id
    }

    function addSpring(idA, idB, { frequencyHz = 2.0, dampingRatio = 0.1 } = {}) {
        const entryA = bodies.find(b => b.id === idA)
        const entryB = bodies.find(b => b.id === idB)
        if (!entryA || !entryB) return null

        const anchorA = entryA.body.getWorldCenter()
        const anchorB = entryB.body.getWorldCenter()
        const length = Vec2.distance(anchorA, anchorB)

        const joint = new DistanceJoint({ frequencyHz, dampingRatio, length }, entryA.body, entryB.body, anchorA, anchorB)
        const created = world.createJoint(joint)

        const id = nextId('spring')
        ropes.push({ id, kind: 'spring', joint: markRaw(created), bodyAId: idA, bodyBId: idB, tension: 0, frequencyHz, dampingRatio })
        return id
    }

    function setSpringStiffness(id, frequencyHz, dampingRatio) {
        const entry = ropes.find((r) => r.id === id && r.kind === 'spring')
        if (!entry) return
        entry.joint.setFrequency(frequencyHz)
        if (dampingRatio !== undefined) entry.joint.setDampingRatio(dampingRatio)
        entry.frequencyHz = frequencyHz
        if (dampingRatio !== undefined) entry.dampingRatio = dampingRatio
        for (const b of bodies) if (b.kind === 'box') b.body.setAwake(true)
    }

    // wheelId (opcional): id de un anclaje que marca dónde está la RUEDA real
    // de la polea. Si se da, ambos cables (A y B) comparten ese mismo punto —
    // que es físicamente lo correcto para una polea de una sola rueda
    // (ej. el problema del bloque en la mesa + bloque colgando). Si no se da,
    // se usa el comportamiento anterior (estimar una altura común) como
    // respaldo para no romper compatibilidad.
    function addPulley(idA, idB, wheelId = null) {
        const entryA = bodies.find(b => b.id === idA)
        const entryB = bodies.find(b => b.id === idB)
        if (!entryA || !entryB) return null

        const anchorA = entryA.body.getWorldCenter()
        const anchorB = entryB.body.getWorldCenter()

        let groundAnchorA = null
        let groundAnchorB = null

        if (wheelId) {
            const wheelEntry = bodies.find(b => b.id === wheelId)
            if (wheelEntry) {
                const wp = wheelEntry.body.getWorldCenter()
                groundAnchorA = Vec2(wp.x, wp.y)
                groundAnchorB = Vec2(wp.x, wp.y)
            }
        }

        if (!groundAnchorA) {
            let groundY
            if (entryB.kind === 'anchor') groundY = anchorB.y
            else if (entryA.kind === 'anchor') groundY = anchorA.y
            else groundY = Math.max(anchorA.y, anchorB.y) + 4
            groundAnchorA = Vec2(anchorA.x, groundY)
            groundAnchorB = Vec2(anchorB.x, groundY)
        }

        const lengthA = Math.max(0.1, Vec2.distance(anchorA, groundAnchorA))
        const lengthB = Math.max(0.1, Vec2.distance(anchorB, groundAnchorB))

        const joint = new PulleyJoint(
            { lengthA, lengthB, ratio: 1.0 },
            entryA.body, entryB.body,
            groundAnchorA, groundAnchorB,
            anchorA, anchorB
        )
        const created = world.createJoint(joint)

        const id = nextId('pulley')
        ropes.push({
            id, kind: 'pulley', joint: markRaw(created),
            bodyAId: idA, bodyBId: idB, wheelId,
            groundAnchorA: { x: groundAnchorA.x, y: groundAnchorA.y },
            groundAnchorB: { x: groundAnchorB.x, y: groundAnchorB.y },
            tension: 0
        })
        return id
    }

    // ----------------------------------------------------------------
    // Riel circular ("collar" deslizando en un aro sin fricción)
    // ----------------------------------------------------------------
    // Físicamente es una varilla rígida desde un centro fijo hasta la caja
    // (DistanceJoint con frequencyHz: 0): mantiene el radio constante mientras
    // permite giro libre, que es exactamente el comportamiento de un cuerpo
    // ensartado en un riel/alambre circular (a diferencia de un tazón, el
    // riel empuja hacia ADENTRO o hacia AFUERA según haga falta).
    // Se guarda también el radio para poder dibujar el aro guía completo.
    function addCircularTrack(boxId, centerId) {
        const entryBox = bodies.find(b => b.id === boxId)
        const entryCenter = bodies.find(b => b.id === centerId)
        if (!entryBox || !entryCenter || entryBox.kind !== 'box') return null

        const anchorBox = entryBox.body.getWorldCenter()
        const anchorCenter = entryCenter.body.getWorldCenter()
        const radius = Vec2.distance(anchorBox, anchorCenter)
        if (radius < 0.05) return null

        const joint = new DistanceJoint(
            { frequencyHz: 0, dampingRatio: 0, length: radius },
            entryBox.body, entryCenter.body, anchorBox, anchorCenter
        )
        const created = world.createJoint(joint)

        const id = nextId('track')
        ropes.push({
            id, kind: 'track', joint: markRaw(created),
            bodyAId: boxId, bodyBId: centerId,
            tension: 0, radius
        })
        return id
    }

    function removeBody(id) {
        const idx = bodies.findIndex(b => b.id === id)
        if (idx === -1) return
        for (const r of [...ropes]) {
            if (r.bodyAId === id || r.bodyBId === id) removeRope(r.id)
        }
        world.destroyBody(bodies[idx].body)
        bodies.splice(idx, 1)
        groundIds = groundIds.filter((gid) => gid !== id)
    }

    function removeRope(id) {
        const idx = ropes.findIndex(r => r.id === id)
        if (idx === -1) return
        world.destroyJoint(ropes[idx].joint)
        ropes.splice(idx, 1)
    }

    function reset() {
        if (m_mouseJoint) {
            world.destroyJoint(m_mouseJoint)
            m_mouseJoint = null
        }
        for (const r of [...ropes]) removeRope(r.id)
        for (const b of [...bodies]) world.destroyBody(b.body)
        bodies.splice(0, bodies.length)
        ropes.splice(0, ropes.length)
        counter = 0
        groundIds = []
    }

    function syncTransforms() {
        for (const entry of bodies) {
            if (entry.kind !== 'box') continue
            try {
                const p = entry.body.getPosition()
                entry.position.x = p.x || 0
                entry.position.y = p.y || 0
                entry.angleRad = entry.body.getAngle() || 0
            } catch (err) { }
        }
    }

    function applyExternalForces() {
        for (const entry of bodies) {
            if (entry.kind !== 'box' || !entry.appliedForce?.enabled) continue
            const { magnitude, angleDeg } = entry.appliedForce
            if (!magnitude) continue
            const rad = (angleDeg * Math.PI) / 180
            entry.body.applyForceToCenter(Vec2(magnitude * Math.cos(rad), magnitude * Math.sin(rad)), true)
        }
    }

    function computeForces(dt) {
        try {
            const accum = new Map()
            for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
                if (!contact.isTouching()) continue
                const manifold = contact.getManifold()
                if (!manifold || manifold.pointCount === 0) continue

                let impulseSum = 0
                for (let i = 0; i < manifold.pointCount; i++) impulseSum += manifold.points[i].normalImpulse

                const normalForce = dt > 0 ? impulseSum / dt : 0
                const bodyA = contact.getFixtureA().getBody()
                const bodyB = contact.getFixtureB().getBody()
                accum.set(bodyA, (accum.get(bodyA) || 0) + normalForce)
                accum.set(bodyB, (accum.get(bodyB) || 0) + normalForce)
            }

            for (const entry of bodies) {
                if (entry.kind !== 'box') continue
                entry.normalForce = accum.get(entry.body) || 0
            }

            const invDt = dt > 0 ? 1 / dt : 0
            for (const r of ropes) {
                try {
                    const f = r.joint.getReactionForce(invDt)
                    r.tension = Math.hypot(f.x, f.y)
                } catch (e) { r.tension = 0 }
            }
        } catch (err) {
            console.warn("[Physics] Error calculando fuerzas", err)
        }
    }

    function step(dt = 1 / 60) {
        try {
            applyExternalForces()
            world.step(dt, 8, 3)
            syncTransforms()
            computeForces(dt)
        } catch (err) {
            console.error("[Physics] Motor colapsado, saltando frame", err)
        }
    }

    return {
        world, bodies, ropes,
        addBox, updateBoxMass, updateBoxFriction, setAppliedForce, applyImpulse,
        addGround, setGroundFriction, getGroundIds,
        addAnchor, moveAnchor,
        addRope, addSpring, setSpringStiffness, addPulley, addCircularTrack,
        removeBody, removeRope, reset, step,
        queryPoint, startMouseDrag, updateMouseDrag, stopMouseDrag
    }
}