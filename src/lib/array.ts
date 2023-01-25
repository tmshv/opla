export function choise<T>(values: T[], random?: () => number): T {
    const r = random ?? Math.random
    const i = Math.floor(r() * values.length)
    return values[i]
}

