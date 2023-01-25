export function choise<T>(values: T[], random?: () => number): T {
    const r = random ?? Math.random
    const i = Math.floor(r() * values.length)
    return values[i]
}

/*
* create unique list of all possible pairs
* TODO: rewrite without set
*/
export function pairs<T>(items: readonly T[]): [T, T][] {
    const pairs = []
    const visit = new Set<string>()
    const len = items.length
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len; j++) {
            if (i === j) {
                continue
            }
            // AB is the same as BA
            if (visit.has(`${i}-${j}`) || visit.has(`${j}-${i}`)) {
                continue
            }
            pairs.push([items[i], items[j]])
            visit.add(`${i}-${j}`)
            visit.add(`${j}-${i}`)
        }
    }
    return pairs
}

