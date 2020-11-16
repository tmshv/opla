import { runApp } from "@/app"
import { AppController } from "@/app/controller"
import { createOplaSystem } from "@/opla"
import { Button } from "@/ui/Button"
import { NextPage } from "next"
import { forwardRef, MutableRefObject, useCallback, useEffect, useRef } from "react"

function make() {
    const opla = createOplaSystem()

    return new AppController(opla)
}

type AxisSizeSelectorOnClick = (value: number) => void
type AxisSizeSelectorProps = {
    onClick: AxisSizeSelectorOnClick
}

const AxisSizeSelector = forwardRef<HTMLDivElement, AxisSizeSelectorProps>((props, ref) => {
    const onClick = (e) => {
        const v = parseInt(e.target.name)

        props.onClick(v)
    }

    return (
        <div ref={ref as any}>
            <Button name={'1'} onClick={onClick}>1</Button>
            <Button name={'2'} onClick={onClick}>2</Button>
            <Button name={'3'} onClick={onClick}>3</Button>
            <Button name={'4'} onClick={onClick}>4</Button>
            <Button name={'5'} onClick={onClick}>5</Button>
            <Button name={'6'} onClick={onClick}>6</Button>
        </div>
    )
})

function useOpla(ref: MutableRefObject<HTMLDivElement>, options: any) {
    const ctrl = useRef(make())

    useEffect(() => {
        ctrl.current = runApp(ctrl.current, ref.current)

    }, [ref.current, ctrl])

    return ctrl.current
}

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

    const onClickSelect = useCallback(event => {
        ctrl.setTool('select', {})
    }, [])
    const onClickAdd = useCallback(event => {
        ctrl.setTool('add', {})
    }, [])
    const onClickRemove = useCallback(event => {
        ctrl.setTool('remove', {})
    }, [])

    const onClickX = useCallback<AxisSizeSelectorOnClick>(size => {
        console.log('x', size)
    }, [])
    const onClickY = useCallback<AxisSizeSelectorOnClick>(size => {
        console.log('y', size)
    }, [])
    const onClickZ = useCallback<AxisSizeSelectorOnClick>(size => {
        console.log('z', size)
    }, [])

    return (
        <div>
            <div ref={ref} />

            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                }}
            >
                <div className="max-w-sm px-2 py-2 bg-white rounded-none overflow-hidden shadow-lg">
                    <Button onClick={onClickSelect}>select</Button>
                    <Button onClick={onClickAdd}>add</Button>
                    <Button onClick={onClickRemove}>remove</Button>

                    <AxisSizeSelector
                        onClick={onClickX}
                        ref={refAxisX}
                    />
                    <AxisSizeSelector
                        onClick={onClickY}
                        ref={refAxisY}
                    />
                    <AxisSizeSelector
                        onClick={onClickZ}
                        ref={refAxisZ}
                    />
                </div>
            </div>
        </div>
    )
}

export default Page
