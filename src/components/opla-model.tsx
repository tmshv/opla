import { Suspense, useEffect, useState } from "react"
import { useGLTF, Edges } from "@react-three/drei"
import { ColorRepresentation, FrontSide, Group, Line3, Mesh, MeshStandardMaterial, Vector3 } from "three"
import { useOpla } from "@/hooks/use-opla"
import type { OplaModelData } from "@/stores/opla"

const NODE = "node_25mm"
const edgeNames = new Map([
    [2 ** 2, "edge_300mm"],
    [3 ** 2, "edge_450mm"],
    [4 ** 2, "edge_600mm"],
    [5 ** 2, "edge_750mm"],
])
const labelNames = new Map([
    [2 ** 2, "label_300mm"],
    [3 ** 2, "label_450mm"],
    [4 ** 2, "label_600mm"],
    [5 ** 2, "label_750mm"],
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

function useAssets(href: string): [Group, Record<string, MeshStandardMaterial>] {
    // const { nodes: assets, materials } = useGLTF("/assets/opla.glb")
    const gltf = useGLTF(href)
    const [materials, setMaterials] = useState<Record<string, MeshStandardMaterial>>({})

    useEffect(() => {
        gltf.parser.getDependencies("material").then((materials: MeshStandardMaterial[]) => {
            const mat = materials.reduce<Record<string, MeshStandardMaterial>>((acc, m) => {
                acc[m.name] = m
                return acc
            }, {})
            setMaterials(mat)
        })
    }, [gltf])

    return [gltf.scene, materials]
}

export type OplaModelProps = {
    model: OplaModelData
    scale: number
    name: string
    nodeColor?: ColorRepresentation
    edgeColor?: ColorRepresentation
}

export const OplaModel: React.FC<OplaModelProps> = ({ model, scale, name, nodeColor, edgeColor }) => {
    const [nodes, edges, _] = useOpla(model)
    const [scene, materials] = useAssets("/assets/opla.glb")

    const plastic = materials["plastic"]
    const wood = materials["wood"]
    const warn = materials["warn"]

    if (plastic && nodeColor) {
        plastic.color.set(nodeColor)
    }
    if (wood && edgeColor) {
        wood.color.set(edgeColor)
    }
    if (warn) {
        warn.transparent = true
        warn.opacity = 0.8
        warn.side = FrontSide
    }

    return (
        <Suspense fallback={null}>
            <group visible name={name} userData={{type: "opla-model"}}>
                {nodes.map((position, i) => {
                    const asset = (scene.getObjectByName(NODE) as Mesh)
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
                            userData={{type: "opla-node"}}
                        />
                    )
                })}
                {edges.map((edge, i) => {
                    let drawEdges = true
                    const dist = edge.distanceSq()
                    let mat = wood
                    let name = edgeNames.get(dist)
                    if (!name) {
                        name = blankEdgeNames.get(dist)
                        mat = warn
                        drawEdges = false
                    }
                    if (!name) {
                        return null
                    }
                    const asset = (scene.getObjectByName(name) as Mesh)
                    if (!asset) {
                        return null
                    }
                    const geometry = asset.geometry
                    const position = edge.at(0.5, new Vector3())
                    const rotation = getRotation(edge)

                    let label = null
                    if (labelNames.has(dist)) {
                        const name = labelNames.get(dist)!
                        const asset = (scene.getObjectByName(name) as Mesh)
                        const geometry = asset.geometry
                        label = (
                            <mesh
                                // {/*     // castShadow */}
                                // {/*     // receiveShadow */}
                                geometry={geometry}
                                material={plastic}
                                userData={{type: "opla-label"}}
                            />
                        )
                    }

                    return (
                        <group
                            key={i}
                            position={position}
                            rotation={rotation}
                            scale={scale}
                            userData={{type: "opla-edge-group"}}
                        >
                            <mesh
                                geometry={geometry}
                                material={mat}
                                userData={{type: "opla-edge"}}
                            >
                                <Edges visible={drawEdges} color={0x222222} />
                            </mesh>
                            {label}
                        </group>
                    )
                })}
            </group>
        </Suspense>
    )
}
