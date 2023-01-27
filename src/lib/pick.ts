import * as THREE from "three"

export class ScenePicker<T> {
    private texture: THREE.WebGLRenderTarget
    private scene: THREE.Scene
    private index = new Map<number, T>()

    constructor(
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer
    ) {
        this.texture = new THREE.WebGLRenderTarget(1, 1)
        this.scene = new THREE.Scene()
    }

    public setScene(scene: THREE.Scene) {
        this.scene = scene

        return this
    }

    public getScene(): THREE.Scene {
        return this.scene
    }

    public setItem(id: number, item: T) {
        this.index.set(id, item)
        return this
    }

    public getItem(id: number): T | null {
        if (!this.index.has(id)) {
            return null
        }

        return this.index.get(id) ?? null
    }

    /**
     * render the picking scene off-screen
     * @param x
     * @param y
     */
    public pick(x: number, y: number): T | null {
        // set the view offset to represent just a single pixel under the coord
        const coordX = x * window.devicePixelRatio | 0
        const coordY = y * window.devicePixelRatio | 0
        const width = this.renderer.domElement.width
        const height = this.renderer.domElement.height
        this.camera.setViewOffset(width, height, coordX, coordY, 1, 1)

        // render the scene
        this.renderer.setRenderTarget(this.texture)
        this.renderer.render(this.scene, this.camera)

        // clear the view offset so rendering returns to normal
        this.camera.clearViewOffset()

        //create buffer for reading single pixel
        const pixelBuffer = new Uint8Array(4)

        //read the pixel
        this.renderer.readRenderTargetPixels(this.texture, 0, 0, 1, 1, pixelBuffer)

        //interpret the pixel as an ID
        const colorId = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2])

        return this.getItem(colorId)
    }
}
