import { runApp } from "@/app"
import { AppController } from "@/app/controller"
import { createOplaSystem } from "@/opla"
import { NextPage } from "next"
import { MutableRefObject, useCallback, useEffect, useRef } from "react"

function make() {
    const opla = createOplaSystem()

    return new AppController(opla)
}

function useOpla(ref: MutableRefObject<HTMLDivElement>) {
    const ctrl = useRef(make())

    useEffect(() => {
        ctrl.current = runApp(ctrl.current, ref.current)
    }, [ref.current, ctrl])

    return ctrl
}

const Page: NextPage = () => {
    const ref = useRef<HTMLDivElement>()
    const ctrl = useOpla(ref)

    const onClickSelect = useCallback(event => {
        ctrl.current.setTool('select', {})
    }, [])
    const onClickAdd = useCallback(event => {
        ctrl.current.setTool('add', {})
    }, [])
    const onClickRemove = useCallback(event => {
        ctrl.current.setTool('remove', {})
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
                <button onClick={onClickSelect}>select</button>
                <button onClick={onClickAdd}>add</button>
                <button onClick={onClickRemove}>remove</button>
            </div>
        </div>
    )
}

export default Page
