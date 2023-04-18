"use client"

import { useCallback, useState } from "react"
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { Scene, Box3, BoxGeometry, Group, Mesh, Object3D, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { button, buttonGroup, folder, useControls } from "leva"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { floor, isInt } from "@/lib/math"
import { Walls } from "./walls"
import { isIntersects, unionBoxes } from "@/lib/t"
import { OplaBox, OplaGroup, OplaId, V3, state } from "@/stores/opla"
import appState, { Tool } from "@/stores/app"
import { OplaScene } from "./opla-scene"
import { OplaWires } from "./opla-wires"
import { oplaItemToBox3 } from "@/lib/opla-geom"

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
    const visit = new Set<OplaId>()
    const boxes = Object
        .keys(state.items)
        .filter(id => state.items[id].type === "box")
        .map(id => state.items[id] as OplaBox)

    state.scene = []
    for (const a of boxes) {
        if (visit.has(a.id)) {
            continue
        }

        const group = new Set<OplaId>()
        for (const b of boxes) {
            if (a.id === b.id) {
                continue
            }
            if (visit.has(b.id)) {
                continue
            }
            const boxA = oplaItemToBox3(a)
            const boxB = oplaItemToBox3(b)
            if (boxA.intersectsBox(boxB)) {
                group.add(a.id)
                group.add(b.id)
                visit.add(a.id)
                visit.add(b.id)
            }
        }

        const gid = `${Math.random()}`
        state.items[gid] = {
            id: gid,
            type: "group",
            position: [0, 0, 0],
            children: [...group],
        }
        state.scene.push(gid)
    }

    // world to local boxes in groups
    const groups = Object
        .keys(state.items)
        .filter(id => state.items[id].type === "group")
        .map(id => state.items[id] as OplaGroup)
    for (const g of groups) {
        let center = new Vector3()
        for (const child of g.children) {
            const box = state.items[child] as OplaBox
            const pos = new Vector3()
            pos.fromArray(box.position)
            center.add(pos)
        }
        center.divideScalar(g.children.length)
        g.position = center.toArray()
        // for (const child of g.children) {
        //     const box = state.items[child] as OplaBox
        //     box.position[0] -= center.x
        //     box.position[1] -= center.y
        //     box.position[2] -= center.z
        // }
    }

    // add all separate boxes
    for (const box of boxes) {
        if (!visit.has(box.id)) {
            state.scene.push(box.id)
        }
    }
}

type BoxCursorProps = MeshProps & {
    size: [number, number, number]
    color: string
}

const BoxCursor: React.FC<BoxCursorProps> = ({ size, color, ...props }) => {
    // const raycaster = useThree(x => x.raycaster)
    const [pos, setPos] = useState(new Vector3(0, 0, 0))

    useFrame(({ raycaster, camera, pointer, scene }) => {
        // raycaster.setFromCamera(pointer, camera)
        const w = scene.getObjectByName("walls")
        if (!w) {
            return
        }
        // const w = scene.getObjectByName("opla")
        // const w = scene
        const intersects = raycaster.intersectObjects(w.children)

        if (intersects.length > 0) {
            const [w, h, d] = size
            const wall = intersects[0]
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
        }
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

function nextPosition(pos: number, size: number, sign: number): number {
    const cell = floor(pos)
    let cellShift = 0

    // move by half cell
    if (size % 2 === 0) {
        cellShift = 0.5
    }

    return cell + cellShift * sign
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

function isOutOfBounds(obj: Mesh): boolean {
    const geom = obj.geometry as BoxGeometry
    const { width, height, depth } = geom.parameters
    const { x, y, z } = obj.position
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

function isBoxOutOfBounds(box: Box3): boolean {
    const size = box.getSize(new Vector3())
    const { x: width, y: height, z: depth } = size
    const { x, y, z } = box.getCenter(new Vector3())
    return x - width / 2 < -0.5
        || y - height / 2 < -0.5
        || z - depth / 2 < -0.5
}

function boxGeometryToBox3(box: BoxGeometry): Box3 {
    const { width, height, depth } = box.parameters
    return new Box3(
        new Vector3(-width / 2, -height / 2, -depth / 2),
        new Vector3(width / 2, height / 2, depth / 2),
    )
}

function snapBox(scene: Scene, obj: Mesh): Vector3 | null {
    if (isOutOfBounds(obj)) {
        return null
    }

    const geom = (obj as Mesh).geometry as BoxGeometry
    const { width, height, depth } = geom.parameters
    const { x, y, z } = obj.position

    // snap coord
    const coord = new Vector3(
        isInt(x) ? x : nextPosition(x, width, 1),
        isInt(y) ? y : nextPosition(y, height, 1),
        isInt(z) ? z : nextPosition(z, depth, 1),
    )

    const bbox = boxGeometryToBox3(geom)
    bbox.translate(coord)
    const group = scene.getObjectByName("opla") as Group
    if (isIntersects(bbox, obj, group)) {
        return null
    }
    return coord
}

type OplaSceneProps = {
}

const Main: React.FC<OplaSceneProps> = () => {
    const scene = useThree(state => state.scene)
    const { orbitEnabled, target, tool } = useSnapshot(appState)
    const snap = useCallback<TransformSnap>(t => {
        const snapObj = t.object as Object3D
        const objId = snapObj.name as OplaId
        const obj = state.items[objId] // TODO: not sure it is right way to access object
        if (obj.type === "group") {
            const boxes = obj.children.map(id => oplaItemToBox3(state.items[id] as OplaBox))
            const bbox = unionBoxes(boxes)
            const size = bbox.getSize(new Vector3()).toArray()
            const [width, height, depth] = size
            const { x, y, z } = snapObj.position
            const coord = new Vector3(
                isInt(x) ? x : nextPosition(x, width, 1),
                isInt(y) ? y : nextPosition(y, height, 1),
                isInt(z) ? z : nextPosition(z, depth, 1),
            )
            return coord
        }
        return snapBox(scene, snapObj as Mesh)
    }, [scene])

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
                        const obj = t.object!
                        const boxId = obj.name
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
        }),
        explode: button(explode),
        join: button(() => {
            explode()
            join()
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
            <Environment preset="lobby" />

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
                        console.log("cursor", obj.position)

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
