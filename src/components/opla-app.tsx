import OplaCanvas from "@/components/opla-canvas"
import { MousePointer, Plus, Trash, Share, CornerUpLeft, CornerUpRight, Box } from "react-feather"
import { Leva } from "leva"

import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter"

import appState, { Tool } from "@/stores/app"
import scenes from "@/scenes"
import state from "@/stores/opla"
import { subscribe, useSnapshot } from "valtio"
import { Toolbar } from "@/ui/toolbar"
import { useCallback, useMemo } from "react"

import type { ToolbarOnChange } from "@/ui/toolbar"
import type { V3 } from "@/stores/opla"
import { downloadBlob } from "@/lib/download"
import { OplaStat } from "@/components/opla-stat"
import { join } from "@/core/join"
import { explode } from "@/core/explode"
import { OplaBrush } from "@/components/opla-brush"
import { SizeSelect } from "@/ui/size-select"

import Group from "@/icons/group"
import Ungroup from "@/icons/ungroup"
import { getOplaModel } from "@/lib/export-model"

// Reset selection if target id set but actual object is not found
subscribe(state, () => {
    const t = appState.target
    if (t && !state.value.model.items[t]) {
        appState.target = null
    }
})

export type OplaAppProps = {}

export const OplaApp = () => {
    const { tool, target, targetSize, sceneId } = useSnapshot(appState)
    const { value: { model: { scene, items } } } = useSnapshot(state)

    const brushSize = useMemo(() => {
        if (!target) {
            return null
        }
        const item = items[target]
        switch (item.type) {
            case "box": {
                return item.size as V3
            }
            default: {
                return null
            }
        }
    }, [items, target])

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
                    state.value.model.scene = scene.filter(x => x !== target)
                    appState.target = null
                }
                break
            }
            case Tool.EXPORT: {
                if (sceneId) {
                    const scene = scenes.get(sceneId)
                    if (scene) {
                        const gltf = new GLTFExporter()
                        // const usdz = new USDZExporter()
                        const opla = scene.getObjectByName("opla-model")
                        if (opla) {
                            const now = Date.now()
                            const model = getOplaModel(opla, {
                                move: true,
                                scale: 0.15,
                            })
                            gltf.parse(model, async (gltfJson) => {
                                const raw = JSON.stringify(gltfJson)
                                const blob = new Blob([raw], { type: "application/json" })
                                const buffer = await blob.arrayBuffer()
                                const data = new Uint8Array(buffer)
                                downloadBlob(data, `${now}-opla-export.gltf`, "application/octet-stream")
                            }, (err) => {
                                console.error(err)
                            })
                        }
                    }
                }
                break
            }
            case "AR": {
                if (sceneId) {
                    const scene = scenes.get(sceneId)
                    if (scene) {
                        const usdz = new USDZExporter()
                        const opla = scene.getObjectByName("opla-model")
                        if (opla) {
                            const now = Date.now()
                            const model = getOplaModel(opla, {
                                move: true,
                                scale: 0.15,
                            })

                            usdz.parse(model, (blob) => {
                                downloadBlob(blob, `${now}-opla-export.usdz`, "application/octet-stream")
                            }, (err) => {
                                console.error(err)
                            })
                        }
                    }
                }
                break
            }
            case "Group": {
                join()
                appState.target = null
                break
            }
            case "Ungroup": {
                explode()
                appState.target = null
                break
            }
            case "Undo": {
                state.undo()
                break
            }
            case "Redo": {
                state.redo()
                break
            }
            default: {
                break
            }
        }
    }, [target, scene])

    let brush = brushSize
    if (tool === Tool.ADD) {
        brush = targetSize as V3
    }

    return (
        <>
            <OplaCanvas />
            <Leva hidden />

            {!brush ? null : (
                <div className="absolute left-4 top-16">
                    <div className="rounded-md mb-1 overflow-hidden" style={{
                        width: 150,
                        height: 150,
                    }}>
                        <OplaBrush
                            size={brush}
                        />
                    </div>

                    <div className="flex gap-2 items-center text-xs mb-1">
                        <span className="w-2">X:</span>
                        <SizeSelect
                            value={brush[0] * 150}
                            variants={[300, 450, 600, 750]}
                            onChange={(value) => {
                                appState.targetSize[0] = value / 150
                            }}
                            units="mm"
                        />
                    </div>
                    <div className="flex gap-2 items-center text-xs mb-1">
                        <span className="w-2">Y:</span>
                        <SizeSelect
                            value={brush[1] * 150}
                            variants={[300, 450, 600, 750]}
                            onChange={(value) => {
                                appState.targetSize[1] = value / 150
                            }}
                            units="mm"
                        />
                    </div>
                    <div className="flex gap-2 items-center text-xs mb-1">
                        <span className="w-2">Z:</span>
                        <SizeSelect
                            value={brush[2] * 150}
                            variants={[300, 450, 600, 750]}
                            onChange={(value) => {
                                appState.targetSize[2] = value / 150
                            }}
                            units="mm"
                        />
                    </div>
                </div>
            )}

            <div className="absolute left-2 bottom-2 flex justify-center text-xs">
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
                            label: "Group",
                            value: "Group",
                            icon: (
                                <Group size={15} />
                            ),
                        },
                        {
                            label: "Ungroup",
                            value: "Ungroup",
                            icon: (
                                <Ungroup size={15} />
                            ),
                        },
                        {
                            label: "Export",
                            value: Tool.EXPORT,
                            icon: (
                                <Share size={15} />
                            ),
                        },
                        {
                            label: "AR",
                            value: "AR",
                            icon: (
                                <Box size={15} />
                            ),
                        },
                        {
                            label: "Undo",
                            value: "Undo",
                            icon: (
                                <CornerUpLeft size={15} />
                            ),
                        },
                        {
                            label: "Redo",
                            value: "Redo",
                            icon: (
                                <CornerUpRight size={15} />
                            ),
                        },
                    ]}
                    onChange={onToolbarChange}
                />
            </div>
        </>
    )
}
