// fix this error
// 'index.test.ts' cannot be compiled under '--isolatedModules' because it is considered a global script file. Add an import, export, or an empty 'export {}' statement to make it a module.
export {}

// to be sure jest works as expected
describe("jest", () => {
    test("adds 1 + 2 to equal 3", () => {
        expect(1 + 2).toBe(3)
    })
})

