import { Suspense, useEffect, useState } from "react"
import api from "@/api"
import { Button, Link } from "@nextui-org/react"

type Item = {
    id: string
    name: string
}

export type OplasListProps = {
}

export const OplasList: React.FC<OplasListProps> = () => {
    const [items, setItems] = useState<Item[]>([])

    useEffect(() => {
        api.getOplas().then(res => {
            setItems(res.items)
        })
    }, [])

    return (
        <Suspense fallback={null}>
            {items.map((item => (
                <Button as={Link} key={item.id} href={`/${item.id}`}>{item.name}</Button>
            )))}
        </Suspense>
    )
}
