import { subscribe } from "valtio"
import state from "@/stores/opla"
import app from "@/stores/app"
import api from "@/api"

export function sync() {
    return subscribe(state, async () => {
        if (!state.value.id) {
            return
        }
        const oplaId = state.value.id
        app.synced = false
        await api.updateModelDefinition(oplaId, state.value.model)
        app.synced = true
    })
}
