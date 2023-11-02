import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
} from "@nextui-org/react"
import { SubmitHandler, useForm } from "react-hook-form"
import { Mail, Lock } from "react-feather"
import { emailPattern } from "@/lib/email"
import api from "@/api"
import { ClientResponseError } from "pocketbase"
import { redirect } from "react-router-dom"

type Inputs = {
    email: string
    password: string
}

export type LoginModalProps = {
}

export const LoginModal: React.FC<LoginModalProps> = () => {
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<Inputs>()

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        try {
            await api.login(data.email, data.password)
            onClose()
        } catch (error) {
            const e = error as ClientResponseError
            const response = e.data
            if (response.data.email) {
                setError("email", { type: "custom", message: response.data.email?.message })
            }
            if (response.data.password) {
                setError("password", { type: "custom", message: response.data.password?.message })
            }
            if (response.message) {
                setError("root", { type: "custom", message: response.message })
            }
        }
    }

    return (
        <>
            <Button disableRipple onPress={onOpen} variant="flat" size="sm" color="primary">Login</Button>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="auto"
                //placement="top-center"
                backdrop="blur"
            >
                <ModalContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">Login</ModalHeader>
                        <ModalBody>
                            <Input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: emailPattern,
                                        message: "Please enter a valid email",
                                    },
                                })}
                                endContent={(
                                    <Mail size={15} />
                                )}
                                autoFocus
                                radius="sm"
                                label="Email"
                                labelPlacement="outside"
                                placeholder="Enter your email"
                                variant="flat"
                                isInvalid={!!errors.email}
                                errorMessage={errors.email?.message}
                            />
                            <Input
                                {...register("password", { required: "Password is required" })}
                                endContent={(
                                    <Lock size={15} />
                                )}
                                label="Password"
                                labelPlacement="outside"
                                placeholder="Enter your password"
                                type="password"
                                variant="flat"
                                isInvalid={!!errors.password}
                                errorMessage={errors.password?.message}
                            />
                        </ModalBody>
                        <ModalFooter className="items-center">
                            {errors.root && <p className="text-danger text-xs px-4">{errors.root.message}</p>}
                            <Button type="submit" color="primary" onPress={() => { }}>
                                Submit
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    )
}
