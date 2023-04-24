import { IAssetLibrary } from "@/app/types"
import { OplaBox } from "@/stores/opla"
import { Vector3, Box3 } from "three"
import * as THREE from "three"

export function oplaItemToBox3(item: OplaBox) {
    const [w, h, d] = item.size
    const box = new Box3(new Vector3(-w / 2, -h / 2, -d / 2), new Vector3(w / 2, h / 2, d / 2))
    const [x, y, z] = item.position
    const pos = new Vector3(x, y, z)
    box.translate(pos)
    return box
}

// TODO: deprecated
export function createBoxVertices(size: THREE.Vector3) {
    const sx = size.x
    const sy = size.y
    const sz = size.z

    return [
        new THREE.Vector3(-sx, -sy, -sz),
        new THREE.Vector3(-sx, -sy, sz),
        new THREE.Vector3(-sx, sy, -sz),
        new THREE.Vector3(-sx, sy, sz),

        new THREE.Vector3(sx, -sy, -sz),
        new THREE.Vector3(sx, -sy, sz),
        new THREE.Vector3(sx, sy, -sz),
        new THREE.Vector3(sx, sy, sz),
    ]
}

// TODO: deprecated
export function createOplaModel(size: THREE.Vector3, assetlib: IAssetLibrary) {
    let scale = size.clone()
    const s = scale.clone().multiplyScalar(0.5)
    const sx = s.x
    const sy = s.y
    const sz = s.z

    const g = new THREE.Group()

    // nodes

    createBoxVertices(s).forEach(position => {
        let n = assetlib.createAsset("node_25mm")
        if (!n) {
            return
        }
        n.position.copy(position)
        g.add(n)
    })

    // y edges (vertical)

    let asset = assetlib.getAssetNameBySize("edge", scale.y)
    let n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.position.set(-sx, 0, -sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.position.set(-sx, 0, sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.position.set(sx, 0, -sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.position.set(sx, 0, sz)
    g.add(n)

    // z edges

    asset = assetlib.getAssetNameBySize("edge", scale.z)
    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }

    n.rotateX(Math.PI / 2)
    n.position.set(sx, -sy, 0)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateX(Math.PI / 2)
    n.position.set(sx, sy, 0)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateX(Math.PI / 2)
    n.position.set(-sx, sy, 0)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateX(Math.PI / 2)
    n.position.set(-sx, -sy, 0)
    g.add(n)

    // x edges

    asset = assetlib.getAssetNameBySize("edge", scale.x)
    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateZ(Math.PI / 2)
    n.position.set(0, -sy, -sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateZ(Math.PI / 2)
    n.position.set(0, sy, sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateZ(Math.PI / 2)
    n.position.set(0, -sy, sz)
    g.add(n)

    n = assetlib.createAsset(asset)
    if (!n) {
        return
    }
    n.rotateZ(Math.PI / 2)
    n.position.set(0, sy, -sz)
    g.add(n)

    return g
}
