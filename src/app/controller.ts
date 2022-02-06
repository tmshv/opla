import * as THREE from 'three'
import { Subject } from 'rxjs'
import { OplaSystem } from "@/opla"
import { IAssetLibrary } from './types'

type AssetsLib = Map<string, THREE.Object3D>

export class AppController implements IAssetLibrary {
    private ready: boolean
    private tool: string
    private lib: AssetsLib

    private cellDimension: THREE.Vector3

    public subjects: {
        tool: Subject<string>
        cellDimension: Subject<THREE.Vector3>
    }

    public get currentTool() {
        return this.tool
    }

    public get opla() {
        return this.model
    }

    constructor(
        private model: OplaSystem
    ) {
        this.ready = false
        this.lib = new Map()
        this.cellDimension = new THREE.Vector3()
        this.subjects = {
            tool: new Subject(),
            cellDimension: new Subject(),
        }
    }

    public isReady() {
        return this.ready
    }

    public setReady() {
        this.ready = true
    }

    public setAssets(lib: AssetsLib) {
        this.lib = lib

        return this
    }

    public createAsset(name: string) {
        const asset = this.lib.get(name)
        if (!asset) {
            return null
        }

        return asset.clone()
    }

    public getAssetNameBySize(name: string, value: number) {
        return `${name}_${value}mm`
    }

    public setCellDimensionX(value: number) {
        this.cellDimension.x = value

        return this.subjects.cellDimension.next(this.cellDimension)
    }

    public setCellDimensionY(value: number) {
        this.cellDimension.y = value

        return this.subjects.cellDimension.next(this.cellDimension)
    }

    public setCellDimensionZ(value: number) {
        this.cellDimension.z = value

        return this.subjects.cellDimension.next(this.cellDimension)
    }

    public setCellDimension(x: number, y: number, z: number) {
        this.cellDimension.set(x, y, z)

        return this.subjects.cellDimension.next(this.cellDimension)
    }

    public getCellDimensionArray() {
        return this.cellDimension.toArray()
    }

    public setTool(tool: string, options: object) {
        this.tool = tool

        return this.subjects.tool.next(tool)
        // console.log('choise', tool);
        // this.observable.subscribe(x => {

        // })

        // return this
    }
}
