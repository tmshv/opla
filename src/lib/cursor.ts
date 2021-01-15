import * as THREE from 'three'

export type OplaCursorOptions = {
    color: number
    opacity: number
    scaleOffset: THREE.Vector3
}

export class OplaCursor {
    private cell: THREE.Vector3
    private mesh: THREE.Mesh
    private scaleOffset: THREE.Vector3

    constructor({ color, opacity, ...options }: OplaCursorOptions) {
        this.scaleOffset = options.scaleOffset
        this.cell = new THREE.Vector3()
        this.mesh = new THREE.Mesh(
            new THREE.BoxBufferGeometry(),
            new THREE.MeshBasicMaterial({
                color,
                opacity,
                transparent: true,
            })
        )
    }

    public isVisible() {
        return this.mesh.visible
    }

    public show() {
        this.mesh.visible = true
    }

    public hide() {
        this.mesh.visible = false
    }

    public setup(cell: THREE.Vector3, position: THREE.Vector3, scale: THREE.Vector3) {
        this.cell.copy(cell)
        this.mesh.position.copy(position)
        this.mesh.scale.copy(scale).add(this.scaleOffset)
    }

    public setPositionFrom(position: THREE.Vector3) {
        this.mesh.position.copy(position)
    }

    public getMesh() {
        return this.mesh
    }

    public getCell() {
        return this.cell
    }
}
