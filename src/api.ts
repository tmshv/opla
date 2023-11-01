import PocketBase from "pocketbase"
import state from "@/stores/user"
import type { OplaModelData } from "./stores/opla"

function createApi() {
    const pb = new PocketBase("http://127.0.0.1:8090")
    const ava = (modelId: string, filename: string) => `${pb.baseUrl}/api/files/users/${modelId}/${filename}`

    // Set user stage if it already logged in
    if (pb.authStore.isValid) {
        state.auth = true
        state.email = pb.authStore.model!.email
        state.avatar = ava(pb.authStore.model!.id, pb.authStore.model!.avatar)
    }

    // Update user stage on login/logout
    pb.authStore.onChange((_, model) => {
        if (!model) {
            state.auth = false
            state.email = ""
            state.avatar = ""
        } else {
            state.auth = true
            state.email = model.email
            state.avatar = ava(model.id, model.avatar)
        }
    })

    return {
        createUser: async (email: string, password: string, passwordConfirm: string) => {
            const userData = await pb.collection("users").create({
                email,
                // username: "username", // maybe omit this
                // name: "Aalto",
                password,
                passwordConfirm,
            })
            return userData
        },
        login: async (email: string, password: string) => {
            const userData = await pb.collection("users").authWithPassword(email, password)
            return userData
        },
        logout: async () => {
            pb.authStore.clear()
        },
        getOplaName: async (oplaId: string) => {
            // TODO check 404
            const res = await pb.collection("oplas").getOne(oplaId, {
                fields: "id,name",
            })
            return res.name
        },
        getModelDefinition: async (oplaId: string) => {
            // TODO check 404
            const myOpla = await pb.collection("oplas").getOne(oplaId)
            return myOpla.definition
        },
        updateModelDefinition: async (oplaId: string, definition: OplaModelData) => {
            // TODO check 404
            const myOpla = await pb.collection("oplas").update(oplaId, {
                definition,
            })
            return myOpla.definition
        },
        deleteOpla: async (oplaId: string) => {
            const upd = await pb.collection("oplas").delete(oplaId)
            console.log("del", upd)
        },
        updateCover: async (oplaId: string, image: Blob) => {
            const formData = new FormData()
            formData.append("cover", image)
            await pb.collection("oplas").update(oplaId, formData)
            return true
        },
        createNewOpla: async () => {
            const userId = pb.authStore.model!.id
            const myOpla = await pb.collection("oplas").create({
                name: `OPLA-${Date.now()}`,
                definition: {
                    version: "1",
                    items: {},
                    scene: [],
                },
                owner: userId,
            })
            return myOpla
        },
        getOplas: async () => {
            const cov = (modelId: string, filename: string) => `${pb.baseUrl}/api/files/oplas/${modelId}/${filename}`

            // TODO check 404
            const oplas = await pb.collection("oplas").getList(1, 10, {
                fields: "id,name,cover",
            })

            return {
                ...oplas,
                items: oplas.items.map(({ id, name, cover }) => ({
                    id,
                    name,
                    cover: cov(id, cover),
                }))
            }
        },
    }
}

export default createApi()
