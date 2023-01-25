import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader"

export async function loadAssets(files: string[]): Promise<GLTF[]> {
    const basePath = "/assets/"

    return Promise.all(files.map(file => loadAsset(basePath, file)))
}

async function loadAsset(basePath: string, file: string): Promise<GLTF> {
    const onProgress = () => { }
    const loader = new GLTFLoader()
    loader.setPath(basePath)

    return new Promise((resolve, reject) => {
        loader.load(file, resolve, onProgress, reject)
    })
}
