export function choise<T>(values: T[], random?: () => number): T {
    const r = random ?? Math.random
    const i = Math.floor(r() * values.length)
    return values[i]
}

/*
* create unique list of all possible pairs
*/
export function pairs<T>(items: readonly T[]): [T, T][] {
    const pairs: [T, T][] = []
    const len = items.length
    for (let i = 0; i < len; i++) {
        for (let j = i+1; j < len; j++) {
            pairs.push([items[i], items[j]])
        }
    }
    return pairs
}

