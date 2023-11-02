import { Card, CardFooter, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react"
import { MoreVertical } from "react-feather"
import { Link } from "react-router-dom"

type ListItemOnPress = (id: string) => void

type ListItemProps = {
    label?: string
    src: string
    href: string
    onDelete: () => void
}

const ListItem: React.FC<ListItemProps> = ({ label, src, href, onDelete }) => (
    <Card isFooterBlurred radius="lg" className="border-none">
        <Link to={href} className="relative w-full h-full">
            <img
                alt={label}
                className="object-cover h-full"
                src={src}
            />
        </Link>
        <CardFooter className="justify-between border-white/20 border-1 overflow-hidden p-1 absolute rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            {/* <Button onPress={onDelete} isIconOnly size={"sm"} color="danger" variant="flat" aria-label="Delete">
                <Trash size={15} />
            </Button> */}

            {!label ? null : (
                <p className="text-tiny text-black/70 px-3">{label}</p>
            )}

            <Dropdown>
                <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={15} />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions"
                    disabledKeys={["copy", "share", "rename"]}
                    onAction={key => {
                        switch (key) {
                            case "delete": {
                                onDelete()
                                break
                            }
                            default: {
                                break
                            }
                        }
                    }}
                >
                    <DropdownItem key="share">Share</DropdownItem>
                    <DropdownItem key="rename">Rename file</DropdownItem>
                    <DropdownItem key="copy">Duplicate file</DropdownItem>
                    {/* <DropdownItem key="edit">Edit file</DropdownItem> */}
                    <DropdownItem key="delete" className="text-danger" color="danger">
                        Delete file
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </CardFooter>
    </Card>
)

type Item = {
    id: string
    href: string
    name: string
    cover: string
}

export type OplasListProps = {
    items: Item[]
    onDelete: ListItemOnPress
}

export const OplasList: React.FC<OplasListProps> = ({ items, onDelete }) => (
    <div className="gap-4 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
        {items.map(item => (
            <ListItem
                key={item.id}
                href={item.href}
                label={item.name}
                src={item.cover}
                onDelete={() => {
                    onDelete(item.id)
                }}
            />
        ))}
    </div >
)
