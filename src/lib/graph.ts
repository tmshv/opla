export class Graph<Id, P> {
    private nodes: Map<Id, P>
    private edges: Map<Id, Id[]>

    constructor() {
        this.nodes = new Map()
        this.edges = new Map()
    }

    addNode(id: Id, payload: P): this {
        this.nodes.set(id, payload)
        return this
    }

    addEdge(sourceId: Id, targetId: Id): this {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            throw new Error("sourceId or targetId not found")
        }
        if (!this.edges.has(sourceId)) {
            this.edges.set(sourceId, [])
        }
        if (!this.edges.has(targetId)) {
            this.edges.set(targetId, [])
        }
        this.edges.get(sourceId)!.push(targetId)
        this.edges.get(targetId)!.push(sourceId)
        return this
    }

    findConnectedNodes(id: Id): Set<Id> {
        const visited = new Set<Id>()
        const connected = new Set<Id>()
        const queue = [id]
        visited.add(id)
        while (queue.length) {
            const currentId = queue.shift()!
            const edge = this.edges.get(currentId) ?? []
            for (const connectedId of edge) {
                if (visited.has(connectedId)) {
                    continue
                }
                visited.add(connectedId)
                queue.push(connectedId)
                connected.add(connectedId)
            }
        }
        return connected
    }

    findAllIslands(): Set<Id>[] {
        const visited = new Set<Id>()
        const islands: Set<Id>[] = []
        // iterate over all nodes
        for (const id of this.nodes.keys()) {
            if (visited.has(id)) {
                continue
            }
            // perform DFS traversal on unvisited node
            const island = new Set<Id>()
            const stack = [id]
            while (stack.length) {
                const currentId = stack.pop()!
                if (visited.has(currentId)) {
                    continue
                }
                visited.add(currentId)
                island.add(currentId)
                for (const connectedId of this.findConnectedNodes(currentId)) {
                    if (!visited.has(connectedId)) {
                        stack.push(connectedId)
                    }
                }
            }
            islands.push(island)
        }
        return islands
    }
}
