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
import state from "@/stores/user"
import api from "@/api"
import { ClientResponseError } from "pocketbase"

type Inputs = {
    email: string
    password: string
    passwordConfirmation: string
}

export const SignupModal = () => {
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setError,
    } = useForm<Inputs>()

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        try {
            await api.newUser(data.email, data.password, data.passwordConfirmation)
            await api.login(data.email, data.password)
            onClose()
        } catch (error) {
            const e = error as ClientResponseError
            const response = e.data
            console.log(e.message, e.data, Object.keys(e))
            if (response.data.email) {
                setError("email", { type: "custom", message: response.data.email?.message })
            }
            if (response.data.password) {
                setError("password", { type: "custom", message: response.data.password?.message })
            }
            if (response.data.passwordConfirmation) {
                setError("passwordConfirmation", { type: "custom", message: response.data.Confirmation?.message })
            }
        }
    }

    return (
        <>
            <Button disableRipple onPress={onOpen} variant="flat" size="sm" color="primary">Sign Up</Button>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="auto"
                //placement="top-center"
                backdrop="blur"
            >
                <ModalContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">Sign Up</ModalHeader>
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
                            <Input
                                {...register("passwordConfirmation", {
                                    required: "Password confirmation is required",
                                    validate: (val: string) => {
                                        if (watch("password") != val) {
                                            return "Your passwords do no match"
                                        }
                                    },
                                })}
                                endContent={(
                                    <Lock size={15} />
                                )}
                                label="Confirm Password"
                                labelPlacement="outside"
                                placeholder="Confirm your password"
                                type="password"
                                variant="flat"
                                isInvalid={!!errors.passwordConfirmation}
                                errorMessage={errors.passwordConfirmation?.message}
                            />
                            {/* <div className="flex py-2 px-1 justify-between">
                                <Checkbox
                                    classNames={{
                                        label: "text-small",
                                    }}
                                >
                                    Remember me
                                </Checkbox>
                                <Link color="primary" href="#" size="sm">
                                    Forgot password?
                                </Link>
                            </div> */}
                        </ModalBody>
                        <ModalFooter>
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
