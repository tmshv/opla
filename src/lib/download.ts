import { sleep } from "./sleep"

export async function downloadBlob(data: Uint8Array, fileName: string, mimeType: string) {
    const blob = new Blob([data], {
        type: mimeType,
    })
    const url = window.URL.createObjectURL(blob)
    downloadURL(url, fileName)
    await sleep(1000)
    window.URL.revokeObjectURL(url)
}

export async function downloadText(data: string, fileName: string) {
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`
    downloadURL(url, fileName)
    await sleep(1000)
    window.URL.revokeObjectURL(url)
}

export function downloadURL(data: string, fileName: string) {
    const a = document.createElement("a")
    a.href = data
    a.download = fileName
    document.body.appendChild(a)
    a.setAttribute("style", "display: none")
    a.click()
    a.remove()
}
