import { useControls } from "leva"

export const Walls: React.FC = () => {
    const s = 400
    const { metalness, roughness, color } = useControls({
        metalness: {
            min: 0,
            max: 1,
            value: 0.85,
        },
        roughness: {
            min: 0,
            max: 1,
            value: 0.6,
        },
        color: "#bebebe",
    })

    return (
        <group name="walls">
            {/* normal to Y */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[1.5, -0.5 - 0.07, 1.5]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={color}
                    metalness={metalness}
                    roughness={roughness}
                />
            </mesh>
            {/* normal to X */}
            <mesh
                rotation={[0, Math.PI / 2, 0]}
                position={[-0.5 - 0.07, 1.5, 1.5]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.1}
                    roughness={0.9}
                />
            </mesh>
            {/* normal to Z */}
            <mesh
                rotation={[0, 0, Math.PI / 2]}
                position={[1.5, 1.5, -0.5 - 0.07]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.1}
                    roughness={0.9}
                />
            </mesh>
        </group>
    )
}

