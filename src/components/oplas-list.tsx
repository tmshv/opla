import { Suspense, useEffect, useState } from "react"
import { Card, Image, CardFooter, Button } from "@nextui-org/react"
import { Trash } from "react-feather"
import api from "@/api"

type PressEvent = any // TODO this is not good

type ListItemOnPress = (id: string) => void

type ListItemProps = {
    label: string
    src: string
    onPress?: (e: PressEvent) => void,
    onDelete?: (e: PressEvent) => void,
}

const ListItem: React.FC<ListItemProps> = ({ label, src, onPress, onDelete }) => (
    <Card disableRipple isFooterBlurred isPressable radius="lg" className="border-none" onPress={onPress}>
        <Image
            alt={label}
            className="object-cover"
            src={src}
        />
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
    name: string
    cover: string
}

export type OplasListProps = {
    onPress: ListItemOnPress
    onDelete: ListItemOnPress
}

export const OplasList: React.FC<OplasListProps> = ({ onPress, onDelete }) => {
    const [items, setItems] = useState<Item[]>([])

    useEffect(() => {
        api.getOplas().then(res => {
            setItems(res.items)
        })
    }, [])

    return (
        <Suspense fallback={null}>
            <div className="gap-4 grid grid-cols-4 grid-rows-2 px-8">
                {items.map(item => (
                    <ListItem
                        key={item.id}
                        label={item.name}
                        src={item.cover}
                        onPress={() => {
                            onPress(item.id)
                        }}
                        onDelete={() => {
                            onDelete(item.id)
                        }}
                    />
                ))}
            </div>
        </Suspense>
    )
}
