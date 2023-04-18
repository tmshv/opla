import { Graph } from "./graph"

describe("Graph", () => {
    describe("findConnectedNodes", () => {
        test("should return correct nodes", () => {
            const graph = (new Graph<string, null>())
                .addNode("1", null)
                .addNode("2", null)
                .addNode("3", null)
                .addNode("4", null)
                .addNode("5", null)
                .addEdge("1", "2")
                .addEdge("2", "3")
                .addEdge("1", "4")
            expect(graph.findConnectedNodes("1")).toEqual(new Set(["2", "3", "4"]))
        })
    })

    describe("findIslands", () => {
        test("should return correct result", () => {
            const graph = (new Graph<string, null>())
                .addNode("1", null)
                .addNode("2", null)
                .addNode("3", null)
                .addNode("4", null)
                .addNode("5", null)
                .addNode("6", null)
                .addEdge("1", "2")
                .addEdge("2", "3")
                .addEdge("1", "4")
                .addEdge("5", "6")
            expect(graph.findAllIslands()).toEqual([
                new Set(["1", "2", "3", "4"]),
                new Set(["5", "6"]),
            ])
        })
    })
})
