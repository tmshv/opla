"use client"

import { Suspense, useCallback, useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Edges, Environment, OrbitControls, useCursor, useGLTF } from "@react-three/drei"
import { BoxGeometry, Color, Group, Mesh, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { floor, isInt } from "@/lib/math"
import { Walls } from "./walls"
import { isIntersects } from "@/lib/t"
import { state } from "@/state"
import { useOpla } from "@/hooks/use-opla"

type Edge = [Vector3, Vector3]

const edgeNames = new Map([
    [1, "edge_200mm"],
    [2, "edge_400mm"],
    [3, "edge_600mm"],
    [4, "edge_800mm"],
])

type BoxProps = MeshProps & {
    width: number
    height: number
    depth: number
    color: string
    visible: boolean
}

const Box: React.FC<BoxProps> = ({ width, height, depth, visible, color, ...props }) => {
    const { showDebug } = useControls({ showDebug: false })
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    const a = showDebug ? 0.2 : 0

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
                opacity={visible ? 0.4 : a}
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
                            // nearest object to camera will receive first click event
                            // stop propagation to prevent click event for other object behind
                            event.stopPropagation()

                            state.target = event.object.name
                        }}
                    />
                )
            })}
        </group>
    )
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
    const [ns, es, overlaps] = useOpla()
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
                    if (!name) {
                        return null
                    }
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
                        const obj = t.object!
                        const i = state.items.findIndex(x => x.id === obj.name)
                        state.items[i].position = obj.position.toArray()
                    }}
                />
            )}
        </>
    )
}

export default function Opla() {
    const { showWalls } = useControls({ showWalls: true })
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

            {!showWalls ? null : (
                <Walls />
            )}
        </Canvas>
    )
}

