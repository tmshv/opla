import * as THREE from 'three'

export const materialLib = new Map([
    ['open', new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, opacity: 1 })],
    ['closed', new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true, vertexColors: false, shininess: 0 })],
])

export function randomColor() {
    return Math.floor(Math.random() * 0x1000000)
}

class IdGenerator {
    private next: number

    constructor(start: number) {
        this.next = start
    }

    public create() {
        return this.next++
    }
}

export class OplaGrid {
    public axisX: number[]
    public axisY: number[]
    public axisZ: number[]

    public getCellDimensions(cell: THREE.Vector3) {
        const x = this.axisX[cell.x]
        const y = this.axisY[cell.y]
        const z = this.axisZ[cell.z]

        return new THREE.Vector3(x, y, z)
    }
}

export class OplaBlock {
    public id: number
    public colorId: number
    public blockType: string
    public cellLocation: THREE.Vector3

    constructor(id: number) {
        this.id = id
        this.colorId = randomColor()
        this.cellLocation = new THREE.Vector3(0, 0, 0)
    }

    createTransformComponents(grid: OplaGrid, scaleMultiplier: number, positionOffset: THREE.Vector3) {
        const loc = this.cellLocation
        const cellSize = grid.getCellDimensions(loc)

        // calc cell position per axis
        // position depends on all previos cells
        // also shift half of size to make it top left aligned
        const axisOffset = new THREE.Vector3(
            sum(grid.axisX.slice(0, loc.x)) + cellSize.x / 2,
            sum(grid.axisY.slice(0, loc.y)) + cellSize.y / 2,
            sum(grid.axisZ.slice(0, loc.z)) + cellSize.z / 2,
        )

        const position = new THREE.Vector3()
        position.add(axisOffset)
        position.multiplyScalar(scaleMultiplier)
        position.add(positionOffset)

        const scale = cellSize
            .clone()
            .multiplyScalar(scaleMultiplier)

        return [position, scale]
    }

    createMatrix(grid: OplaGrid, scaleMultiplier: number, positionOffset: THREE.Vector3) {
        const [position, scale] = this.createTransformComponents(grid, scaleMultiplier, positionOffset)

        const rotation = new THREE.Euler()
        const quaternion = new THREE.Quaternion()
        quaternion.setFromEuler(rotation)

        const matrix = new THREE.Matrix4()
        matrix.compose(position, quaternion, scale)
        return matrix
    }
}

export class OplaSystem {
    public grid: OplaGrid
    public blocks: OplaBlock[]
}

function createOplaModel(block: OplaBlock, grid: OplaGrid, offset: THREE.Vector3) {
    const s = 100
    const location = block.cellLocation
    const cellSize = grid.getCellDimensions(location)

    // calc cell position per axis
    // position depends on all previos cells
    // also shift half of size to make it top left aligned
    let axisOffset = new THREE.Vector3(
        sum(grid.axisX.slice(0, location.x)) + cellSize.x / 2,
        sum(grid.axisY.slice(0, location.y)) + cellSize.y / 2,
        sum(grid.axisZ.slice(0, location.z)) + cellSize.z / 2,
    )

    let position = new THREE.Vector3()
    position.add(axisOffset)
    position.multiplyScalar(s)
    position.add(offset)

    let scale = cellSize
        .clone()
        .multiplyScalar(s)

    let geometry = new THREE.BoxBufferGeometry()

    let rotation = new THREE.Euler()
    let quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(rotation)
    let matrix = new THREE.Matrix4()
    matrix.compose(position, quaternion, scale);

    geometry.applyMatrix4(matrix);

    // lines model
    //
    // let geometryBox = box(scale.x, scale.y, scale.z)
    // const dashScale = 0.1
    // let lineMaterial = new THREE.LineDashedMaterial({ color: 0x666666, dashSize: 3 * dashScale, gapSize: 1 * dashScale })
    // let geometryBox = box(1, 1, 1)
    // let lineSegments = new THREE.LineSegments(geometryBox, lineMaterial)
    // lineSegments.applyMatrix4(matrix)
    // lineSegments.computeLineDistances()

    // positionOffset.x += axisX - 1
    // positionOffset.y += axisY - 1
    // positionOffset.z += axisZ - 1

    const material = materialLib.get(block.blockType)

    return new THREE.Mesh(geometry, material)
}

