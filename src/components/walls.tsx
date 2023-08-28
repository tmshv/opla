import { useDarkTheme } from "@/hooks/use-dark-theme"
import { useControls } from "leva"
import type { ColorRepresentation } from "three"

export const Walls: React.FC = () => {
    const dark = useDarkTheme()
    const S = 200
    const S2 = S / 2
    const { metalness, roughness, color, gridColor } = useControls({
        metalness: {
            min: 0,
            max: 1,
            value: 0.15,
        },
        roughness: {
            min: 0,
            max: 1,
            value: 0.9,
        },
        color: dark ? "#131517" : "#d3dbe2",
        gridColor: dark ? "#5d6265" : "#979ea3",
    })
    const gc = gridColor as ColorRepresentation
    const shift = 0.1

    return (
        <>
            <group
                name="walls"
                position={[-0.5 - shift, -0.5 - shift, -0.5 - shift]}
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
            >
                {/* normal to Y */}
                <gridHelper
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[S2, S2, 0]}
                    args={[S, S, gc, gc]}
                />
                {/* normal to X */}
                <gridHelper
                    rotation={[0, Math.PI / 2, 0]}
                    position={[S2, 0, S2]}
                    args={[S, S, gc, gc]}
                />
                {/* normal to Z */}
                <gridHelper
                    rotation={[0, 0, Math.PI / 2]}
                    position={[0, S2, S2]}
                    args={[S, S, gc, gc]}
                />
            </group>
        </>
    )
}

