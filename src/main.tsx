import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
    createBrowserRouter,
    redirect,
    RouterProvider,
} from "react-router-dom"
import { Providers } from "@/components/providers"
import user from "@/stores/user"
import { setOpla } from "@/stores/opla"
import api from "./api"
import PageDashboard from "@/components/page-dashboard"
import PageJoin from "@/components/page-join"
import PageModel from "@/components/page-model"

import "./style.css"

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PageDashboard />
        ),
        loader: async () => {
            if (!user.auth) {
                // if you know you can't render the route, you can
                // throw a redirect to stop executing code here,
                // sending the user to a new route
                throw redirect("/join")
            }

            // Fetch user models
            const res = await api.getOplas()
            return res
        }
    },
    {
        path: "/join",
        element: (
            <PageJoin />
        ),
    },
    {
        path: "/:oplaId",
        element: (
            <PageModel />
        ),
        loader: async ({ params }) => {
            const { oplaId } = params
            if (!oplaId) {
                throw redirect("/")
            }
            const { id, name, definition: model } = await api.getOpla(oplaId)
            setOpla(id, name, model)

            return true
        }
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
