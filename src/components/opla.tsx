'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, TransformControlsProps, useCursor } from '@react-three/drei'
import { BoxGeometry, Mesh } from 'three'
import * as THREE from 'three'
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls'
// import { useControls } from 'leva'
// import create from 'zustand'

// const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }))
//

type BoxProps = {
    [key: string]: any
    size: [number, number, number]
}

const Box: React.FC<BoxProps> = ({ size, ...props }) => {
    // const setTarget = useStore((state) => state.setTarget)

    const [hovered, setHovered] = useState(false)
    useCursor(hovered)

    return (
        <mesh {...props}
            // onClick={(e) => setTarget(e.object)}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <boxGeometry
                args={size}
            // width={1}
            // height={2}
            // depth={1}
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

function isInvalidCell(cell: THREE.Vector3): boolean {
    return cell.x < 0 || cell.y < 0 || cell.z < 0
}

type OplaTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {

type TransformGuard = (t: ThreeTransformControls) => boolean;

type OplaTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {
    guard: TransformGuard
}

const OplaTransformControls: React.FC<OplaTransformControlsProps> = ({ guard, ...props }) => {
    return (
        <TransformControls
            {...props}
            // mode={"translate"}
            // space={"local"}
            onObjectChange={event => {
                const t = event.target as ThreeTransformControls;
                const obj = t.object as Mesh;

                const geom = obj.geometry as BoxGeometry
                const p = geom.parameters;
                const { width, height, depth } = p;
                const { x, y, z } = obj.position;
                // X - red | width
                // Y - green | height
                // Z - blue | depth
                // console.log(`move x=${x} y=${y} z=${z} [${width} ${height} ${depth}]`);

                if (!guard(t)) {
                    t.reset();
                }

                obj.position.set(
                    isInt(x) ? x : nextPosition(x, width),
                    isInt(y) ? y : nextPosition(y, height),
                    isInt(z) ? z : nextPosition(z, depth),
                );

                // const b = currentBlock
                // const cell = b.block.getCellPosition(b.pick.position, GRID_SIZE)
                // b.pick.position.copy(cell)
                // if (isBlockIntersects(currentBlock, defs)) {
                //     b.pick.position.copy(currentBlock.block.location)
                //     return
                // }
                // b.block.location.copy(cell)
                // b.model.position.copy(cell)
            }}
        />
    )
}

export default function App() {
    const [target, setTarget] = useState<any | null>(null)

    return (
        <Canvas dpr={[1, 2]} onPointerMissed={() => setTarget(null)}>
            <Box
                position={[0, 0, 0]}
                size={[1, 1, 1]}
                onClick={(e) => setTarget(e.object)}
            />
            <Box
                position={[0.5, 1, 0]}
                size={[2, 1, 1]}
                onClick={(e) => setTarget(e.object)}
            />
            <Box
                position={[0, 1.5, 1]}
                size={[1, 2, 1]}
                onClick={(e) => setTarget(e.object)}
            />
            <Box
                position={[2, 0, 0.5]}
                size={[1, 1, 2]}
                onClick={(e) => setTarget(e.object)}
            />

            {!target ? null : (
                <OplaTransformControls
                    object={target}
                    guard={t => {
                        const obj = t.object as Mesh;
                        if (isInvalidCell(obj.position)) {
                            return false
                        }

                        return true
                    }}
                />
            )}
            <OrbitControls makeDefault />
        </Canvas>
    )
}

