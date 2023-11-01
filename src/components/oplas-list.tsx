import { Card, Image, CardFooter, Button } from "@nextui-org/react"
import { Trash } from "react-feather"
import { Link } from "react-router-dom"

type PressEvent = any // TODO this is not good

type ListItemOnPress = (id: string) => void

type ListItemProps = {
    label?: string
    src: string
    href: string
    onDelete?: (e: PressEvent) => void,
}

const ListItem: React.FC<ListItemProps> = ({ label, src, href, onDelete }) => (
    <Card isFooterBlurred radius="lg" className="border-none">
        <Link to={href}>
            <Image
                alt={label}
                className="object-cover"
                src={src}
            />
        </Link>
        <CardFooter className="justify-between border-white/20 border-1 overflow-hidden p-1 absolute rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <Button onPress={onDelete} isIconOnly size={"sm"} color="danger" variant="flat" aria-label="Delete">
                <Trash size={15} />
            </Button>

            {!label ? null : (
                <p className="text-tiny text-white/80 px-3">{label}</p>
            )}
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
