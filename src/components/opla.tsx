"use client"

import { useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { Scene, Box3, Object3D, Vector3, Raycaster, Intersection } from "three"
import { useSnapshot } from "valtio"
import { button, buttonGroup, folder, useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { isInt } from "@/lib/math"
import { Walls } from "./walls"
import { unionBoxes } from "@/lib/t"
import { OplaBox, OplaGroup, OplaId, V3, state } from "@/stores/opla"
import appState, { Tool } from "@/stores/app"
import { OplaScene } from "./opla-scene"
import { OplaWires } from "./opla-wires"
import { hasIntersection, oplaItemToBox3, sizeToBox3 } from "@/lib/opla-geom"
import { Graph } from "@/lib/graph"
import { v4 as uuidv4 } from "uuid"

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

type BoxCursorProps = MeshProps & {
    size: [number, number, number]
    color: string
}

const BoxCursor: React.FC<BoxCursorProps> = ({ size, color, ...props }) => {
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
            console.log("out")
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

function snapPosition(pos: number, size: number): number {
    const cell = Math.floor(pos)
    const cellShift = size % 2 === 0
        ? 0.5 // move by half cell
        : 0
    return cell + cellShift
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
                onClick={boxId => {
                    if (tool === Tool.SELECT) {
                        appState.target = boxId
                    } else {
                        appState.target = null
                    }
                }}
            />
            <OplaWires />
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
                min: 1, max: 4, step: 1, value: 1,
            },
            cursorHeight: {
                min: 1, max: 4, step: 1, value: 1,
            },
            cursorDepth: {
                min: 1, max: 4, step: 1, value: 1,
            },
        }),
        tool: buttonGroup({
            Select: () => { appState.tool = Tool.SELECT },
            Add: () => { appState.tool = Tool.ADD },
        }),
        clear: button(() => {
            // clear scene mutation
            state.scene = []
            state.items = {}
            appState.target = null
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
            <Environment files={"/st_fagans_interior_1k.hdr"} />

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
