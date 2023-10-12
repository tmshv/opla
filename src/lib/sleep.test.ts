import { sleep } from "./sleep"

describe("sleep", () => {
    test("should stop for ms time", async () => {
        const startTime = Date.now()
        await sleep(1000)
        const endTime = Date.now()
        expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })
})
