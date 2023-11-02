import { useOpla } from "@/hooks/use-opla"
import { groupBy } from "@/lib/array"
import type { OplaModelData } from "@/stores/opla"
import state from "@/stores/opla"
import { useSnapshot } from "valtio"

export const OplaStat = () => {
    const { value: { model } } = useSnapshot(state)
    const [nodes, edges] = useOpla(model as OplaModelData)

    const e = groupBy(edges, edge => edge.distance())
    const mult = 150

    return (
        <div className="pointer-events-none select-none">
            {nodes.length === 0 ? null : (
                <pre>node = {nodes.length}</pre>
            )}
            {[...e.entries()]
                .filter(([length, _]) => length > 1) // to skip 150mm small edges
                .map(([length, items]) => (
                    <pre key={length}>edge_{length * mult} = {items.length}</pre>
                ))}
        </div>
    )
}
