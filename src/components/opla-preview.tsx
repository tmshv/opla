import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OplaModel } from "./opla-model"
import type { OplaModelData } from "@/stores/opla"
import state from "@/stores/opla"
import { useSnapshot } from "valtio"
import { useDeferredValue, useEffect } from "react"
import { sleep } from "@/lib/sleep"
import viewport from "@/stores/viewport"
import api from "@/api"

export type OplaPreviewOnChange = (image: string) => void

const Cam = () => {
    const { cameraPosition, cameraDirection } = useSnapshot(viewport)
    useFrame(({ camera }) => {
        camera.position.copy(cameraPosition)
        camera.lookAt(cameraDirection)
    })

    return null
}

export type SaveCoverProps = {
    onUpdate: OplaPreviewOnChange
}

const SaveCover: React.FC<SaveCoverProps> = ({ onUpdate }) => {
    const { value: { model } } = useSnapshot(state)
    const deffered = useDeferredValue(model)
    const { gl } = useThree()

    useEffect(() => {
        const image = gl.domElement.toDataURL("image/png")
        onUpdate(image)
    }, [deffered])

    return null
}


export type OplaPreviewProps = {
    onUpdate: OplaPreviewOnChange
}

export const OplaPreview: React.FC<OplaPreviewProps> = ({ onUpdate }) => {
    const { value: { model } } = useSnapshot(state)
    return (
        <Canvas
            dpr={[1, 2]}
            camera={{
                position: [10.5, 10.5, 5.5],
                //zoom: 40,
            }}
            gl={{
                preserveDrawingBuffer: true,
            }}
        >
            <Cam />
            <ambientLight
                intensity={4}
            />
            <pointLight position={[5, 5, 5]} />
            <color attach="background" args={["#DFE3E5"]} />

            <group scale={1}>
                <OplaModel
                    model={model as OplaModelData}
                    name={"opla-preview"}
                    scale={5 * (4 / 3)} // 150mm variant
                />
            </group>

            <SaveCover onUpdate={onUpdate} />
        </Canvas >
    )
}
