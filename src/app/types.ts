import * as THREE from 'three'

export interface IAssetLibrary {
    createAsset(name: string): THREE.Object3D
    getAssetNameBySize(name: string, value: number): string
}
