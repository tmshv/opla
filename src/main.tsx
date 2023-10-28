import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { OplaApp } from "@/components/opla-app"
import {
    createBrowserRouter,
    RouterProvider,
    useParams,
} from "react-router-dom"
import "./style.css"
import { Providers } from "@/components/providers"
import { Navigation } from "@/components/navigation"
import { state } from "@/stores/opla"

import React from "react";
import api from "./api"
import { subscribe } from "valtio"

const SyncOplaModel = () => {
    const { oplaId } = useParams()

    useEffect(() => {
        const fn = async (oplaId: string) => {
            const def = await api.getModelDefinition(oplaId)
            state.value = def
        }
        if (oplaId) {
            fn(oplaId)
        }
    }, [oplaId])

    useEffect(() => {
        const stop = subscribe(state, async () => {
            await api.updateModelDefinition(oplaId!, state.value)
        })

        // stop sync if it is new model
        // TODO ???
        if (!oplaId) {
            stop()
        }

        return () => {
            stop()
        }
    }, [oplaId])

    return null
}

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <OplaApp />
                <div className="absolute top-0 left-0 w-full">
                    <Navigation />
                </div>
            </>
        ),
    },
    {
        path: "/:oplaId",
        element: (
            <>
                <OplaApp />
                <div className="absolute top-0 left-0 w-full">
                    <Navigation />
                </div>
                <SyncOplaModel />
            </>
        ),
    },
]);

const container = document.getElementById("root")!
createRoot(container).render(
    <StrictMode>
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    </StrictMode>
)
