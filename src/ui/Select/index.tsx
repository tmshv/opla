export type SelectProps = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> & {
    options: string[]
    // theme?: 'default' | 'primary' | 'link'
    // size?: ControlsSize
    // shape?: ButtonShape
    // href?: string
    // underlineRef?: MutableRefObject<null>
}

export const Select: React.FC<SelectProps> = ({ options, children, ...props }) => (
    <div className="inline-block relative w-full">
        <select
            className="block appearance-none text-white w-full bg-gray-700 rounded-none hover:bg-gray-500 px-2 py-1 pr-8 focus:outline-none focus:shadow-outline"
            {...props}
        >
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
            {/* {options.map((x, i) => {
            <option key={i}>{x}</option>
        })} */}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
    </div>
)
