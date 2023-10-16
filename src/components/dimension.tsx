import { V3 } from "@/stores/opla"
import { lerp } from "@/lib/math"
import { Text, Line } from "@react-three/drei"

function lerpV3(a: V3, b: V3, ratio: number): V3 {
    return [
        lerp(a[0], b[0], ratio),
        lerp(a[1], b[1], ratio),
        lerp(a[2], b[2], ratio),
    ]
}

function dist(a: V3, b: V3): number {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function len(a: V3): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
}

function norm(a: V3): V3 {
    const l = len(a)
    return [
        a[0] / l,
        a[1] / l,
        a[2] / l,
    ]
}

function sub(a: V3, b: V3): V3 {
    return [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
    ]
}

function add(a: V3, b: V3): V3 {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
    ]
}

function mul(a: V3, s: number): V3 {
    return [
        a[0] * s,
        a[1] * s,
        a[2] * s,
    ]
}

function rot(n: V3, v: V3): V3 {
    const pih = Math.PI / 2
    // return [0, 0, pih * 1] // rotation for ext[1, 0, 0] + line Z

    if (n[0] === 1) {
        return [0, -pih, 0]
    }

    if (n[1] === 1) {
        return [pih, 0, 0]
    }

    return [0, 0, 0]
}

export type DimensionProps = {
    start: V3
    end: V3
    ext: V3
    label: string
    visible?: boolean
}

export const Dimension: React.FC<DimensionProps> = ({ start, end, ext, label, visible = true }) => {
    const e = 0.3
    const center = lerpV3(start, end, 0.5)
    const tick = 0.1
    const textext = 0.05
    const lenHalf = dist(start, end) / 2
    const N = norm(sub(end, start))
    const n: V3 = [0, 0, 1]
    return (
        <group
            position={center}
            rotation={rot(N, ext)}
            visible={visible}
        >
            {/* ext */}
            <Line
                points={[[0, 0, 0], mul(ext, e + tick)]}
                color={0x000000}
                lineWidth={1}
                position={mul(n, -lenHalf)}
            />
            <Line
                points={[[0, 0, 0], mul(ext, e + tick)]}
                color={0x000000}
                lineWidth={1}
                position={mul(n, lenHalf)}
            />

            {/* tick */}
            <mesh
                position={add(mul(n, -lenHalf), mul(ext, e))}
                rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            >
                <planeGeometry args={[0.02, 0.2]} />
                <meshBasicMaterial color={0} />
            </mesh>
            <mesh
                position={add(mul(n, lenHalf), mul(ext, e))}
                rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            >
                <planeGeometry args={[0.02, 0.2]} />
                <meshBasicMaterial color={0} />
            </mesh>
            {/* <Line
                points={[[-tick, 0, 0], [tick, 0, 0]]}
                position={add(mul(n, -lenHalf), mul(ext, e))}
                color={0x000000}
                lineWidth={2}
                rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            /> */}
            {/* <Line
                points={[[-tick, 0, 0], [tick, 0, 0]]}
                position={add(mul(n, lenHalf), mul(ext, e))}
                color={0x000000}
                lineWidth={2}
                rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            /> */}

            {/* main */}
            <Line
                points={[mul(n, -lenHalf - tick), mul(n, lenHalf + tick)]}
                color={0x000000}
                lineWidth={1}
                //segments={10}
                dashed={false}
                position={mul(ext, e)}
            />

            {/* label */}
            <Text
                //ref={ref}
                scale={0.05}
                position={mul(ext, e + textext)}
                color={0x000000}
                fontSize={4}
                maxWidth={200}
                lineHeight={1}
                letterSpacing={0.02}
                textAlign={"center"}
                anchorX="center"
                anchorY="top"
                rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            >
                {label}
            </Text>
        </group>
    )
}
