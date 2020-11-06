import { Subject } from 'rxjs'
import { OplaSystem } from "@/opla"

export class AppController {
    private tool: string

    public subjects: {
        tool: Subject<string>
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
        this.subjects = {
            tool: new Subject(),
        }
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
