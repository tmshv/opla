"use client"

import { Suspense, useCallback, useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Edges, Environment, OrbitControls, useCursor, useGLTF } from "@react-three/drei"
import { Box3, BoxGeometry, Color, Group, Line3, Mesh, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { folder, useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { floor, isInt } from "@/lib/math"
import { Walls } from "./walls"
import { isIntersects } from "@/lib/t"
import { state } from "@/stores/opla"
import appState from "@/stores/app"
import { useOpla } from "@/hooks/use-opla"

const edgeNames = new Map([
    [1 ** 2, "edge_200mm"],
    [2 ** 2, "edge_400mm"],
    [3 ** 2, "edge_600mm"],
    [4 ** 2, "edge_800mm"],
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

const BoxCursor: React.FC<BoxCursorProps> = ({ size, color, ...props }) => {
    // const raycaster = useThree(x => x.raycaster)
    const [pos, setPos] = useState(new Vector3(0, 0, 0))

    useFrame(({ raycaster, camera, pointer, scene }) => {
        // raycaster.setFromCamera(pointer, camera)
        const w = scene.getObjectByName("walls")
        if (!w) {
            return
        }
        // const w = scene.getObjectByName("opla")
        // const w = scene
        const intersects = raycaster.intersectObjects(w.children)

        if (intersects.length > 0) {
            const [w, h, d] = size
            const wall = intersects[0]
            const pos = wall.point.clone()
            pos.set(
                snapCursorPosition(pos.x, w, 1),
                snapCursorPosition(pos.y, h, 1),
                snapCursorPosition(pos.z, d, 1),
            )

            // creates Box3 with center at mouse intersection
            const box = new Box3(
                new Vector3(-w / 2, -h / 2, -d / 2),
                new Vector3(w / 2, h / 2, d / 2),
            )
            box.translate(pos)

            if (isBoxOutOfBounds(box)) {
                console.log("out")
            }

            setPos(pos)
        }
    })

    return (
        <mesh {...props}
            position={pos}
        //onPointerOver={() => setHovered(true)}
        //onPointerOut={() => setHovered(false)}
        // scale={0.99}
        >
            <boxGeometry
                args={size}
            />
            <meshStandardMaterial
                color={color}
            // side={THREE.DoubleSide}
            // transparent
            // opacity={0.9}
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

function snapCursorPosition(pos: number, size: number, sign: number): number {
    // TODO: this check works for wall snapping only
    // but works bad on wall corners
    // adopt for box snapping later

    let cell = Math.round(pos)
    if (cell < 0) {
        cell = Math.round(size / 2) - 1
    }

    // move by half cell
    let cellShift = 0
    if (size % 2 === 0) {
        cellShift = 0.5
    }

    return cell + cellShift * sign
}

function isOutOfBounds(obj: Mesh): boolean {
    const geom = obj.geometry as BoxGeometry
    const { width, height, depth } = geom.parameters
    const { x, y, z } = obj.position
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

function isBoxOutOfBounds(box: Box3): boolean {
    const size = box.getSize(new Vector3())
    const { x: width, y: height, z: depth } = size
    const { x, y, z } = box.getCenter(new Vector3())
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

type BoxesProps = {
}

const Boxes: React.FC<BoxesProps> = () => {
    const { items } = useSnapshot(state)
    const { target } = useSnapshot(appState)
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

                            appState.target = event.object.name
                        }}
                    />
                )
            })}
        </group>
    )
}

// get rotation of edge asset
// according to how it is placed in GLB/blender file
// (Y axes got 0 rotation)
function getRotation(edge: Line3): [number, number, number] {
    // const [a, b] = edge
    const { start: a, end: b } = edge

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
    const [nodes, edges, overlaps] = useOpla()
    const { nodes: assets } = useGLTF("/assets/opla.glb")

    return (
        <Suspense fallback={null}>
            <group visible={showMesh}>
                {nodes.map((position, i) => {
                    const geometry = (assets.node_25mm as Mesh).geometry
                    return (
                        <mesh
                            key={i}
                            geometry={geometry}
                            position={position}
                            scale={5}
                        >
                            <meshStandardMaterial color={0xcccccc} metalness={0.9} roughness={0.1} />
                            <Edges
                                color={0x111111}
                            />
                        </mesh>
                    )
                })}
                {edges.map((edge, i) => {
                    const dist = edge.distanceSq()
                    const name = edgeNames.get(dist)
                    if (!name) {
                        return null
                    }
                    const geometry = (assets[name] as Mesh).geometry
                    const position = edge.at(0.5, new Vector3())
                    const rotation = getRotation(edge)
                    return (
                        <mesh
                            key={i}
                            geometry={geometry}
                            position={position}
                            rotation={rotation}
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

function boxGeometryToBox3(box: BoxGeometry): Box3 {
    const { width, height, depth } = box.parameters
    return new Box3(
        new Vector3(-width / 2, -height / 2, -depth / 2),
        new Vector3(width / 2, height / 2, depth / 2),
    )
}

type OplaSceneProps = {
}

const OplaScene: React.FC<OplaSceneProps> = () => {
    const scene = useThree(state => state.scene)
    const { orbitEnabled, target } = useSnapshot(appState)

    const snap = useCallback<TransformSnap>(t => {
        const obj = t.object as Mesh
        if (isOutOfBounds(obj)) {
            return null
        }

        const geom = obj.geometry as BoxGeometry
        const { width, height, depth } = geom.parameters
        const { x, y, z } = obj.position

        // snap coord
        const coord = new Vector3(
            isInt(x) ? x : nextPosition(x, width, 1),
            isInt(y) ? y : nextPosition(y, height, 1),
            isInt(z) ? z : nextPosition(z, depth, 1),
        )

        const bbox = boxGeometryToBox3(geom)
        bbox.translate(coord)
        const group = scene.getObjectByName("opla") as Group
        if (isIntersects(bbox, obj, group)) {
            return null
        }

        return coord
    }, [scene])

    return (
        <>
            <Boxes />
            <OplaWires />
            <OrbitControls
                enabled={orbitEnabled}
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
    const { showWalls, showCursor, cursorWidth, cursorHeight, cursorDepth } = useControls({
        showWalls: true,
        showCursor: true,
        cursor: folder({
            cursorWidth: {
                min: 1, max: 4, step: 1, value: 1,
            },
            cursorHeight: {
                min: 1, max: 4, step: 1, value: 1,
            },
            cursorDepth: {
                min: 1, max: 4, step: 1, value: 1,
            },
        }),
    })

    return (
        <Canvas
            dpr={[1, 2]}
            onPointerMissed={() => {
                appState.target = null
            }}
            camera={{
                position: [5.5, 2.5, 12.0],
            }}
        >
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            <Environment preset="lobby" />

            <OplaScene />

            {!showCursor ? null : (
                <BoxCursor
                    color="0x000000"
                    size={[cursorWidth, cursorHeight, cursorDepth]}
                    position={[0, 0, 0]}
                    onPointerDown={() => {
                        appState.orbitEnabled = false
                    }}
                    onPointerUp={() => {
                        appState.orbitEnabled = true
                    }}
                    onClick={(event) => {
                        const obj = event.object
                        console.log("cursor", obj.position)

                        state.items.push({
                            id: Math.random().toString(),
                            position: obj.position.toArray(),
                            size: [cursorWidth, cursorHeight, cursorDepth],
                        })
                    }}
                />
            )}

            {!showWalls ? null : (
                <Walls />
            )}
        </Canvas>
    )
}
