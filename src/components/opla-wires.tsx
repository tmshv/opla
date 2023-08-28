"use client"

import { Suspense } from "react"
import { useGLTF } from "@react-three/drei"
import { Color, FrontSide, HexColorString, Line3, Mesh, MeshStandardMaterial, Vector3 } from "three"
import { useControls } from "leva"
import { useOpla } from "@/hooks/use-opla"

const NODE = "node_25mm"
// const edgeNames = new Map([
//     [1 ** 2, "edge_200mm"],
//     [2 ** 2, "edge_400mm"],
//     [3 ** 2, "edge_600mm"],
//     [4 ** 2, "edge_800mm"],
// ])
const edgeNames = new Map([
    [2 ** 2, "edge_300mm"],
    [3 ** 2, "edge_450mm"],
    [4 ** 2, "edge_600mm"],
    [5 ** 2, "edge_750mm"],
])

const blankEdgeNames = new Map([
    [1 ** 2, "blank_150mm"],
])

// get rotation of edge asset
// according to how it is placed in GLB/blender file
// (Y axes got 0 rotation)
function getRotation(edge: Line3): [number, number, number] {
    const pi2 = Math.PI / 2
    const rotations = pi2 * 0
    const { start: a, end: b } = edge

    // Z
    if (a.x === b.x && a.y === b.y) {
        return [pi2, rotations, 0]
    }

    // Y
    if (a.x === b.x && a.z === b.z) {
        return [0, rotations, 0]
    }

    // X
    return [rotations, 0, pi2]
}

export type OplaWiresProps = {
}

export const OplaWires: React.FC<OplaWiresProps> = () => {
    const { showDebug, showMesh, nodeColor, edgeColor } = useControls({
        showDebug: false,
        showMesh: true,
        nodeColor: "#e58a27",
        edgeColor: "#4b4949",
    })
    const [nodes, edges, overlaps] = useOpla()
    const { nodes: assets, materials } = useGLTF("/assets/opla.glb")

    const plastic = materials["plastic"] as MeshStandardMaterial
    const wood = materials["wood"] as MeshStandardMaterial
    const warn = materials["warn"] as MeshStandardMaterial
    plastic.color.set(nodeColor as HexColorString)
    wood.color.set(edgeColor as HexColorString)
    warn.transparent = true
    warn.opacity = 0.2
    warn.side = FrontSide

    // const scale = 5 // first variant
    const scale = 5 * (2/3) * 2 // 150mm variant
    // const scale = 5 * 0.96 // new =200mm

    return (
        <Suspense fallback={null}>
            <group visible={showMesh}>
                {nodes.map((position, i) => {
                    const asset = (assets[NODE] as Mesh)
                    if (!asset) {
                        return null
                    }
                    const geometry = asset.geometry
                    return (
                        <mesh
                            key={i}
                            geometry={geometry}
                            position={position}
                            material={plastic}
                            scale={scale}
                        />
                    )
                })}
                {edges.map((edge, i) => {
                    const dist = edge.distanceSq()
                    let mat = wood
                    let name = edgeNames.get(dist)
                    if (!name) {
                        name = blankEdgeNames.get(dist)
                        mat = warn
                    }
                    if (!name) {
                        return null
                    }
                    const asset = (assets[name] as Mesh)
                    if (!asset) {
                        return null
                    }
                    const geometry = asset.geometry
                    const position = edge.at(0.5, new Vector3())
                    const rotation = getRotation(edge)

                    return (
                        <group
                            key={i}
                            position={position}
                            rotation={rotation}
                            scale={scale}
                        >
                            <mesh
                                geometry={geometry}
                                material={mat}
                            />
                            {/* <mesh */}
                            {/*     // castShadow */}
                            {/*     // receiveShadow */}
                            {/*     geometry={assets["opla_edge_400mm_1"].geometry} */}
                            {/*     material={materials.opla_label} */}
                            {/*     // material={materials.node} */}
                            {/* /> */}
                        </group>
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
