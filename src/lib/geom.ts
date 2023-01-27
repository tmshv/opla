import { Vector3 } from "three"

// TODO: reduce complexity
export function uniqueVectors(vs: Vector3[]): Vector3[] {
    if (vs.length === 0) {
        return vs
    }

    return vs.reduce<Vector3[]>((acc, item) => {
        const i = acc.findIndex(n => n.equals(item))
        if (i === -1) {
            acc.push(item)
        }
        return acc
    }, [])
}

