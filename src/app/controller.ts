import * as THREE from 'three'
import { Subject } from 'rxjs'
import { OplaSystem } from "@/opla"

export class AppController {
    private tool: string

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
        this.cellDimension = new THREE.Vector3()
        this.subjects = {
            tool: new Subject(),
            cellDimension: new Subject(),
        }
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

    public setTool(tool: string, options: object) {
        this.tool = tool

        return this.subjects.tool.next(tool)
        // console.log('choise', tool);
        // this.observable.subscribe(x => {

        // })

        // return this
    }
}
