"use client"

import { Suspense, useCallback, useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Edges, Environment, OrbitControls, useCursor, useGLTF } from "@react-three/drei"
import { Box3, BoxGeometry, Color, Group, Line3, Mesh, Object3D, Vector3 } from "three"
import * as THREE from "three"
import { proxy, useSnapshot } from "valtio"
import { useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { floor, isInt } from "@/lib/math"
import { Walls } from "./walls"

type Edge = [Vector3, Vector3]

const edgeNames = new Map([
    [1, "edge_200mm"],
    [2, "edge_400mm"],
    [3, "edge_600mm"],
    [4, "edge_800mm"],
])

type State = {
    target: string | null,
    items: OplaBox[],
}

let state = proxy<State>({
    target: null,
    items: [
        {
            id: "1x 1y 1z",
            position: [0, 0, 0],
            size: [1, 1, 1],
        },
        {
            id: "2x 1y 1z",
            position: [0.5, 1, 0],
            size: [2, 1, 1],
        },
        {
            id: "1x 2y 1z",
            position: [0, 2.5, 0],
            size: [1, 2, 1],
        },
        {
            id: "1x 1y 2z",
            position: [2, 0, 0.5],
            size: [1, 1, 2],
        },
        {
            id: "1x 2y 3z",
            position: [2, 1.5, 1],
            size: [1, 2, 3],
        },
        {
            id: "2x 2y 4z",
            position: [4.5, 0.5, 1.5],
            size: [2, 2, 4],
        },
        {
            id: "3x 3y 3z",
            position: [8, 1, 1],
            size: [3, 3, 3],
        },
        {
            id: "cube",
            position: [0, 4, 0],
            size: [1, 1, 1],
        },
    ],
})

type BoxProps = MeshProps & {
    width: number
    height: number
    depth: number
    color: string
    visible: boolean
}

const Box: React.FC<BoxProps> = ({ width, height, depth, visible, color, ...props }) => {
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    return (
        <mesh {...props}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <boxGeometry
                args={[width, height, depth]}
            />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={visible ? 0.4 : 0}
            />
        </mesh>
    )
}

type BoxCursorProps = MeshProps & {
    size: [number, number, number]
    color: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BoxCursor: React.FC<BoxCursorProps> = ({ size, color, ...props }) => {
    // const raycaster = useThree(x => x.raycaster)
    const [hovered, setHovered] = useState(false)
    const [pos, setPos] = useState(new Vector3(0, 0, 0))
    useCursor(hovered)

    // raycaster.intersectObjects()

    useFrame(({ raycaster, camera, pointer, scene }) => {
        // raycaster.setFromCamera(pointer, camera)
        // const w = scene.getObjectByName("walls")
        // const w = scene.getObjectByName("opla")
        const w = scene
        const intersects = raycaster.intersectObjects(w.children)

        if (intersects.length > 0) {
            const wall = intersects[0]
            // console.log("frame", wall.object.name, wall.face.normal, wall.point)

            const pos = wall.point.clone()
            pos.x = floor(pos.x)
            pos.y = floor(pos.y)
            pos.z = floor(pos.z)

            // pos.add(wall.face.normal)

            setPos(pos)
        }
    })

    return (
        <mesh {...props}
            position={pos}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        // scale={0.99}
        >
            <boxGeometry
                args={size}
            />
            <meshStandardMaterial
                color={color}
                // side={THREE.DoubleSide}
                transparent
                opacity={0.85}
            // metalness={1}
            // roughness={0.4}
            />
        </mesh>
    )
}

function nextPosition(pos: number, size: number, sign: number): number {
    const cell = floor(pos)
    let cellShift = 0

    // move by half cell
    if (size % 2 === 0) {
        cellShift = 0.5
    }

    return cell + cellShift * sign
}

/*
* Same as intersection check in threejs but allow equals
*/
function boxIntersect(a: Box3, b: Box3): boolean {
    // using 6 splitting planes to rule out intersections.
    return a.max.x <= b.min.x
        || a.min.x >= b.max.x
        || a.max.y <= b.min.y
        || a.min.y >= b.max.y
        || a.max.z <= b.min.z
        || a.min.z >= b.max.z
        ? false
        : true
}

function isIntersects(block: Object3D, blocks: Group): boolean {
    // block.updateMatrixWorld()
    const bbox = new Box3()
    bbox.setFromObject(block)

    for (let other of blocks.children) {
        if (block === other) {
            continue
        }
        const o = new THREE.Box3()
        o.setFromObject(other)
        if (boxIntersect(bbox, o)) {
            return true
        }
    }

    return false
}

function isNegativePosition(cell: THREE.Vector3): boolean {
    return cell.x < 0 || cell.y < 0 || cell.z < 0
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isOutOfBounds(obj: Mesh): boolean {
    const geom = obj.geometry as BoxGeometry
    const { width: w, height: h, depth: d } = geom.parameters
    const [x, y, z] = obj.position.toArray()
    const out = x - w / 2 <= 0
        || y - h / 2 <= 0
        || z - d / 2 <= 0
    // if (out) {
    //     console.log("out of bounds", x, y, z, x - w / 2, y - h / 2, z - d / 2)
    // }
    return out
}

type OplaBox = {
    id: string
    position: [number, number, number]
    size: [number, number, number]
}

type BoxesProps = {
}

const Boxes: React.FC<BoxesProps> = () => {
    const { target, items } = useSnapshot(state)
    return (
        <group name="opla">
            {items.map(box => {
                const [width, height, depth] = box.size
                return (
                    <Box
                        key={box.id}
                        name={box.id}
                        position={box.position}
                        width={width}
                        height={height}
                        depth={depth}
                        visible={box.id === target}
                        color={"#aa00aa"}
                        onClick={event => {
                            state.target = event.object.name
                        }}
                    />
                )
            })}
        </group>
    )
}

/**
* x: row (+ right)
* y: column (+ up)
* z: diagonal (+ screen)
*    .f------b
*  .' |    .'|
* e---+--a'  |
* |   |  |   |
* |  ,g--+---c
* |.'    | .'
* h------d'
*
* faces
    [a, b, c, d, a],
    [a, b, f, e, a],
    [e, f, g, h, e],
    [h, d, c, g, h],
    [e, a, d, h, e],
    [f, b, c, g, g],
bbox
    [a, c],
    [a, f],
    [e, g],
    [h, c],
    [e, d],
    [f, c],
* edges:
*  ab
*  ad
*  ae
*  cd
*  cb
*  cg
*  dh
*  bf
*  fg
*  fe
*  eh
*  gh
* **/
function boxVerticies(x: number, y: number, z: number, width: number, height: number, depth: number): [number, number, number][] {
    return [
        [x + 0.5 * width, y + 0.5 * height, z + 0.5 * depth], // a
        [x + 0.5 * width, y + 0.5 * height, z - 0.5 * depth], // b
        [x + 0.5 * width, y - 0.5 * height, z - 0.5 * depth], // c
        [x + 0.5 * width, y - 0.5 * height, z + 0.5 * depth], // d
        [x - 0.5 * width, y + 0.5 * height, z + 0.5 * depth], // e
        [x - 0.5 * width, y + 0.5 * height, z - 0.5 * depth], // f
        [x - 0.5 * width, y - 0.5 * height, z - 0.5 * depth], // g
        [x - 0.5 * width, y - 0.5 * height, z + 0.5 * depth], // h
    ]
}

function pairs<T>(items: readonly T[]): [T, T][] {
    const pairs = []
    const visit = new Set<string>()
    const len = items.length
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len; j++) {
            if (i === j) {
                continue
            }
            // AB is the same as BA
            if (visit.has(`${i}-${j}`) || visit.has(`${j}-${i}`)) {
                continue
            }
            pairs.push([items[i], items[j]])
            visit.add(`${i}-${j}`)
            visit.add(`${j}-${i}`)
        }
    }
    return pairs
}

function getPlanes(center: Vector3, size: Vector3): Box3[] {
    const planes = []
    let box = new Box3()

    box = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    box.translate(new Vector3(size.x / 2, 0, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(0, -size.y / 2, -size.z / 2), new Vector3(0, size.y / 2, size.z / 2))
    box.translate(new Vector3(-size.x / 2, 0, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    box.translate(new Vector3(0, -size.y / 2, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, 0, -size.z / 2), new Vector3(size.x / 2, 0, size.z / 2))
    box.translate(new Vector3(0, +size.y / 2, 0))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    box.translate(new Vector3(0, 0, -size.z / 2))
    box.translate(center)
    planes.push(box)

    box = new Box3(new Vector3(-size.x / 2, -size.y / 2, 0), new Vector3(size.x / 2, size.y / 2, 0))
    box.translate(new Vector3(0, 0, size.z / 2))
    box.translate(center)
    planes.push(box)

    return planes
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function box3FromVector3(v: Vector3, size: number): Box3 {
    // const s = new Vector3(size, size, size)
    const min = v.clone()
    min.subScalar(size)
    const max = v.clone()
    max.addScalar(size)
    return new Box3(min, max)
}

/**
* returns two boxes in order [BIGGER, SMALLER]
*/
function sortBox3(a: Box3, b: Box3): [Box3, Box3] {
    if (a.containsBox(b)) {
        return [a, b]
    }
    return [b, a]
}

function vectorToAxes(v: Vector3): [Vector3, Vector3, Vector3] {
    return [
        new Vector3(v.x, 0, 0),
        new Vector3(0, v.y, 0),
        new Vector3(0, 0, v.z),
    ]
}

function vectorToAxes2(v: Vector3): [Vector3, Vector3] {
    const axes = vectorToAxes(v)
    const [a, b, _] = axes.filter(a => a.lengthSq() > 0)
    return [a, b]
}

function box3FromTwoVector3(a: Vector3, b: Vector3): Box3 {
    const box = new Box3()
    box.setFromPoints([a, b])
    return box
}

function box3ToCorners(box: Box3): [Vector3, Vector3, Vector3, Vector3] {
    const [ax, ay] = vectorToAxes2(box.getSize(new Vector3()))
    const a1 = box.min.clone()
    const a2 = box.min.clone()
    a2.add(ax)
    const a3 = box.min.clone()
    a3.add(ay)
    const a4 = box.max.clone()
    return [a1, a2, a3, a4]
}

/* split box A by box B to 9 parts
* required to box A contains box B
*/
function splitTo9(a: Box3, b: Box3): Box3[] {
    const [a1, a2, a3, a4] = box3ToCorners(a)
    const [b1, b2, b3, b4] = box3ToCorners(b)

    const boxes = []

    // boxes.push(box3FromVector3(a1, 0.01))
    // boxes.push(box3FromVector3(b1, 0.01))
    // boxes.push(box3FromVector3(a2, 0.01))
    // boxes.push(box3FromVector3(b2, 0.01))
    // boxes.push(box3FromVector3(a3, 0.01))
    // boxes.push(box3FromVector3(a4, 0.01))
    // boxes.push(box3FromVector3(b3, 0.01))
    // boxes.push(box3FromVector3(b4, 0.01))

    boxes.push(box3FromTwoVector3(a1, b1))
    boxes.push(box3FromTwoVector3(a2, b2))
    boxes.push(box3FromTwoVector3(a3, b3))
    boxes.push(box3FromTwoVector3(a4, b4))

    return boxes
}

function cleanNodes(nodes: Vector3[]): Vector3[] {
    const result: Vector3[] = []
    for (const node of nodes) {
        const i = result.findIndex(n => n.equals(node))
        if (i === -1) {
            result.push(node)
        }
    }
    return result
}

function isLinesOverlapping(a: Line3, b: Line3): boolean {
    const aa = new Box3()
    aa.setFromPoints([a.start, a.end])
    const bb = new Box3()
    bb.setFromPoints([b.start, b.end])
    return aa.containsBox(bb)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleanEdges(edges: Line3[]): Line3[] {
    const sorted = edges.sort((a, b) => {
        const da = a.delta(new Vector3())
        const db = b.delta(new Vector3())
        return da.lengthSq() - db.lengthSq()
    })
    const result: Line3[] = []
    for (const edge of sorted) {
        if (result.length === 0) {
            result.push(edge)
            continue
        }
        // const i = result.findIndex(n => n.equals(edge) || isLinesOverlapping(edge, n))
        const i = result.findIndex(n => isLinesOverlapping(edge, n))
        if (i === -1) {
            result.push(edge)
        } else {
            console.log("line overlap", edge, result[i])
        }
    }
    return result
}

function useWires(): [[number, number, number][], Edge[], Box3[]] {
    const { items } = useSnapshot(state)
    let nodes: Vector3[] = []
    for (const box of items) {
        const [x, y, z] = box.position
        const [width, height, depth] = box.size
        const vs = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
        for (const v of vs) {
            const i = nodes.findIndex(node => node.equals(v))
            if (i === -1) {
                nodes.push(v)
            }
        }
    }

    let edges: Line3[] = []
    for (const box of items) {
        const [x, y, z] = box.position
        const [width, height, depth] = box.size
        const [a, b, c, d, e, f, g, h] = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
        const boxEdges = [
            [a, b],
            [a, d],
            [a, e],
            [c, d],
            [c, b],
            [c, g],
            [d, h],
            [b, f],
            [f, g],
            [f, e],
            [e, h],
            [g, h],
        ]
        for (const [start, end] of boxEdges) {
            // const i = nodes.findIndex(node => eq(node, v))
            // if (i === -1) {
            edges.push(new Line3(start, end))
            // }
        }
    }

    // list of all polygons in scene
    // const polygons = items.flatMap(box => {
    //     const [x, y, z] = box.position
    //     const [width, height, depth] = box.size
    //     const [a, b, c, d, e, f, g, h] = boxVerticies(x, y, z, width, height, depth).map(([x, y, z]) => new Vector3(x, y, z))
    //     return [
    //         [a, b, c, d, a],
    //         [a, b, f, e, a],
    //         [e, f, g, h, e],
    //         [h, d, c, g, h],
    //         [e, a, d, h, e],
    //         [f, b, c, g, g],
    //     ]
    // })
    const overlaps = []
    for (const pair of pairs(items)) {
        const [a, b] = pair.map(box => {
            const [w, h, d] = box.size
            const b = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
            const [x, y, z] = box.position
            const pos = new Vector3(x, y, z)
            b.translate(pos)
            return b
        })

        if (a.intersectsBox(b)) {
            const bb = a.clone().intersect(b)
            const size = bb.getSize(new Vector3())
            const center = bb.getCenter(new Vector3())

            // if size of overlapping shape is match this pattern
            // [X, 0, 0], [0, X, 0], [0, 0, X]
            // means overlapping edge only not a polygon
            const isEdgeOverlap = size.toArray().filter(x => x !== 0).length === 1
            if (!isEdgeOverlap) {
                // overlaps.push(box3FromVector3(center, 0.01))

                const { position: positionA, size: sizeA } = pair[0]
                const planesA = getPlanes(new Vector3(...positionA), new Vector3(...sizeA))
                // for(let p of planesA) {
                //     overlaps.push(p)
                // }
                const a = planesA.find(plane => {
                    return plane.containsPoint(center)
                })
                const { position: positionB, size: sizeB } = pair[1]
                const planesB = getPlanes(new Vector3(...positionB), new Vector3(...sizeB))
                // for (let p of planesB) {
                //     overlaps.push(p)
                // }
                const b = planesB.find(plane => {
                    return plane.containsPoint(center)
                })

                console.log("overlap!")

                const [bigBox, smallBox] = sortBox3(a, b)
                for (let box of splitTo9(bigBox, smallBox)) {
                    if (box.isEmpty()) {
                        continue
                    }

                    try {
                        const [a1, a2, a3, a4] = box3ToCorners(box)
                        nodes.push(a1)
                        nodes.push(a2)
                        nodes.push(a3)
                        nodes.push(a4)

                        edges.push(new Line3(a1, a2))
                        edges.push(new Line3(a1, a3))
                        edges.push(new Line3(a2, a4))
                        edges.push(new Line3(a3, a4))
                    } catch (error) {
                        console.log("fail", box)
                    }
                    //     overlaps.push(box)
                }

                overlaps.push(a)
                overlaps.push(b)
                // overlaps.push(sortBox3(a, b)[0])
                // overlaps.push(bb)
            }
        }
    }
    return [
        cleanNodes(nodes).map(v => v.toArray()),
        // cleanEdges(edges).map(line => [line.start, line.end]),
        edges.map(line => [line.start, line.end]),
        overlaps,
    ]
}

function getRotation(edge: Edge): [number, number, number] {
    const [a, b] = edge

    // Z
    if (a.x === b.x && a.y === b.y) {
        return [Math.PI / 2, 0, 0]
    }

    // Y
    if (a.x === b.x && a.z === b.z) {
        return [0, 0, 0]
    }

    // X
    return [0, 0, Math.PI / 2]
}

type OplaWiresProps = {
}

const OplaWires: React.FC<OplaWiresProps> = () => {
    const { showDebug, showMesh } = useControls({ showDebug: false, showMesh: true })
    const [ns, es, overlaps] = useWires()
    const { nodes } = useGLTF("/assets/opla.glb")

    return (
        <Suspense fallback={null}>
            <group visible={showMesh}>
                {ns.map((pos, i) => {
                    const geom = (nodes.node_25mm as Mesh).geometry
                    return (
                        <mesh
                            key={i}
                            geometry={geom}
                            position={pos}
                            scale={5}
                        >
                            <meshStandardMaterial color={0xcccccc} metalness={0.9} roughness={0.1} />
                            <Edges
                                color={0x111111}
                            />
                        </mesh>
                    )
                })}
                {es.map((edge, i) => {
                    const [a, b] = edge
                    const pos = new Vector3()
                    pos.lerpVectors(a, b, 0.5)
                    const dist = a.distanceTo(b)
                    const name = edgeNames.get(dist)
                    const geom = (nodes[name] as Mesh).geometry
                    const r = getRotation(edge)
                    return (
                        <mesh
                            key={i}
                            geometry={geom}
                            position={pos}
                            rotation={r}
                            scale={5}
                        >
                            <meshStandardMaterial color={0xcccc99} metalness={1} roughness={0.5} />
                            <Edges
                                color={0x111111}
                            />
                        </mesh>
                    )
                })}
            </group>

            <group name="debug" visible={showDebug}>
                {overlaps.map((box, i) => (
                    <box3Helper
                        key={i}
                        args={[box, "#ff00ff" as unknown as Color]}
                    />
                ))}
            </group>
        </Suspense>
    )
}

type OplaSceneProps = {
}

const OplaScene: React.FC<OplaSceneProps> = () => {
    const scene = useThree(state => state.scene)
    const { target } = useSnapshot(state)

    const snap = useCallback<TransformSnap>(t => {
        const obj = t.object as Mesh
        // if (isOutOfBounds(obj)) {
        //     return null
        // }

        if (isNegativePosition(obj.position)) {
            return null
        }

        const group = scene.getObjectByName("opla") as Group
        if (isIntersects(obj, group)) {
            return null
        }

        const geom = obj.geometry as BoxGeometry
        const p = geom.parameters
        const { width, height, depth } = p
        const { x, y, z } = obj.position
        // const { x: sx, y: sy, z: sz } = start;
        const [sx, sy, sz] = [0, 0, 0]

        // X - red | width
        // Y - green | height
        // Z - blue | depth
        // console.log(`move x=${x} y=${y} z=${z} [${width} ${height} ${depth}]`);

        return new Vector3(
            isInt(x) ? x : nextPosition(x, width, x < sx ? -1 : 1),
            isInt(y) ? y : nextPosition(y, height, y < sy ? -1 : 1),
            isInt(z) ? z : nextPosition(z, depth, z < sz ? -1 : 1),
        )
    }, [scene])

    return (
        <>
            <Boxes />
            <OplaWires />
            <OrbitControls
                makeDefault
                dampingFactor={0.25}
            />
            {!target ? null : (
                <SnapTransformControls
                    object={scene.getObjectByName(target) as any}
                    snap={snap}
                    onSnap={t => {
                        const obj = t.object
                        const i = state.items.findIndex(x => x.id === obj.name)
                        state.items[i].position = obj.position.toArray()
                    }}
                />
            )}
        </>
    )
}

export default function Opla() {
    return (
        <Canvas
            dpr={[1, 2]}
            onPointerMissed={() => {
                state.target = null
            }}
            camera={{
                position: [5.5, 2.5, 12.0],
            }}
        >
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            <Environment preset="lobby" />

            <OplaScene />

            {/* <BoxCursor */}
            {/*     color="0xff00ff" */}
            {/*     size={[1, 1, 1]} */}
            {/*     position={[10, 10, 10]} */}
            {/* /> */}

            <Walls />
        </Canvas>
    )
}

