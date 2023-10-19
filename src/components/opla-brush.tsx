import { Canvas, useFrame } from "@react-three/fiber"
import { OplaModel } from "./opla-model"
import type { OplaModelData, V3 } from "@/stores/opla"

function simple(size: V3): OplaModelData {
    return {
        version: "1",
        items: {
            item: {
                id: "item",
                type: "box",
                position: [0, 0, 0],
                size,
            },
        },
        scene: ["item"],
    }
}

type CalcZoomProps = {
    size: V3
}

const CalcZoom: React.FC<CalcZoomProps> = ({ size }) => {
    const max = Math.max(...size)
    const r = max / (5 - 2) // max_size - min_size

    useFrame(({ camera }) => {
        camera.zoom = 40 - (15 * r)
    })

    return null
}

export type OplaBrushProps = {
    size: V3
}

export const OplaBrush: React.FC<OplaBrushProps> = ({ size }) => {
    return (
        <Canvas
            dpr={[1, 2]}
            camera={{
                position: [3.0, 2.5, 5.0],
                zoom: 40,
            }}
            orthographic
        >
            <CalcZoom size={size} />
            <ambientLight
                intensity={4}
            />
            <pointLight position={[5, 5, 5]} />
            <color attach="background" args={["#fff"]} />

            <group scale={1}>
                <OplaModel
                    model={simple(size)}
                    name={"opla-brush"}
                    scale={5 * (4 / 3)} // 150mm variant
                />
            </group>
        </Canvas>
    )
}
