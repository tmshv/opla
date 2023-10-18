import { Button } from "@nextui-org/react"

export type OnChange = (value: number) => void

export type SizeSelectProps = {
    variants: number[]
    value: number
    onChange: OnChange
    units: string
}

export const SizeSelect: React.FC<SizeSelectProps> = ({ variants, value, units, onChange }) => (
    <div className="flex gap-0 items-stretch">
        {variants.map(v => (
            <Button disableRipple
                key={v}
                //radius="none"
                onClick={() => {
                    onChange(v)
                }}
                variant={v === value ? "solid" : "light"}
                color={v === value ? "primary" : "default"}
                className="min-w-0 px-1 h-unit-4"
                size="sm"
            >
                {v}
                {/* {units} */}
            </Button>
        ))}
    </div>
)
