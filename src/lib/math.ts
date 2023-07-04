export function isInt(value: number): boolean {
    const n = Math.floor(value)
    return n === value
}

// TODO rm this not in use anymore
/*
* Almost the same as Math.floor but with difference for negative numbers
* works this way: -1.53 -> 1 (not 2)
*/
export function floor(value: number): number {
    if (value < 0) {
        return Math.floor(value) + 1
    } else {
        return Math.floor(value)
    }
}

