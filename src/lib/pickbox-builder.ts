import * as THREE from 'three'

export type BoxColors = [
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
]

function hex(value: number) {
    const color = new THREE.Color()
    color.setHex(value)
    return color
}

export function randomColor() {
    return Math.floor(Math.random() * 0x1000000)
}

function applyVertexColorsToBoxFaces(geometry: THREE.BufferGeometry, colors: BoxColors) {
    const buffer: number[] = []
    colors.forEach(color => {
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
    })
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(buffer, 3))
}

export class PickboxBuilder {
    private position: THREE.Vector3
    private scale: THREE.Vector3
    private side: THREE.Side

    constructor() {
        this.side = THREE.FrontSide
    }

    public setPosition(value: THREE.Vector3) {
        this.position = value
        return this
    }

    public setScale(value: THREE.Vector3) {
        this.scale = value
        return this
    }

    public setSide(value: THREE.Side) {
        this.side = value
        return this
    }

    public setDoubleSide() {
        this.side = THREE.DoubleSide
        return this
    }

    public build(): THREE.Object3D {
        const colors: BoxColors = [
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
        ]
        const box = new THREE.BoxBufferGeometry()
        applyVertexColorsToBoxFaces(box, colors) // give the geometry's vertices a color corresponding to the "id"

        const pickingMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true,
            // flatShading: true,
            side: this.side,
        })
        const pick = new THREE.Mesh(box, pickingMaterial)
        pick.userData.colorId = colors

        if (this.position) {
            pick.position.copy(this.position)
        }

        if (this.scale) {
            pick.scale.copy(this.scale)
        }

        return pick
    }
}
