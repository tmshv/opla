"use client"

import { Suspense } from "react"
import { Edges, useGLTF } from "@react-three/drei"
import { Color, Line3, Mesh, Vector3 } from "three"
import { useControls } from "leva"
import { useOpla } from "@/hooks/use-opla"

const edgeNames = new Map([
    [1 ** 2, "edge_200mm"],
    [2 ** 2, "edge_400mm"],
    [3 ** 2, "edge_600mm"],
    [4 ** 2, "edge_800mm"],
])

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

export type OplaWiresProps = {
}

export const OplaWires: React.FC<OplaWiresProps> = () => {
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
