import PocketBase from "pocketbase"
import user from "@/stores/user"
import type { OplaModelData } from "./stores/opla"

export type OplaItem = {
    id: string
    name: string
    cover: string
    href: string
}

export function createApi(pb: PocketBase) {
    const ava = (modelId: string, filename: string) => `${pb.baseUrl}/api/files/users/${modelId}/${filename}`

    // Set user stage if it already logged in
    if (pb.authStore.isValid) {
        user.auth = true
        user.email = pb.authStore.model!.email
        user.avatar = ava(pb.authStore.model!.id, pb.authStore.model!.avatar)
    }

    // Update user stage on login/logout
    pb.authStore.onChange((_, model) => {
        if (!model) {
            user.auth = false
            user.email = ""
            user.avatar = ""
        } else {
            user.auth = true
            user.email = model.email
            user.avatar = ava(model.id, model.avatar)
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
        getOpla: async (oplaId: string) => {
            // TODO check 404
            const res = await pb.collection("oplas").getOne(oplaId, {
                fields: "id,name,definition",
            })
            return res
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
        newOpla: async (name: string) => {
            const userId = pb.authStore.model!.id
            const res = await pb.collection("oplas").create({
                name,
                definition: {
                    version: "1",
                    items: {},
                    scene: [],
                },
                owner: userId,
            })
            return `/${res.id}`
        },
        getOplas: async () => {
            const cov = (modelId: string, filename: string) => `${pb.baseUrl}/api/files/oplas/${modelId}/${filename}`

            // TODO check 404
            const oplas = await pb.collection("oplas").getList(1, 100, {
                fields: "id,name,cover",
                sort: "-updated",
            })

            return oplas.items.map(({ id, name, cover }) => ({
                id,
                name,
                cover: cov(id, cover),
                href: `/${id}`,
            })) as OplaItem[]
        },
        countOplas: async () => {
            // TODO check 404
            const res = await pb.collection("oplas").getList(1, 1000, {
                fields: "id",
            })
            return res.totalItems
        },
    }
}

export default createApi(new PocketBase(import.meta.env.VITE_OPLA_API_BASE_URL))
