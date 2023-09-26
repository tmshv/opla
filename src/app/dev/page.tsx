"use client"

import Opla from "@/components/opla"
import { MousePointer, Plus, Trash } from "react-feather"
import { Leva } from "leva"

import appState, { Tool } from "@/stores/app"
import { state } from "@/stores/opla"
import { useSnapshot } from "valtio"
import { Toolbar } from "@/ui/toolbar"
import { useCallback } from "react"

import type { ToolbarOnChange } from "@/ui/toolbar"

const Page = () => {
    const { tool, target } = useSnapshot(appState)
    const { scene } = useSnapshot(state)

    const onToolbarChange = useCallback<ToolbarOnChange>(value => {
        switch (value) {
            case Tool.SELECT: {
                appState.tool = Tool.SELECT
                break
            }
            case Tool.ADD: {
                appState.tool = Tool.ADD
                break
            }
            case Tool.DELETE: {
                if (target) {
                    state.scene = scene.filter(x => x !== target)
                    // state.items = {}
                    appState.target = null
                }
                break
            }
            default: {
                break
            }
        }
    }, [target, scene])

    return (
        <>
            <Opla />
            <Leva />
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                <Toolbar
                    value={tool}
                    items={[
                        {
                            label: "Select",
                            value: Tool.SELECT,
                            icon: (
                                <MousePointer size={15} />
                            ),
                        },
                        {
                            label: "Add",
                            value: Tool.ADD,
                            icon: (
                                <Plus size={15} />
                            ),
                        },
                        {
                            label: "Delete",
                            value: Tool.DELETE,
                            icon: (
                                <Trash size={15} />
                            ),
                        },
                    ]}
                    onChange={onToolbarChange}
                />
            </div>
        </>
    )
}

export default Page
