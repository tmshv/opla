import { OplaSystem } from "@/opla"

export class AppController {
    private tool: string

    public get currentTool() {
        return this.tool
    }

    public get opla() {
        return this.model
    }

    constructor(
        private model: OplaSystem
    ) { }

    public setTool(tool: string, options: object) {
        this.tool = tool

        console.log('choise', tool);

        return this
    }
}
