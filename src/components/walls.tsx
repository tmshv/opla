export const Walls: React.FC = () => {
    const s = 4
    return (
        <group name="walls">
            {/* normal to Y */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[1.5, -0.5 - 0.07, 1.5]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={0xaaffaa}
                    metalness={0.5}
                    roughness={0.75}
                />
            </mesh>
            {/* normal to X */}
            <mesh
                rotation={[0, Math.PI / 2, 0]}
                position={[-0.5 - 0.07, 1.5, 1.5]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={0xffaaaa}
                    metalness={0.5}
                    roughness={0.75}
                />
            </mesh>
            {/* normal to Z */}
            <mesh
                rotation={[0, 0, Math.PI / 2]}
                position={[1.5, 1.5, -0.5 - 0.07]}
            >
                <planeGeometry args={[s, s, s]} />
                <meshStandardMaterial
                    color={0xaaaaff}
                    metalness={0.5}
                    roughness={0.75}
                />
            </mesh>
        </group>
    )
}

