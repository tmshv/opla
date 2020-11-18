import * as THREE from 'three'

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

export function box(width: number, height: number, depth: number) {
    width = width * 0.5
    height = height * 0.5
    depth = depth * 0.5

    var geometry = new THREE.BufferGeometry()
    var position = []

    position.push(
        - width, - height, - depth,
        - width, height, - depth,

        - width, height, - depth,
        width, height, - depth,

        width, height, - depth,
        width, - height, - depth,

        width, - height, - depth,
        - width, - height, - depth,

        - width, - height, depth,
        - width, height, depth,

        - width, height, depth,
        width, height, depth,

        width, height, depth,
        width, - height, depth,

        width, - height, depth,
        - width, - height, depth,

        - width, - height, - depth,
        - width, - height, depth,

        - width, height, - depth,
        - width, height, depth,

        width, height, - depth,
        width, height, depth,

        width, - height, - depth,
        width, - height, depth
    )

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))

    return geometry
}