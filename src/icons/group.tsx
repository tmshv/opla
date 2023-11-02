import { forwardRef } from "react"

export type GroupProps = {
    color?: string
    size?: string | number
}

const Group: React.FC<GroupProps> = forwardRef<SVGSVGElement, GroupProps>(({ color = "currentColor", size = 24, ...rest }, ref) => {
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
            <path d="M 7 12 L 17 12 L 17 5 C 17 3.895432 16.104568 3 15 3 L 9 3 C 7.895431 3 7 3.895432 7 5 Z" />
            <path d="M 3 19 C 3 20.104568 3.895431 21 5 21 L 10 21 C 11.104569 21 12 20.104568 12 19 L 12 12 L 5 12 C 3.895431 12 3 12.895431 3 14 Z" />
            <path d="M 12 19 C 12 20.104568 12.895431 21 14 21 L 19 21 C 20.104568 21 21 20.104568 21 19 L 21 14 C 21 12.895431 20.104568 12 19 12 L 12 12 Z" />
        </svg>
    );
});

Group.displayName = "Group"

export default Group