export function createBoxes(opla: OplaSystem) {
    let matrix = new THREE.Matrix4()
    let quaternion = new THREE.Quaternion()

    const offset = new THREE.Vector3(-500, 0, -500)
    const s = 100

    const { grid, blocks } = opla

    return blocks.map(item => {
        const { cellLocation: location } = item
        const cellSize = grid.getCellDimensions(item.cellLocation)

        // calc cell position per axis
        // position depends on all previos cells
        // also shift half of size to make it top left aligned
        let axisOffset = new THREE.Vector3()
        axisOffset.x = sum(grid.axisX.slice(0, location.x)) + cellSize.x / 2
        axisOffset.y = sum(grid.axisY.slice(0, location.y)) + cellSize.y / 2
        axisOffset.z = sum(grid.axisZ.slice(0, location.z)) + cellSize.z / 2

        let position = new THREE.Vector3()
        position.add(axisOffset)
        position.multiplyScalar(s)
        position.add(offset)

        let rotation = new THREE.Euler()
        let scale = cellSize
            .clone()
            .multiplyScalar(s)

        let geometry = new THREE.BoxBufferGeometry()

        quaternion.setFromEuler(rotation);
        matrix.compose(position, quaternion, scale);

        geometry.applyMatrix4(matrix);

        // let geometryBox = box(scale.x, scale.y, scale.z)
        const dashScale = 0.1
        let lineMaterial = new THREE.LineDashedMaterial({ color: 0x666666, dashSize: 3 * dashScale, gapSize: 1 * dashScale })
        // let geometryBox = box(1, 1, 1)
        // let lineSegments = new THREE.LineSegments(geometryBox, lineMaterial)
        // lineSegments.applyMatrix4(matrix)
        // lineSegments.computeLineDistances()

        // positionOffset.x += axisX - 1
        // positionOffset.y += axisY - 1
        // positionOffset.z += axisZ - 1

        let material = materialLib.get(item.blockType)

        return {
            id: item.id,
            material,
            geometry,
            position,
            rotation,
            scale,
            // g: lineSegments,
        }
    })
}

function sum(items: number[], start = 0): number {
    return items.reduce((a, b) => a + b, start)
}

export function createOplaSystem() {
    const id = new IdGenerator(0)

    const sizeX = 3
    const sizeY = 5
    const sizeZ = 8
    const blocks = createGrid3(sizeX, sizeY, sizeZ, (x, y, z, i) => {
        if (z % 2 == 1) {
            return null
        }
        // if ((y + x) % 2 == 0) {
        //     return null
        // }
        // const yp = (y / 10) * 0.5
        // const yp = 0.5
        const type = Math.random() < 0.1 ? 'closed' : 'open'

        const block = new OplaBlock(id.create())
        block.blockType = type
        block.cellLocation.set(x, y, z)

        return block
    })
    const grid = new OplaGrid()
    grid.axisX = createGrid3(sizeX, 1, 1, x => 1)
    grid.axisY = createGrid3(sizeY, 1, 1, (x, y, z, i) => 1 + x * i * 0.1)
    grid.axisZ = createGrid3(sizeZ, 1, 1, x => x % 2 ? 1 : 2)

    const system = new OplaSystem()
    system.grid = grid
    system.blocks = blocks

    return system
}

type GridFactoryFunction3<T> = (x: number, y: number, z: number, i: number) => T | null
function createGrid3<T>(x: number, y: number, z: number, factory: GridFactoryFunction3<T>): T[] {
    const result: T[] = []

    let count = 0
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            for (let k = 0; k < z; k++) {
                const item = factory(i, j, k, count)
                if (item) {
                    result.push(item)
                }
                count++
            }
        }
    }
    return result
}
