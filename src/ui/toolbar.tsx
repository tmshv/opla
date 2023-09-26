import { ButtonGroup, Button } from "@nextui-org/react"

export type ToolbarItem = {
    label: string
    value: string
    icon: React.ReactNode
}

export type ToolbarOnChange = (value: string) => void

export type ToolbarProps = {
    items: ToolbarItem[]
    value: string
    onChange: ToolbarOnChange
}

export const Toolbar: React.FC<ToolbarProps> = ({ items, value, onChange }) => (
    <ButtonGroup variant="ghost" color="primary" disableRipple disableAnimation>
        {items.map(({ label, icon, value: itemValue }, i) => (
            <Button
                key={i}
                isIconOnly
                variant={itemValue === value ? "solid" : "flat"}
                aria-label={label}
                onClick={() => {
                    onChange(itemValue)
                }}
            >
                {icon}
            </Button>
        ))}
    </ButtonGroup>
)
