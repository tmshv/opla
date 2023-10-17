"use client"

import { hasIntersection, oplaItemToBox3, sizeToBox3 } from "@/lib/opla-geom"
import { unionBoxes } from "@/lib/t"
import appState, { Tool } from "@/stores/app"
import { OplaBox, OplaId, V3, state } from "@/stores/opla"
import { Environment, OrbitControls } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { folder, useControls } from "leva"
import { Box3, MOUSE, Object3D, Scene, TOUCH, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { BoxCursor } from "./box-cursor"
import { OplaInteractive } from "./opla-interactive"
import { OplaWires } from "./opla-wires"
import { SnapTransformControls, TransformSnap } from "./snap-transform-controls"
import { Walls } from "./walls"
import { Grid } from "./grid"
import { useDarkTheme } from "@/hooks/use-dark-theme"
import { OplaDims } from "./opla-dims"

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
    const touch = !target || tool !== Tool.SELECT
    const { showDimensions } = useControls({
        showDimensions: true,
    })

    return (
        <>
            <OplaInteractive
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

            <OplaDims
                name={"opla-dimensions"}
                visible={showDimensions}
            />

            <OplaWires
                name="opla-model"
                // scale={5} // first variant
                scale={5 * (4 / 3)} // 150mm variant
            />
            <OrbitControls
                enabled={orbitEnabled}
                makeDefault
                //autoRotate
                //autoRotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={0}
                maxDistance={100}
                minDistance={1}
                mouseButtons={{
                    RIGHT: MOUSE.ROTATE,
                }}
                touches={!touch ? undefined : {
                    ONE: TOUCH.ROTATE,
                    TWO: TOUCH.DOLLY_PAN,
                }}
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

export type OplaProps = {
    scene: Scene
}

const Opla: React.FC<OplaProps> = ({ scene }) => {
    const dark = useDarkTheme()
    const { tool } = useSnapshot(appState)
    const { showWalls, wallsColor, gridColor, cursorWidth, cursorHeight, cursorDepth } = useControls({
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
        wallsColor: dark ? "#131517" : "#d3dbe2",
        gridColor: dark ? "#5d6265" : "#979ea3",
    })

    return (
        <Canvas
            scene={scene}
            dpr={[1, 2]}
            onPointerMissed={(e) => {
                const SELECT_BUTTON = 0
                if (e.button == SELECT_BUTTON) {
                    appState.target = null
                    appState.orbitEnabled = true
                }
            }}
            camera={{
                position: [5.5, 2.5, 12.0],
            }}
        >
            <ambientLight
                intensity={4}
            />
            <pointLight position={[5, 5, 5]} />
            <Environment
                background
                far={10}
                blur={0.5}
                files={"/assets/00309_OpenfootageNET_Snowland_low.hdr"}
            />

            <Main />

            {tool !== Tool.ADD ? null : (
                <BoxCursor
                    color="0x000000"
                    size={[cursorWidth, cursorHeight, cursorDepth]}
                    position={[0, 0, 0]}
                    onPointerDown={() => { }}
                    onPointerUp={() => { }}
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

            <Walls
                showGrid={true}
                showWalls={showWalls}
                color={wallsColor}
                gridColor={gridColor}
            />
            <Grid
                color={gridColor}
                number={10}
                lineWidth={0.03}
                height={0.25}
            />

        </Canvas>
    )
}

export default Opla
