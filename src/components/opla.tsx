'use client'

import { useCallback, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, TransformControlsProps, useCursor } from '@react-three/drei'
import { BoxGeometry, Group, Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls'

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

function nextPosition(pos: number, size: number): number {
    const cell = Math.floor(pos);
    let cellShift = 1;

    // move by half cell
    if (size % 2 === 0) {
        cellShift = 0.5;
    }

    return cell + cellShift
}

function isIntersects(block: Object3D, blocks: Group): boolean {
    block.updateMatrixWorld()
    const bbox = new THREE.Box3()
    bbox.setFromObject(block)

    for (let other of blocks.children) {
        if (block === other) {
            continue
        }
        const o = new THREE.Box3()
        o.setFromObject(other)
        if (bbox.intersectsBox(o)) {
            return false
        }
    }

    return false
}

function isInvalidCell(cell: THREE.Vector3): boolean {
    return cell.x < 0 || cell.y < 0 || cell.z < 0
}

type TransformSnap = (t: ThreeTransformControls) => [number, number, number] | null

type SnapTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {
    snap: TransformSnap
}

const SnapTransformControls: React.FC<SnapTransformControlsProps> = ({ snap, ...props }) => {
    return (
        <TransformControls
            {...props}
            // mode={"translate"}
            // space={"local"}
            onObjectChange={event => {
                const t = event.target as ThreeTransformControls;
                const coord = snap(t);
                if (!coord) {
                    t.reset();
                    return;
                }
                const [x, y, z] = coord;
                t.object.position.set(x, y, z);
            }}
        />
    )
}

type OplaSceneProps = {
    target: Object3D | null
    children: React.ReactNode
}

const OplaScene: React.FC<OplaSceneProps> = ({ target, children }) => {
    const scene = useThree(x => x.scene);
    const snap = useCallback<TransformSnap>(t => {
        const obj = t.object as Mesh;
        if (isInvalidCell(obj.position)) {
            return null
        }

        // const group = scene.getObjectByName("opla") as Group;
        // if (isIntersects(obj, group)) {
        //     return null
        // }

        const geom = obj.geometry as BoxGeometry
        const p = geom.parameters;
        const { width, height, depth } = p;
        const { x, y, z } = obj.position;

        // X - red | width
        // Y - green | height
        // Z - blue | depth
        // console.log(`move x=${x} y=${y} z=${z} [${width} ${height} ${depth}]`);

        return [
            isInt(x) ? x : nextPosition(x, width),
            isInt(y) ? y : nextPosition(y, height),
            isInt(z) ? z : nextPosition(z, depth),
        ]
    }, [])

    return (
        <>
            <group name="opla">
                {children}
            </group>

            <OrbitControls makeDefault />
            {!target ? null : (
                <SnapTransformControls
                    object={target}
                    snap={snap}
                />
            )}
        </>
    )
}

export default function Opla() {
    const [target, setTarget] = useState<Object3D | null>(null)
    const [items, setItems] = useState([
        {
            id: 0,
            position: [0, 0, 0],
            size: [1, 1, 1],
        },
        {
            id: 1,
            position: [0.5, 1, 0],
            size: [2, 1, 1],
        },
        {
            id: 2,
            position: [0, 1.5, 0],
            size: [1, 2, 1],
        },
        {
            id: 3,
            position: [2, 0, 0.5],
            size: [1, 1, 2],
        },
        {
            id: 4,
            position: [2, 4, 0.5],
            size: [2, 3, 4],
        },
    ])

    return (
        <Canvas dpr={[1, 2]} onPointerMissed={() => setTarget(null)}>
            <OplaScene target={target}>
                {items.map(box => (
                    <Box
                        key={box.id}
                        position={box.position}
                        size={box.size}
                        onClick={(e) => setTarget(e.object)}
                    />
                ))}
            </OplaScene>
        </Canvas>
    )
}

