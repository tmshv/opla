"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { Scene, Box3, Object3D, Vector3, Raycaster, Intersection } from "three"
import { useSnapshot } from "valtio"
import { button, folder, useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { Walls } from "./walls"
import { unionBoxes } from "@/lib/t"
import { OplaBox, OplaGroup, OplaId, V3, state } from "@/stores/opla"
import appState, { Tool } from "@/stores/app"
import { OplaScene } from "./opla-scene"
import { OplaWires } from "./opla-wires"
import { hasIntersection, oplaItemToBox3, sizeToBox3 } from "@/lib/opla-geom"
import { Graph } from "@/lib/graph"
import { v4 as uuidv4 } from "uuid"
import { BoxCursor } from "./box-cursor"

function explode() {
    const groupIds = state.scene.filter(id => {
        const obj = state.items[id]
        return obj.type === "group"
    })
    for (const id of groupIds) {
        const group = state.items[id] as OplaGroup
        group.children.forEach(id => {
            const obj = state.items[id]
            obj.position[0] += group.position[0]
            obj.position[1] += group.position[1]
            obj.position[2] += group.position[2]
        })
    }

    state.scene = state.scene.flatMap(id => {
        const obj = state.items[id]
        switch (obj.type) {
            case "box": {
                return [id]
            }
            case "group": {
                return obj.children
            }
            default: {
                throw new Error("Unreachable")
            }
        }
    })

    for (const id of groupIds) {
        delete state.items[id]
    }
}

function join() {
    explode()

    // take all single boxes from scene
    const boxes = state.scene
        .filter(id => state.items[id].type === "box")
        .map(id => state.items[id] as OplaBox)

    const newScene: OplaId[] = []
    const graph = new Graph<OplaId, OplaBox>()
    for (const box of boxes) {
        graph.addNode(box.id, box)
    }

    for (const a of boxes) {
        for (const b of boxes) {
            // skip self intersection
            if (a.id === b.id) {
                continue
            }
            // skip no intersecion
            const bboxA = oplaItemToBox3(a)
            const bboxB = oplaItemToBox3(b)
            if (!bboxA.intersectsBox(bboxB)) {
                continue
            }
            graph.addEdge(a.id, b.id)
        }
    }

    const islands = graph.findAllIslands()
    for (const island of islands) {
        const children = [...island]

        // add single box back
        if (children.length === 1) {
            newScene.push(children[0])
            continue
        }

        // find center of children
        const groupBbox = unionBoxes(
            children.map(id => oplaItemToBox3(state.items[id] as OplaBox))
        )
        const center = groupBbox.getCenter(new Vector3)
        for (const boxId of children) {
            const box = state.items[boxId] as OplaBox
            const localPosition = new Vector3()
            localPosition.fromArray(box.position)
            localPosition.sub(center)
            box.position = localPosition.toArray()
        }

        const groupId = uuidv4()
        state.items[groupId] = {
            id: groupId,
            type: "group",
            position: center.toArray(),
            children,
        }
        newScene.push(groupId)
    }

    state.scene = newScene
}

function snapPosition(pos: number, size: number): number {
    const cell = Math.floor(pos)
    const cellShift = size % 2 === 0
        ? 0.5 // move by half cell
        : 0
    return cell + cellShift
}

function isBoxOutOfBounds(box: Box3): boolean {
    const [width, height, depth] = box.getSize(new Vector3()).toArray()
    const { x, y, z } = box.getCenter(new Vector3())
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

const snap: TransformSnap = t => {
    const snapObj = t.object as Object3D
    const objId = snapObj.name as OplaId
    const oplaObj = state.items[objId] // TODO: not sure it is right way to access object

    // Bboxes in [0; 0; 0] coord
    const boxes = oplaObj.type === "box"
        ? [sizeToBox3(oplaObj.size)]
        : oplaObj.children.map(id => oplaItemToBox3(state.items[id] as OplaBox))
    const bbox = unionBoxes(boxes)

    // New coord after move
    const [width, height, depth] = bbox.getSize(new Vector3()).toArray()
    const { x, y, z } = snapObj.position
    const coord = new Vector3(
        snapPosition(x, width),
        snapPosition(y, height),
        snapPosition(z, depth),
    )

    // Check out walls intersection with object in new position
    bbox.translate(coord)
    if (isBoxOutOfBounds(bbox)) {
        return null
    }

    // Check out scene intersection with object in new position
    for (const b of boxes) {
        b.translate(coord)
    }
    // TODO create cache for scene and items data
    if (hasIntersection(boxes, objId, state.scene, state.items)) {
        return null
    }

    return coord
}

type OplaSceneProps = {
}

const Main: React.FC<OplaSceneProps> = () => {
    const scene = useThree(state => state.scene)
    const { orbitEnabled, target, tool } = useSnapshot(appState)

    return (
        <>
            <OplaScene
                name={"opla"}
                highlightColor={"#FE4C04"}
                onClick={boxId => {
                    if (tool === Tool.SELECT) {
                        appState.target = boxId
                    } else {
                        appState.target = null
                    }
                }}
            />
            <OplaWires
                // scale={5} // first variant
                scale={5 * (4 / 3)} // 150mm variant
            />
            <OrbitControls
                enabled={orbitEnabled}
                makeDefault
                dampingFactor={0.25}
            />
            {(!target || tool !== Tool.SELECT || scene.getObjectByName(target) === null) ? null : (
                <SnapTransformControls
                    object={scene.getObjectByName(target) as any}
                    snap={snap}
                    onSnap={t => {
                        // Transforming opla definition from three model are here
                        const obj = t.object!
                        const boxId = obj.name as OplaId
                        state.items[boxId].position = obj.position.toArray()
                    }}
                />
            )}
        </>
    )
}

export default function Opla() {
    const { tool } = useSnapshot(appState)
    const { showWalls, cursorWidth, cursorHeight, cursorDepth } = useControls({
        showWalls: true,
        cursor: folder({
            cursorWidth: {
                min: 2, max: 5, step: 1, value: 2,
            },
            cursorHeight: {
                min: 2, max: 5, step: 1, value: 2,
            },
            cursorDepth: {
                min: 2, max: 5, step: 1, value: 2,
            },
        }),
        explode: button(() => {
            explode()
            appState.target = null
        }),
        join: button(() => {
            join()
            appState.target = null
        }),
    })

    return (
        <Canvas
            dpr={[1, 2]}
            onPointerMissed={() => {
                appState.target = null
                appState.orbitEnabled = true
            }}
            camera={{
                position: [5.5, 2.5, 12.0],
            }}
        >
            <ambientLight />
            <pointLight position={[5, 5, 5]} />
            <Environment
                background
                blur={1}
                files={"/assets/potsdamer_platz_1k.hdr"}
            />

            <Main />

            {tool !== Tool.ADD ? null : (
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

                        const id = `${Date.now()}`
                        const position = obj.position.toArray() as V3
                        const size = [cursorWidth, cursorHeight, cursorDepth] as V3

                        // add new box mutation
                        state.items[id] = {
                            id,
                            type: "box",
                            position,
                            size,
                        }
                        state.scene.push(id)
                    }}
                />
            )}

            {!showWalls ? null : (
                <Walls />
            )}
        </Canvas>
    )
}
