export type ButtonProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    theme?: 'default' | 'primary' | 'link' | 'checked'
    // size?: ControlsSize
    // shape?: ButtonShape
    // href?: string
    // underlineRef?: MutableRefObject<null>
}

// ['focus:outline-none focus:shadow-outline'],
const themes = new Map([
    ['default', 'text-white bg-gray-900 hover:bg-gray-800'],
    ['checked', 'text-white bg-gray-500 hover:bg-gray-400'],
    ['primary', ''],
])

export const Button: React.FC<ButtonProps> = ({ theme = 'default', ...props }) => (
    <button
        className={`${themes.get(theme)} py-1 px-2 focus:outline-none focus:shadow-outline`}
        {...props}
    />
)
