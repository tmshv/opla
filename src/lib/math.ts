export function lerp(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio
}
