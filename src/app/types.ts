import * as THREE from "three"

export interface IAssetLibrary {
    createAsset(name: string): THREE.Object3D | null
    getAssetNameBySize(name: string, value: number): string
}
