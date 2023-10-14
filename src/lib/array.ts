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
        for (let j = i + 1; j < len; j++) {
            pairs.push([items[i], items[j]])
        }
    }
    return pairs
}

/*
* Group list of items to hashmap of lists by key
*/
export function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
    const groups = new Map()
    for (const item of items) {
        const k = key(item)
        const group = groups.get(k) ?? []
        group.push(item)
        groups.set(k, group)
    }
    return groups
}
