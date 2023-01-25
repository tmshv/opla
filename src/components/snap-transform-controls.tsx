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
                const t = event.target as ThreeTransformControls
                start.current = t.object.position.clone()
                last.current = t.object.position.clone()
            }}
            onMouseUp={() => {
                start.current = null
            }}
            onObjectChange={event => {
                const t = event.target as ThreeTransformControls
                const coord = snap(t, start.current)
                if (!coord) {
                    t.object.position.copy(last.current)
                    // t.reset();
                } else {
                    const posChanged = !last.current.equals(coord)
                    last.current.copy(coord)
                    t.object.position.copy(coord)
                    if (posChanged) {
                        onSnap(t)
                    }
                }
            }}
        />
    )
}

