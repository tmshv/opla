import { LoginModal } from "./login-modal"
import { SignupModal } from "./signup-modal"

const PageJoin: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center gap-4">
            <p className="font-bold text-xl">OPLA</p>
            <LoginModal />
            <SignupModal />
        </div>
    )
}

export default PageJoin
