"use client"

import { useState } from "react"
import { MeshProps, useFrame } from "@react-three/fiber"
import { Scene, Box3, Vector3, Raycaster, Intersection } from "three"

function getIntersectionPlane(raycaster: Raycaster, scene: Scene): Intersection | null {
    // First check intersection with Opla Blocks
    const boxes = scene.getObjectByName("opla")
    if (boxes) {
        const intersects = raycaster.intersectObjects(boxes.children)
        if (intersects.length > 0) {
            return intersects[0]
        }
    }

    // Fallback check for intersection with walls
    const walls = scene.getObjectByName("walls")
    if (walls) {
        const intersects = raycaster.intersectObjects(walls.children)
        if (intersects.length > 0) {
            return intersects[0]
        }
    }

    // No intersection found
    return null
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

function isBoxOutOfBounds(box: Box3): boolean {
    const [width, height, depth] = box.getSize(new Vector3()).toArray()
    const { x, y, z } = box.getCenter(new Vector3())
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

export type BoxCursorProps = MeshProps & {
    size: [number, number, number]
    color: string
}

export const BoxCursor: React.FC<BoxCursorProps> = ({ size, color, ...props }) => {
    const [pos, setPos] = useState(new Vector3(0, 0, 0))

    useFrame(({ raycaster, camera, pointer, scene }) => {
        const wall = getIntersectionPlane(raycaster, scene)
        if (!wall) {
            return
        }
        const [w, h, d] = size
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
        }

        setPos(pos)
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
