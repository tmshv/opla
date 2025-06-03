import state from "@/stores/opla"
import userState from "@/stores/user"
import { useSnapshot } from "valtio"
import SyncSpinner from "./sync-spinner"
import {
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
} from "@nextui-org/react"
import api from "@/api"
import { useNavigate } from "react-router"
import NewModelButton from "./new-model-button"

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

export type NavigationProps = {
    blur?: boolean
    showNewModelButton?: boolean
}

export const Navigation: React.FC<NavigationProps> = ({ blur = false, showNewModelButton = false }) => {
    const navigate = useNavigate()
    const { name } = useSnapshot(state.value)
    const user = useSnapshot(userState)
    const hideMenu = true
    const isMenuOpen = false

    return (
        <>
            <Navbar position="sticky" className={`bg-transparent justify-between ${blur ? "backdrop-blur-md" : ""}`} maxWidth="full" isBlurred={false}>
                <NavbarContent>
                    {/* <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                /> */}
                    <NavbarBrand>
                        <Link href="/" color="foreground">
                            <p className="font-bold text-inherit">OPLA</p>
                        </Link>
                        <p className="text-inherit px-2">{name}</p>
                        <SyncSpinner />
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
                    {!showNewModelButton ? null : (
                        <NewModelButton />
                    )}

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
                            disabledKeys={["settings"]}
                            onAction={key => {
                                switch (key) {
                                    case "oplas": {
                                        {/* onOpen() */ }
                                        navigate("/")
                                        break
                                    }
                                    case "logout": {
                                        api.logout()
                                        navigate("/")
                                        break
                                    }
                                    default: {
                                        break
                                    }
                                }
                            }}
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
        </>
    )
}
