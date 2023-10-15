import { grid } from "@/lib/array"
import { Instance, Instances } from "@react-three/drei"
import { ColorRepresentation } from "three"

export type GridProps = {
    number: number
    lineWidth: number
    height: number
    color: ColorRepresentation
}
export const Grid: React.FC<GridProps> = ({ number = 20, lineWidth = 0.02, height = 0.5, color }) => (
    <Instances position={[-0.5, -0.5, -0.5]}>
        <planeGeometry args={[lineWidth, height]} />
        <meshBasicMaterial color={color} />
        {grid(number, number).map(([x, y]) => {
            const f = Math.floor(number / 2) * 2
            const halfpi = Math.PI / 2
            return (
                <group key={`${x}:${y}`}
                    position={[x * 2 - f, -0.01, y * 2 - f]}
                >
                    <Instance rotation={[-halfpi, 0, 0]} />
                    <Instance rotation={[-halfpi, 0, halfpi]} />
                </group>
            )
        })}
    </Instances>
)
