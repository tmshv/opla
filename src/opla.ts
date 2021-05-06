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

const idGenerator = new IdGenerator(0)

export class OplaGrid {
    public axisX: number[]
    public axisY: number[]
    public axisZ: number[]

    public getCellDimensions(cell: THREE.Vector3, v = new THREE.Vector3()) {
        v.set(
            this.axisX[cell.x],
            this.axisY[cell.y],
            this.axisZ[cell.z],
        )

        return v
    }

    public setCellDimension(cell: THREE.Vector3, dim: THREE.Vector3) {
        this.axisX[cell.x] = dim.x
        this.axisY[cell.y] = dim.y
        this.axisZ[cell.z] = dim.z

        return this
    }

    public isCellDimensionEqual(cell: THREE.Vector3, dim: THREE.Vector3) {
        const x = this.axisX[cell.x]
        const y = this.axisY[cell.y]
        const z = this.axisZ[cell.z]

        return dim.x === x && dim.y === y && dim.z === z
    }

    public getCellTransform(cell: THREE.Vector3, mult: number, offset: THREE.Vector3) {
        const cellSize = this.getCellDimensions(cell)

        // calc cell position per axis
        // position depends on all previos cells
        // also shift half of size to make it top left aligned
        let axisOffset = new THREE.Vector3()
        axisOffset.x = sum(this.axisX.slice(0, cell.x)) + cellSize.x / 2
        axisOffset.y = sum(this.axisY.slice(0, cell.y)) + cellSize.y / 2
        axisOffset.z = sum(this.axisZ.slice(0, cell.z)) + cellSize.z / 2

        let position = new THREE.Vector3()
        position.add(axisOffset)
        position.multiplyScalar(mult)
        position.add(offset)

        let scale = cellSize
            .clone()
            .multiplyScalar(mult)

        return [position, scale]
    }
}

type BlockSize = [number, number, number]

export class OplaBlock {
    public id: number
    public colorId: number
    public blockType: string

    // Block location
    public location: THREE.Vector3

    // XYZ dimension module of the block
    public size: THREE.Vector3

    constructor(id: number, size: BlockSize) {
        this.id = id
        this.colorId = randomColor()
        this.location = new THREE.Vector3(0, 0, 0)
        this.size = new THREE.Vector3(...size)
        // this.size.fromArray(size)
    }

    getCellPosition(pos: THREE.Vector3, gridSize: number) {
        const sx = this.size.x
        const sy = this.size.y
        const sz = this.size.z

        let x = Math.round(pos.x / gridSize) * gridSize
        let y = Math.round(pos.y / gridSize) * gridSize
        let z = Math.round(pos.z / gridSize) * gridSize

        const H = gridSize / 2
        x += sx % 2 === 1 ? 0 : H
        y += sy % 2 === 1 ? 0 : H
        z += sz % 2 === 1 ? 0 : H

        return new THREE.Vector3(x, y, z)
    }

    // createTransformComponents(grid: OplaGrid, scaleMultiplier: number, positionOffset: THREE.Vector3) {
    //     const loc = this.cellLocation
    //     const cellSize = grid.getCellDimensions(loc)

    //     // calc cell position per axis
    //     // position depends on all previos cells
    //     // also shift half of size to make it top left aligned
    //     const axisOffset = new THREE.Vector3(
    //         sum(grid.axisX.slice(0, loc.x)) + cellSize.x / 2,
    //         sum(grid.axisY.slice(0, loc.y)) + cellSize.y / 2,
    //         sum(grid.axisZ.slice(0, loc.z)) + cellSize.z / 2,
    //     )

    //     const position = new THREE.Vector3()
    //     position.add(axisOffset)
    //     position.multiplyScalar(scaleMultiplier)
    //     position.add(positionOffset)

    //     const scale = cellSize
    //         .clone()
    //         .multiplyScalar(scaleMultiplier)

    //     return [position, scale]
    // }

    // createScaleMatrix(grid: OplaGrid, scaleMultiplier: number, positionOffset: THREE.Vector3) {
    //     const [position, scale] = grid.getCellTransform(this.cellLocation, scaleMultiplier, positionOffset)

    //     const rotation = new THREE.Euler()
    //     const quaternion = new THREE.Quaternion()
    //     quaternion.setFromEuler(rotation)

    //     const matrix = new THREE.Matrix4()
    //     matrix.compose(new THREE.Vector3(), quaternion, scale)
    //     return matrix
    // }

    createMatrix(grid: OplaGrid, scaleMultiplier: number, positionOffset: THREE.Vector3) {
        // const [position, scale] = this.createTransformComponents(grid, scaleMultiplier, positionOffset)
        // const [position, scale] = grid.getCellTransform(this.cellLocation, scaleMultiplier, positionOffset)
        const position = this.location
        const scale = this.size

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

    public removeBlock(id: number) {
        this.blocks = this.blocks.filter(block => block.id !== id)

        return this
    }

    public addBlock(block: OplaBlock) {
        this.blocks.push(block)

        return this
    }

    public createBlock(size: BlockSize) {
        return new OplaBlock(idGenerator.create(), size)
    }
}

function sum(items: number[], start = 0): number {
    return items.reduce((a, b) => a + b, start)
}

function choise<T>(values: T[]): T {
    const i = Math.floor(Math.random() * values.length)

    return values[i]
}

function randomSize(): BlockSize {
    const values = [200, 400]

    return [
        400,
        400,
        choise(values),
        // choise(values),
        // choise(values),
    ]
}

export function createOplaSystem() {
    const sizeX = 10
    const sizeY = 10
    const sizeZ = 10

    const GRID = 200

    const blocks = []
    for (let i = 0; i < 10; i++) {
        // let sizeX = 1 + i
        let sizeX = choise([1, 2, 3, 4])
        let sizeY = 1
        let sizeZ = 1

        const x = 0
        const y = 0
        const z = GRID * i
        const pos = new THREE.Vector3(x, y, z)

        const sizes = [sizeX, sizeY, sizeZ] as BlockSize
        const block = new OplaBlock(idGenerator.create(), sizes)
        block.blockType = 'closed'
        const cell = block.getCellPosition(pos, GRID)
        block.location.copy(cell)
        blocks.push(block)
    }
    // const block = new OplaBlock(idGenerator.create(), [400, 400, 400])
    // block.blockType = 'closed'
    // block.cellLocation.set(0, 0, 0)
    // block.location.set(0, 200, 0)
    // const blocks = [block]

    const grid = new OplaGrid()
    grid.axisX = createGrid3(sizeX, 1, 1, x => 1)
    grid.axisY = createGrid3(sizeY, 1, 1, (x, y, z, i) => 1)
    grid.axisZ = createGrid3(sizeZ, 1, 1, x => 1)

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
