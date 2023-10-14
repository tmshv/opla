"use client"

import Opla from "@/components/opla"
import { MousePointer, Plus, Trash, Share } from "react-feather"
import { Leva } from "leva"
import * as THREE from "three"

import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter"

import appState, { Tool } from "@/stores/app"
import { state } from "@/stores/opla"
import { useSnapshot } from "valtio"
import { Toolbar } from "@/ui/toolbar"
import { useCallback, useMemo } from "react"

import type { ToolbarOnChange } from "@/ui/toolbar"
import { downloadBlob } from "@/lib/download"
import { OplaStat } from "@/components/opla-stat"

const Page = () => {
    const threeScene = useMemo(() => {
        return new THREE.Scene()
    }, [])

    const { tool, target } = useSnapshot(appState)
    const { scene } = useSnapshot(state)

    const onToolbarChange = useCallback<ToolbarOnChange>(async value => {
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
            case Tool.EXPORT: {
                const e = new USDZExporter()
                const opla = threeScene
                // const opla = threeScene.getObjectByName("opla")
                if (opla) {
                    const blob = await e.parse(opla)
                    await downloadBlob(blob, "opla-export.usdz", "application/octet-stream")
                }
                break
            }
            default: {
                break
            }
        }
    }, [target, scene, threeScene])

    return (
        <>
            <Opla scene={threeScene} />
            <Leva />

            <div className="absolute left-2 bottom-2 flex justify-center">
                <OplaStat />
            </div>

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
                        {
                            label: "Export",
                            value: Tool.EXPORT,
                            icon: (
                                <Share size={15} />
                            ),
                            visible: false,
                        },
                    ]}
                    onChange={onToolbarChange}
                />
            </div>
        </>
    )
}

export default Page
