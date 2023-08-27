"use client"

import Opla from "@/components/opla"
import { ButtonGroup, Button } from "@nextui-org/react"
import { MousePointer, Plus, Trash } from "react-feather"
import { Leva } from "leva"

import appState, { Tool } from "@/stores/app"
import { state } from "@/stores/opla"

const Page = () => {
    // explode: button(() => {
    //     explode()
    //     appState.target = null
    // }),
    // join: button(() => {
    //     join()
    //     appState.target = null
    // }),
    //

    return (
        <>
            <Opla />
            <Leva />
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                <ButtonGroup variant="ghost" color="default" disableRipple disableAnimation>
                    <Button
                        isIconOnly
                        aria-label="Select"
                        onClick={() => {
                            appState.tool = Tool.SELECT
                        }}
                    >
                        <MousePointer size={15} />
                    </Button>
                    <Button
                        isIconOnly
                        onClick={() => {
                            appState.tool = Tool.ADD
                        }}
                    >
                        <Plus size={15} />
                    </Button>
                    <Button
                        isIconOnly
                        onClick={() => {
                            state.scene = []
                            state.items = {}
                            appState.target = null
                        }}
                    >
                        <Trash size={15} />
                    </Button>
                </ButtonGroup>
            </div>
        </>
    )
}

export default Page
