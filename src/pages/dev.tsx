import { runApp } from "@/app"
import { AppController } from "@/app/controller"
import { createRandomOplaSystem1 } from "@/opla"
import { Button } from "@/ui/Button"
import { NextPage } from "next"
import { forwardRef, memo, MutableRefObject, useCallback, useEffect, useRef, useState } from "react"

function make() {
    const opla = createRandomOplaSystem1(3)

    return new AppController(opla)
}

const sizes = new Map([
    ['200', 1],
    ['400', 2],
    ['600', 3],
    ['800', 4],
])

const sizesN = new Map([
    [1, '200'],
    [2, '400'],
    [3, '600'],
    [4, '800'],
])

// const sizes = new Map([
//     ['1', 1],
//     ['2', 1.1],
//     ['3', 1.2],
//     ['4', 1.3],
//     ['5', 1.4],
//     ['6', 1.6],
// ])

// const sizesN = new Map([
//     [1, '1'],
//     [1.1, '2'],
//     [1.2, '3'],
//     [1.3, '4'],
//     [1.4, '5'],
//     [1.6, '6'],
// ])

type AxisSizeSelectorOnClick = (value: string) => void
type AxisSizeSelectorProps = {
    options: string[]
    value: string
    onClick: AxisSizeSelectorOnClick
}

const AxisSizeSelector = forwardRef<HTMLDivElement, AxisSizeSelectorProps>((props, ref) => {
    const onClick = (e) => {
        const v = e.target.name

        props.onClick(v)
    }

    return (
        <div ref={ref as any}>
            {props.options.map(x => (
                <Button
                    key={x}
                    name={x}
                    onClick={onClick}
                    theme={props.value === x ? 'checked' : 'default'}
                >{x}</Button>
            ))}
        </div>
    )
})

function useOpla(ref: MutableRefObject<HTMLDivElement>, options: any) {
    const ctrl = useRef(make())

    useEffect(() => {
        (async () => {
            ctrl.current = await runApp(ctrl.current, ref.current)
        })()
    }, [ref.current, ctrl])

    return ctrl.current
}

function useCellSize(ctrl: AppController) {
    const [size, setSize] = useState(['1', '1', '1'])

    useEffect(() => {
        ctrl.subjects.cellDimension.subscribe(cell => {
            const ax = sizesN.get(cell.x)
            const ay = sizesN.get(cell.y)
            const az = sizesN.get(cell.z)

            console.log('upd useCellSize', ax, ay, az)
            setSize([ax, ay, az])
        })
    }, [ctrl])

    return size
}

const AppControls: React.FC<{ ctrl: AppController }> = memo(props => {
    const [ax, ay, az] = useCellSize(props.ctrl)

    const onClickSelect = useCallback(event => {
        props.ctrl.setTool('select', {})
    }, [])
    const onClickAdd = useCallback(event => {
        props.ctrl.setTool('add', {})
    }, [])
    const onClickRemove = useCallback(event => {
        props.ctrl.setTool('remove', {})
    }, [])

    const onClickX = useCallback<AxisSizeSelectorOnClick>(name => {
        const size = sizes.get(name)
        props.ctrl.setCellDimensionX(size)
    }, [])
    const onClickY = useCallback<AxisSizeSelectorOnClick>(name => {
        const size = sizes.get(name)
        props.ctrl.setCellDimensionY(size)
    }, [])
    const onClickZ = useCallback<AxisSizeSelectorOnClick>(name => {
        const size = sizes.get(name)
        props.ctrl.setCellDimensionZ(size)
    }, [])

    const ss = ['200', '400', '600', '800']

    return (
        <div className="max-w-sm px-2 py-2 bg-white rounded-none overflow-hidden shadow-lg">
            <Button onClick={onClickSelect}>select</Button>
            <Button onClick={onClickAdd}>add</Button>
            <Button onClick={onClickRemove}>remove</Button>

            <AxisSizeSelector
                onClick={onClickX}
                // ref={refAxisX}
                value={ax}
                options={ss}
            />
            <AxisSizeSelector
                onClick={onClickY}
                // ref={refAxisY}
                value={ay}
                options={ss}
            />
            <AxisSizeSelector
                onClick={onClickZ}
                // ref={refAxisZ}
                value={az}
                options={ss}
            />
        </div>
    )
})

const Page: NextPage = () => {
    const ref = useRef<HTMLDivElement>()
    const refAxisX = useRef<HTMLDivElement>()
    const refAxisY = useRef<HTMLDivElement>()
    const refAxisZ = useRef<HTMLDivElement>()
    const ctrl = useOpla(ref, {
        refAxisX,
        refAxisY,
        refAxisZ,
    })

    return (
        <div>
            <div
                style={{
                    backgroundColor: '#dcdce1',
                }}
                ref={ref}
            />

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                }}
            >
                <AppControls
                    ctrl={ctrl}
                />
            </div>
        </div>
    )
}

export default Page
