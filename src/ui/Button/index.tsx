export type ButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    // theme?: 'default' | 'primary' | 'link'
    // size?: ControlsSize
    // shape?: ButtonShape
    // href?: string
    // underlineRef?: MutableRefObject<null>
}

export const Button: React.FC<ButtonProps> = props => (
    <button
        className="bg-gray-900 hover:bg-gray-800 text-white py-1 px-2 focus:outline-none focus:shadow-outline"
        {...props}
    />
)
