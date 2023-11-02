import user from "@/stores/user"
import { LoginModal } from "./login-modal"
import { SignupModal } from "./signup-modal"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { subscribe } from "valtio"

const PageJoin: React.FC = () => {
    const navigate = useNavigate()

    useEffect(() => {
        return subscribe(user, () => {
            if (user.auth) {
                navigate("/", { replace: true })
            }
        })
    }, [])

    return (
        <div className="w-full h-full flex flex-col justify-center items-center gap-4">
            <p className="font-bold text-xl">OPLA</p>
            <LoginModal />
            <SignupModal />
        </div>
    )
}

export default PageJoin
