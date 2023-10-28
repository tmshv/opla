import state from "@/stores/user"
import { useSnapshot } from "valtio"

import {
    Button,
    // NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    DropdownItem,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    Avatar,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@nextui-org/react"
import { SignupModal } from "./signup-modal"
import api from "@/api"
import { LoginModal } from "./login-modal"
import { OplasList } from "./oplas-list"
import { useNavigate } from "react-router-dom"

const menuItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
]

export const Navigation: React.FC = () => {
    const navigate = useNavigate()
    const user = useSnapshot(state)
    const hideMenu = true
    const isMenuOpen = false
    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

    return (
        <>
            <Navbar position="static" className="bg-transparent justify-between" maxWidth="full" isBlurred={false}>
                <NavbarContent>
                    {/* <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                /> */}
                    <NavbarBrand>
                        <p className="font-bold text-inherit">OPLA</p>
                    </NavbarBrand>
                </NavbarContent>

                {hideMenu ? null : (
                    <NavbarContent className="hidden sm:flex gap-4" justify="center">
                        <NavbarItem>
                            <Link color="foreground" href="#">
                                Features
                            </Link>
                        </NavbarItem>
                        <NavbarItem isActive>
                            <Link href="#" aria-current="page" color="secondary">
                                Customers
                            </Link>
                        </NavbarItem>
                        <NavbarItem>
                            <Link color="foreground" href="#">
                                Integrations
                            </Link>
                        </NavbarItem>
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Avatar
                                    isBordered
                                    showFallback={false}
                                    as="button"
                                    className="transition-transform"
                                    color="default"
                                    radius="sm"
                                    size="sm"
                                />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Profile Actions" variant="flat">
                                <DropdownItem key="profile" className="h-14 gap-2">
                                    <p className="font-semibold">Signed in as</p>
                                    <p className="font-semibold">zoey@example.com</p>
                                </DropdownItem>
                                <DropdownItem key="settings">My Settings</DropdownItem>
                                <DropdownItem key="logout" color="danger">
                                    Sign Up
                                </DropdownItem>
                                <DropdownItem key="logout" color="danger">
                                    Log Out
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarContent>
                )}

                <NavbarContent as="div" justify="end">
                    {!user.auth ? (
                        <>
                            <NavbarItem>
                                <LoginModal />
                            </NavbarItem>
                            <NavbarItem>
                                <SignupModal />
                            </NavbarItem>
                        </>
                    ) : (
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Avatar
                                    isBordered
                                    as="button"
                                    className="transition-transform"
                                    color="secondary"
                                    name={user.email}
                                    size="sm"
                                    src={user.avatar}
                                />
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Profile Actions"
                                variant="flat"
                                onAction={key => {
                                    switch (key) {
                                        case "oplas": {
                                            onOpen()
                                            break
                                        }
                                        case "logout": {
                                            api.logout()
                                            break
                                        }
                                        default: {
                                            break
                                        }
                                    }
                                }}
                                disabledKeys={["settings"]}
                            >
                                <DropdownItem isReadOnly key="profile" className="h-12 gap-2">
                                    <p className="font-semibold">{user.email}</p>
                                </DropdownItem>
                                <DropdownItem key="oplas">Models</DropdownItem>
                                <DropdownItem key="settings">Settings</DropdownItem>
                                <DropdownItem key="logout" color="danger">
                                    Log Out
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    )}
                </NavbarContent>

                <NavbarMenu>
                    {menuItems.map((item, index) => (
                        <NavbarMenuItem key={`${item}-${index}`}>
                            <Link
                                color={
                                    index === 2 ? "primary" : index === menuItems.length - 1 ? "danger" : "foreground"
                                }
                                className="w-full"
                                href="#"
                                size="lg"
                            >
                                {item}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                </NavbarMenu>
            </Navbar>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="auto"
                //placement="top-center"
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Models</ModalHeader>
                    <ModalBody>
                        <OplasList />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={async () => {
                            const item = await api.createNewOpla()
                            navigate(`/${item.id}`)
                            onClose()
                        }}>
                            New
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
