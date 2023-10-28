import { proxy } from "valtio"

export type UserState = {
    auth: boolean
    role: string
    email: string
    avatar: string
}

const state = proxy<UserState>({
    auth: false,
    role: "",
    email: "",
    avatar: "",
    // inc: () => {
    //     ++state.count
    // },
})

export default state
