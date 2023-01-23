'use client'

import { useCallback, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, TransformControlsProps, useCursor } from '@react-three/drei'
import { Box3, BoxGeometry, Group, Mesh, Object3D, Vector3 } from 'three'
import * as THREE from 'three'
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls'
import { proxy, useSnapshot } from 'valtio'

type State = {
    target: string | null,
    items: OplaBox[],
}

let state = proxy<State>({
    target: null,
    items: [
        {
            id: '1',
            position: [0, 0, 0],
            size: [1, 1, 1],
        },
        {
            id: '2',
            position: [0.5, 1, 0],
            size: [2, 1, 1],
        },
        {
            id: '3',
            position: [0, 1.5, 0],
            size: [1, 2, 1],
        },
        {
            id: '4',
            position: [2, 0, 0.5],
            size: [1, 1, 2],
        },
        {
            id: '5',
            position: [2.5, 2, 0.5],
            size: [2, 3, 4],
        },
        {
            id: '6',
            position: [0, 10, 0],
            size: [1, 1, 1],
        },
    ],
})

type BoxProps = {
    [key: string]: any
    size: [number, number, number]
}

const Box: React.FC<BoxProps> = ({ size, ...props }) => {
    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    return (
        <mesh {...props}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            scale={0.99}
        >
            <boxGeometry
                args={size}
            />
            <meshNormalMaterial />
        </mesh>
    )
}

function isInt(value: number): boolean {
    const n = Math.floor(value);
    return n === value;
}

function nextPosition(pos: number, size: number, sign: number): number {
    // const cell = Math.floor(pos);
    const cell = Math.round(pos);
    let cellShift = 0;

    // move by half cell
    if (size % 2 === 0) {
        cellShift = 0.5;
    }

    return cell + cellShift * sign
}

function boxIntersect(a: Box3, b: Box3): boolean {
    // console.log(a, b)

    // using 6 splitting planes to rule out intersections.
    return a.max.x < b.min.x
        || a.min.x > b.max.x
        || a.max.y < b.min.y
        || a.min.y > b.max.y
        || a.max.z < b.min.z
        || a.min.z > b.max.z
        ? false
        : true;
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
            console.log("intersect with", other.id)
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
    return (
        <TransformControls
            {...props}
            space={"local"}
            onMouseDown={event => {
                const t = event.target as ThreeTransformControls;
                pos.current = t.object.position.clone();
            }}
            onMouseUp={event => {
                const t = event.target as ThreeTransformControls;
                const coord = snap(t, pos.current);
                if (coord) {
                    const [x, y, z] = coord;
                    t.object.position.set(x, y, z);

                    const s = pos.current
                    console.log(`[${s.x}; ${s.y}; ${s.z}] -> [${x}; ${y}; ${z}]`)

                } else {
                    t.object.position.copy(pos.current)
                }
                pos.current = null
            }}
            onObjectChange={event => {
                const t = event.target as ThreeTransformControls;
                // const s = t.object.position;
                // console.log(`[${s.x}; ${s.y}; ${s.z}]`)
                const coord = snap(t);
                if (!coord) {
                    t.object.position.copy(pos.current)
                    // t.reset();
                } else {
                    const [x, y, z] = coord;
                    t.object.position.set(x, y, z);
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

function useOplaItems() {
    const scene = useThree(x => x.scene);
    // return useMemo(() => {
    //     return scene.getObjectByName("opla") as Group;
    // }, [scene]);
    return () => {
        return scene.getObjectByName("opla") as Group;
    }
}

type BoxesProps = {
    items: OplaBox[]
}

const Boxes: React.FC<BoxesProps> = ({ items }) => { return (
        <group name="opla">
            {items.map(box => (
                <Box
                    key={box.id}
                    position={box.position}
                    size={box.size}
                    onClick={(e) => {
                        // setTarget(e.object)
                        // state.target = e.object
                        state.target = e.object.id;
                        console.log("click on ", e.object.id)
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
        const obj = t.object as Mesh;
        if (isNegativePosition(obj.position)) {
            return null
        }

        const group = scene.getObjectByName("opla") as Group;
        if (isIntersects(obj, group)) {
            return null
        }

        const geom = obj.geometry as BoxGeometry
        const p = geom.parameters;
        const { width, height, depth } = p;
        const { x, y, z } = obj.position;
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
                    object={scene.getObjectById(target)}
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
            <OplaScene
                items={items}
            />
        </Canvas>
    )
}

