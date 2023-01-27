import { useRef } from "react"
import { TransformControls, TransformControlsProps } from "@react-three/drei"
import { Vector3 } from "three"
import { TransformControls as ThreeTransformControls } from "three/examples/jsm/controls/TransformControls"

export type TransformSnap = (t: ThreeTransformControls, startPosition: Vector3) => Vector3 | null
export type OnTransformSnap = (t: ThreeTransformControls) => void

export type SnapTransformControlsProps = Omit<TransformControlsProps, "mode" | "onObjectChange"> & {
    snap: TransformSnap
    onSnap: OnTransformSnap
}

export const SnapTransformControls: React.FC<SnapTransformControlsProps> = ({ snap, onSnap, ...props }) => {
    const start = useRef<Vector3 | null>(null)
    const last = useRef<Vector3>(new Vector3(0, 0, 0))
    return (
        <TransformControls
            {...props}
            space={"local"}
            onMouseDown={event => {
                if (!event) {
                    return
                }
                const t = event.target as ThreeTransformControls
                const obj = t.object
                if (!obj) {
                    return
                }
                start.current = obj.position.clone()
                last.current = obj.position.clone()
            }}
            onMouseUp={() => {
                start.current = null
            }}
            onObjectChange={event => {
                if (!event) {
                    return
                }
                const t = event.target as ThreeTransformControls
                const obj = t.object
                if (!obj) {
                    return
                }
                const coord = snap(t, start.current!)
                if (!coord) {
                    obj.position.copy(last.current)
                    // t.reset();
                } else {
                    const posChanged = !last.current.equals(coord)
                    last.current.copy(coord)
                    obj.position.copy(coord)
                    if (posChanged) {
                        onSnap(t)
                    }
                }
            }}
        />
    )
}

