import { useOpla } from "@/hooks/use-opla"
import { groupBy } from "@/lib/array"

export const OplaStat = () => {
    const [nodes, edges] = useOpla()

    const e = groupBy(edges, edge => edge.distance())
    const mult = 150

    return (
        <div>
            <pre>nodes = {nodes.length}</pre>
            {[...e.entries()]
                .filter(([length, _]) => length > 1) // to skip 150mm small edges
                .map(([length, items]) => (
                    <pre key={length}>edge_{length * mult} = {items.length}</pre>
                ))}
        </div>
    )
}
