"use client"

import { useCallback, useRef, useState } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, TransformControls, TransformControlsProps, useCursor } from "@react-three/drei"
import { Box3, BoxGeometry, Group, Mesh, Object3D, Vector3 } from "three"
import * as THREE from "three"
import { TransformControls as ThreeTransformControls } from "three/examples/jsm/controls/TransformControls"
import { proxy, useSnapshot } from "valtio"

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
                // color={hovered
                //     ? "#ee99ee"
                //     : "#ffffff"
                // }
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

type TransformSnap = (t: ThreeTransformControls, startPosition: Vector3) => [number, number, number] | null

type SnapTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {
    snap: TransformSnap
}

const SnapTransformControls: React.FC<SnapTransformControlsProps> = ({ snap, ...props }) => {
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
                // const s = t.object.position
                // cur.current = s;
                // console.log(`[${s.x}; ${s.y}; ${s.z}]`)
                const coord = snap(t, pos.current)
                if (!coord) {
                    // const revert = last.current ?? pos.current
                    t.object.position.copy(last.current)
                    // t.reset();
                } else {
                    const [x, y, z] = coord
                    last.current.set(x, y, z)
                    t.object.position.set(x, y, z)
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
    items: OplaBox[]
}

const Boxes: React.FC<BoxesProps> = ({ items }) => {
    const { target } = useSnapshot(state)
    return (
        <group name="opla">
            {items.map(box => (
                <Box
                    key={box.id}
                    name={box.id}
                    position={box.position}
                    size={box.size}
                    color={box.id === target ? "#ff55ff" : "#ffffff"}
                    onClick={(e) => {
                        state.target = e.object.name
                    }}
                />
            ))}
        </group>
    )
}

type OplaSceneProps = {
    items: OplaBox[]
}

const OplaScene: React.FC<OplaSceneProps> = ({ items }) => {
    const scene = useThree(state => state.scene)
    const { target } = useSnapshot(state)

    const snap = useCallback<TransformSnap>((t, start) => {
        const obj = t.object as Mesh
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

        return [
            isInt(x) ? x : nextPosition(x, width, x < sx ? -1 : 1),
            isInt(y) ? y : nextPosition(y, height, y < sy ? -1 : 1),
            isInt(z) ? z : nextPosition(z, depth, z < sz ? -1 : 1),
        ]
    }, [])

    return (
        <>
            <Boxes items={items} />

            <OrbitControls makeDefault />
            {!target ? null : (
                <SnapTransformControls
                    object={scene.getObjectByName(target)}
                    snap={snap}
                />
            )}
        </>
    )
}

export default function Opla() {
    const { items } = useSnapshot(state)

    return (
        <Canvas
            dpr={[1, 2]}
            onPointerMissed={() => {
                state.target = null
            }}
        >
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            <OplaScene
                items={items}
            />

            {/* normal to Y */}
            <mesh
                rotation={[-Math.PI/2, 0, 0]}
                position={[1.5, -0.5, 1.5]}
            >
                <planeGeometry args={[4, 4, 4]} />
                <meshNormalMaterial />
            </mesh>
            {/* normal to X */}
            <mesh
                rotation={[0, Math.PI/2, 0]}
                position={[-0.5, 1.5, 1.5]}
            >
                <planeGeometry args={[4, 4, 4]} />
                <meshNormalMaterial />
            </mesh>
            {/* normal to Z */}
            <mesh
                rotation={[0, 0, Math.PI/2]}
                position={[1.5, 1.5, -0.5]}
            >
                <planeGeometry args={[4, 4, 4]} />
                <meshNormalMaterial />
            </mesh>
        </Canvas>
    )
}

