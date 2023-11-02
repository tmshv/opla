import { forwardRef } from "react"

export type UngroupProps = {
    color?: string
    size?: string | number
}

const Ungroup: React.FC<UngroupProps> = forwardRef<SVGSVGElement, UngroupProps>(({ color = "currentColor", size = 24, ...rest }, ref) => {
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            <path d="M 1 21 C 1 22.104568 1.895431 23 3 23 L 8 23 C 9.104569 23 10 22.104568 10 21 L 10 16 C 10 14.895431 9.104569 14 8 14 L 3 14 C 1.895431 14 1 14.895431 1 16 Z" />
            <path d="M 7 8 C 7 9.104569 7.895431 10 9 10 L 15 10 C 16.104568 10 17 9.104569 17 8 L 17 3 C 17 1.895432 16.104568 1 15 1 L 9 1 C 7.895431 1 7 1.895432 7 3 Z" />
            <path d="M 14 21 C 14 22.104568 14.895431 23 16 23 L 21 23 C 22.104568 23 23 22.104568 23 21 L 23 16 C 23 14.895431 22.104568 14 21 14 L 16 14 C 14.895431 14 14 14.895431 14 16 Z" />
        </svg>
    );
});

Ungroup.displayName = "Ungroup"

export default Ungroup
