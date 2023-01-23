"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Edges, Environment, OrbitControls, TransformControls, TransformControlsProps, useCursor, useGLTF } from "@react-three/drei"
import { Box3, BoxGeometry, Group, Mesh, Object3D, Vector3 } from "three"
import * as THREE from "three"
import { TransformControls as ThreeTransformControls } from "three/examples/jsm/controls/TransformControls"
import { proxy, subscribe, useSnapshot } from "valtio"

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
            position: [2, 1.5, 0],
            size: [1, 2, 3],
        },
        {
            id: "cube",
            position: [0, 4, 0],
            size: [1, 1, 1],
        },
    ],
})

type BoxProps = {
    [key: string]: any
    size: [number, number, number]
    color: string
}

const Box: React.FC<BoxProps> = ({ size, color, ...props }) => {
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    return (
        <mesh {...props}
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
                // transparent
                // opacity={0.85}
                metalness={1}
                roughness={0.4}
            />
            <Edges
                color={0x111111}
            />
        </mesh>
    )
}

type BoxCursorProps = MeshProps & {
    size: [number, number, number]
    color: string
}

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

function isInt(value: number): boolean {
    const n = Math.floor(value)
    return n === value
}

/*
* Need to floor number other way: -1.53 -> 1 (not 2)
*/
function floor(value: number): number {
    if (value < 0) {
        return Math.floor(value) + 1
    } else {
        return Math.floor(value)
    }
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

function isOutOfBounds(obj: Mesh): boolean {
    const geom = obj.geometry as BoxGeometry
    const p = geom.parameters
    // const { width, height, depth } = p
    const { x, y, z } = obj.position

    return x < 0 || y < 0 || z < 0
}

type TransformSnap = (t: ThreeTransformControls, startPosition: Vector3) => Vector3 | null
type OnTransformSnap = (t: ThreeTransformControls) => void

type SnapTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {
    snap: TransformSnap
    onSnap: OnTransformSnap
}

const SnapTransformControls: React.FC<SnapTransformControlsProps> = ({ snap, onSnap, ...props }) => {
    const pos = useRef<Vector3 | null>(null)
    const last = useRef<Vector3>(new Vector3(0, 0, 0))
    return (
        <TransformControls
            {...props}
            space={"local"}
            onMouseDown={event => {
                const t = event.target as ThreeTransformControls
                pos.current = t.object.position.clone()
            }}
            onMouseUp={event => {
                // const t = event.target as ThreeTransformControls
                // const coord = snap(t, pos.current)
                // const c = t.object.position
                // if (coord) {
                //     const [x, y, z] = coord
                //     t.object.position.set(x, y, z)
                //     const s = pos.current
                //     console.log(`[${s.x}; ${s.y}; ${s.z}] -> [${x}; ${y}; ${z}] ([${c.x}; ${c.y}; ${c.z}])`)
                // } else {
                //     t.object.position.copy(pos.current)
                // }
                pos.current = null
            }}
            onObjectChange={event => {
                const t = event.target as ThreeTransformControls
                const coord = snap(t, pos.current)
                if (!coord) {
                    t.object.position.copy(last.current)
                    // t.reset();
                } else {
                    const posChanged = !last.current.equals(coord)
                    last.current.copy(coord)
                    t.object.position.copy(coord)
                    if (posChanged) {
                        onSnap(t)
                    }
                }
            }}
        />
    )
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
            {items.map(box => (
                <Box
                    key={box.id}
                    name={box.id}
                    position={box.position}
                    size={box.size}
                    color={box.id === target
                        ? "#ff55ff"
                        : "#cccccc"
                    }
                    onClick={(e) => {
                        state.target = e.object.name
                    }}
                />
            ))}
        </group>
    )
}

function boxVerticies(x: number, y: number, z: number, width: number, height: number, depth: number) {
    return [
        [x + 0.5 * width, y + 0.5 * height, z + 0.5 * depth],
        [x + 0.5 * width, y - 0.5 * height, z - 0.5 * depth],
        [x + 0.5 * width, y + 0.5 * height, z - 0.5 * depth],
        [x + 0.5 * width, y - 0.5 * height, z + 0.5 * depth],
        [x - 0.5 * width, y + 0.5 * height, z + 0.5 * depth],
        [x - 0.5 * width, y - 0.5 * height, z - 0.5 * depth],
        [x - 0.5 * width, y + 0.5 * height, z - 0.5 * depth],
        [x - 0.5 * width, y - 0.5 * height, z + 0.5 * depth],
    ]
}

type OplaWiresProps = {
}

const OplaWires: React.FC<OplaWiresProps> = () => {
    // const scene = useThree(state => state.scene)
    const { items } = useSnapshot(state)
    const { nodes } = useGLTF("/assets/opla.glb")

    return (
        <Suspense fallback={null}>
            {items.map(box => {
                const [x, y, z] = box.position
                const geom = (nodes.node_25mm as Mesh).geometry

                const [width, height, depth] = box.size
                const vs = boxVerticies(x, y, z, width, height, depth)
                const a = vs[0]
                const b = vs[1]
                const c = vs[2]
                const d = vs[3]
                const e = vs[4]
                const f = vs[5]
                const g = vs[6]
                const h = vs[7]

                return (
                    <group
                        key={box.id}
                        dispose={null}
                    >
                        <mesh
                            geometry={geom}
                            position={a}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={b}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={c}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={d}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={e}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={f}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={g}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                        <mesh
                            geometry={geom}
                            position={h}
                            scale={4}
                        >
                            <meshNormalMaterial />
                        </mesh>
                    </group>
                )
            })}
        </Suspense>
    )
}
type OplaSceneProps = {
}

const OplaScene: React.FC<OplaSceneProps> = () => {
    const scene = useThree(state => state.scene)
    const { target } = useSnapshot(state)

    const snap = useCallback<TransformSnap>((t, start) => {
        const obj = t.object as Mesh
        if (isNegativePosition(obj.position)) {
            return null
        }

        if (isOutOfBounds(obj)) {
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
                    object={scene.getObjectByName(target)}
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

            <group name="walls">
                {/* normal to Y */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[1.5, -0.5 - 0.01, 1.5]}
                >
                    <planeGeometry args={[4, 4, 4]} />
                    <meshStandardMaterial
                        transparent
                        color={0x00ff00}
                        opacity={0.85}
                    />
                </mesh>
                {/* normal to X */}
                <mesh
                    rotation={[0, Math.PI / 2, 0]}
                    position={[-0.5 - 0.01, 1.5, 1.5]}
                >
                    <planeGeometry args={[4, 4, 4]} />
                    <meshStandardMaterial
                        transparent
                        color={0xff0000}
                        opacity={0.85}
                    />
                </mesh>
                {/* normal to Z */}
                <mesh
                    rotation={[0, 0, Math.PI / 2]}
                    position={[1.5, 1.5, -0.5 - 0.01]}
                >
                    <planeGeometry args={[4, 4, 4]} />
                    <meshStandardMaterial
                        transparent
                        color={0x0000ff}
                        opacity={0.85}
                    />
                </mesh>
            </group>
        </Canvas>
    )
}

