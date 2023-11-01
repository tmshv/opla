import { proxy, ref } from "valtio"
import { Vector3 } from "three"

export type ViewportState = {
    cameraPosition: Vector3
    cameraDirection: Vector3
}

export default proxy<ViewportState>({
    cameraPosition: ref(new Vector3()),
    cameraDirection: ref(new Vector3()),
})
