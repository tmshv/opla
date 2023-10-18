import type { ColorRepresentation } from "three"

export type WallsProps = {
    walls: boolean
    grid: boolean
    color: ColorRepresentation
    gridColor: ColorRepresentation
}

export const Walls: React.FC<WallsProps> = ({ walls, grid, color, gridColor }) => {
    const S = 100
    const S2 = S / 2
    const metalness = 0.15
    const roughness = 0.9
    const shift = 0.1

    return (
        <>
            <group
                name="walls"
                position={[-0.5 - shift, -0.5 - shift, -0.5 - shift]}
                visible={walls}
            >
                {/* normal to Y */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[S2, 0, S2]}
                >
                    <planeGeometry args={[S, S, S]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={metalness}
                        roughness={roughness}
                    />
                </mesh>
                {/* normal to X */}
                <mesh
                    rotation={[0, Math.PI / 2, 0]}
                    position={[0, S2, S2]}
                >
                    <planeGeometry args={[S, S, S]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={metalness}
                        roughness={roughness}
                    // metalness={0.1}
                    // roughness={0.9}
                    />
                </mesh>
                {/* normal to Z */}
                <mesh
                    rotation={[0, 0, Math.PI / 2]}
                    position={[S2, S2, 0]}
                >
                    <planeGeometry args={[S, S, S]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={metalness}
                        roughness={roughness}
                    // metalness={0.1}
                    // roughness={0.9}
                    />
                </mesh>
            </group>
            <group
                name="walls-grid"
                position={[-0.5, -0.5, -0.5]}
                visible={grid}
            >
                {/* normal to Y */}
                <gridHelper
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[S2, S2, 0]}
                    args={[S, S, gridColor, gridColor]}
                />
                {/* normal to X */}
                <gridHelper
                    rotation={[0, Math.PI / 2, 0]}
                    position={[S2, 0, S2]}
                    args={[S, S, gridColor, gridColor]}
                />
                {/* normal to Z */}
                <gridHelper
                    rotation={[0, 0, Math.PI / 2]}
                    position={[0, S2, S2]}
                    args={[S, S, gridColor, gridColor]}
                />
            </group>
        </>
    )
}
