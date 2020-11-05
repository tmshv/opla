import * as THREE from 'three';

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { randomColor, createOplaSystem, OplaSystem } from './opla';

var container, stats;
var camera, controls, scene, renderer;
var highlightBox;

let picker: ScenePicker<[string, any]>

var mouse = new THREE.Vector2();
let selectedItemScaleOffset = new THREE.Vector3(2, 2, 2);

const materialLib = new Map([
    ['open', new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, opacity: 1 })],
    ['closed', new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true, vertexColors: false, shininess: 0 })],
])

function hex(value: number) {
    const color = new THREE.Color()
    color.setHex(value)
    return color
}

export function runApp(elem: HTMLElement) {
    container = elem
    init();
    animate();
}

class ScenePicker<T> {
    private texture: THREE.WebGLRenderTarget
    private scene: THREE.Scene
    private index = new Map<number, T>()

    constructor(
        private camera: THREE.PerspectiveCamera,
        private renderer: THREE.WebGLRenderer
    ) {
        this.texture = new THREE.WebGLRenderTarget(1, 1)
    }

    public setScene(scene: THREE.Scene) {
        this.scene = scene

        return this
    }

    public setItem(id: number, item: T) {
        this.index.set(id, item)
        return this
    }

    public getItem(id: number): T | null {
        if (!this.index.has(id)) {
            return null
        }

        return this.index.get(id)
    }

    /**
     * render the picking scene off-screen
     * @param x
     * @param y
     */
    public pick(x: number, y: number): T | null {
        // set the view offset to represent just a single pixel under the coord
        const coordX = x * window.devicePixelRatio | 0
        const coordY = mouse.y * window.devicePixelRatio | 0
        const width = this.renderer.domElement.width
        const height = this.renderer.domElement.height
        this.camera.setViewOffset(width, height, coordX, coordY, 1, 1)

        // render the scene
        this.renderer.setRenderTarget(this.texture)
        this.renderer.render(this.scene, this.camera)

        // clear the view offset so rendering returns to normal
        camera.clearViewOffset()

        //create buffer for reading single pixel
        const pixelBuffer = new Uint8Array(4)

        //read the pixel
        this.renderer.readRenderTargetPixels(this.texture, 0, 0, 1, 1, pixelBuffer)

        //interpret the pixel as an ID
        const colorId = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2])

        return this.getItem(colorId)
    }
}

function applyVertexColors(geometry: THREE.BufferGeometry, color: THREE.Color) {
    let position = geometry.attributes.position
    let colors: number[] = []

    for (let i = 0; i < position.count; i++) {
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

type BoxColors = [
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
]
function applyVertexColorsToBoxFaces(geometry: THREE.BufferGeometry, colors: BoxColors) {
    const buffer: number[] = []
    colors.forEach(color => {
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
        buffer.push(color.r, color.g, color.b)
    })
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(buffer, 3))
}

function applyRandomVertexColors(geometry: THREE.BufferGeometry) {
    const color = new THREE.Color()
    let position = geometry.attributes.position

    const colors: number[] = []
    for (let i = 0; i < position.count; i += 4) {
        color.setHex(Math.floor(Math.random() * 0x1000000))
        colors.push(color.r, color.g, color.b)
        colors.push(color.r, color.g, color.b)
        colors.push(color.r, color.g, color.b)
        colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

function createBoxes(opla: OplaSystem) {
    const offset = new THREE.Vector3(-500, 0, -500)
    const s = 100

    return opla.blocks.map(block => {
        const [position, scale] = block.createTransformComponents(opla.grid, s, offset)
        const matrix = block.createMatrix(opla.grid, s, offset)

        // let geometryBox = box(scale.x, scale.y, scale.z)
        const dashScale = 0.1
        let lineMaterial = new THREE.LineDashedMaterial({ color: 0x666666, dashSize: 3 * dashScale, gapSize: 1 * dashScale })
        let geometryBox = box(1, 1, 1)
        let lineSegments = new THREE.LineSegments(geometryBox, lineMaterial)
        lineSegments.applyMatrix4(matrix)
        lineSegments.computeLineDistances()

        // positionOffset.x += axisX - 1
        // positionOffset.y += axisY - 1
        // positionOffset.z += axisZ - 1

        let geometry = new THREE.BoxBufferGeometry()
        geometry.applyMatrix4(matrix)
        const material = materialLib.get(block.blockType)
        const mesh = new THREE.Mesh(geometry, material)

        const pickColors: BoxColors = [
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            hex(randomColor()),
            // hex(0xffff00),
            // hex(0x00ffff),
            // hex(0xff00ff), // top
            // hex(0xff0000), // bottom
            // hex(0x00ff00), // opposite of one
            // hex(0x0000ff), // one
        ]
        const pick = new THREE.BoxBufferGeometry()
        pick.applyMatrix4(matrix)
        // give the geometry's vertices a color corresponding to the "id"
        // applyVertexColors(geometry, color.setHex(i));
        applyVertexColorsToBoxFaces(pick, pickColors)
        // applyVertexColors(geometry, color.setHex(Math.floor(Math.random() * 0x1000000)))

        return {
            block,
            material,
            geometry,
            mesh,
            matrix,
            pick,
            pickColors,
            position,
            // rotation,
            scale,
            // g: lineSegments,
        }
    })
}

type GridFactoryFunction3<T> = (x: number, y: number, z: number, i: number) => T | null
function createGrid3<T>(x: number, y: number, z: number, factory: GridFactoryFunction3<T>): T[] {
    const result: T[] = []

    let count = 0
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            for (let k = 0; k < z; k++) {
                const item = factory(i, j, k, count)
                if (item) {
                    result.push(item)
                }
                count++
            }
        }
    }
    return result
}

function init() {
    const opla = createOplaSystem()
    let boxes = createBoxes(opla)

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.y = 500
    camera.position.z = 1000

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeeeeff)
    scene.fog = new THREE.Fog(0xeeeeff, 1250, 2500)

    var gridHelper = new THREE.GridHelper(1000, 20)
    scene.add(gridHelper)

    scene.add(new THREE.AmbientLight(0x555555));

    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    scene.add(light);

    let objects = new THREE.Group()
    for (let item of boxes) {
        objects.add(item.mesh)
    }
    scene.add(objects)

    // objects.position.x = -500
    // objects.position.z = -500
    // pickingObjects.position.x = -500
    // pickingObjects.position.z = -500

    // pickingScene = new THREE.Scene()
    // pickingTexture = new THREE.WebGLRenderTarget(1, 1)
    // pickingScene.add(pickingObjects)

    // const color = new THREE.Color()
    // const mat = new THREE.MeshBasicMaterial({ vertexColors: true, flatShading: true });
    // const geometry = new THREE.BoxBufferGeometry(100, 100, 100)
    // // applyVertexColors(geometry, color.setHex(0xff00ff))
    // // applyRandomVertexColors(geometry)
    // applyVertexColorsToBoxFaces(geometry, [
    //     hex(0xffff00),
    //     hex(0x00ffff),
    //     hex(0xff00ff), // top
    //     hex(0xff0000), // bottom
    //     hex(0x00ff00), // opposite of one
    //     hex(0x0000ff), // one
    // ])
    // const objects = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries([geometry]), mat)
    // scene.add(objects)

    highlightBox = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshLambertMaterial({ color: 0xffff00 })
    )
    scene.add(highlightBox)

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.rotateSpeed = 1.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;

    picker = new ScenePicker<[string, any]>(camera, renderer)
    boxes.forEach(item => {
        item.pickColors.forEach((color, i) => {
            const dir = ['1-0', '1-1', 'top', 'bottom', '2-0', '2-1'][i]
            picker.setItem(color.getHex(), [dir, item])
        })
    })

    const picks = boxes.map(item => item.pick)
    const pickingMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, flatShading: true })
    const pickingObjects = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(picks), pickingMaterial)
    const pickScene = new THREE.Scene()
    pickScene.add(pickingObjects)
    picker.setScene(pickScene)

    controls = createControls(camera, renderer.domElement)

    // stats = new Stats();
    // container.appendChild(stats.dom);

    renderer.domElement.addEventListener('mousemove', onMouseMove);
}

//

function onMouseMove(e) {

    mouse.x = e.clientX;
    mouse.y = e.clientY;

}

function animate() {
    requestAnimationFrame(animate);

    render();
    // stats.update();
}

function createControls(camera: THREE.Camera, target: HTMLElement) {
    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.rotateSpeed = 1.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;

    const controls = new OrbitControls(camera, target)
    controls.target.set(0, 1, 0)
    controls.minDistance = 800
    controls.maxDistance = 2000
    // minZoom: number;
    // maxZoom: number;
    // controls.minPolarAngle = Math.PI / 2
    // minPolarAngle: number;
    // maxPolarAngle: number;
    // controls.minAzimuthAngle = Math.PI
    // maxAzimuthAngle: number;
    // enableDamping: boolean;
    // dampingFactor: number;
    controls.enableZoom = true
    // zoomSpeed: number;
    // enableRotate: boolean;
    // rotateSpeed: number;
    controls.enablePan = true
    // panSpeed: number;
    // screenSpacePanning: boolean;
    // keyPanSpeed: number;
    controls.autoRotate = false
    controls.autoRotateSpeed = 0.3
    controls.update()

    return controls
}

function render() {
    controls.update()

    const selected = picker.pick(mouse.x, mouse.y)
    if (!selected) {
        highlightBox.visible = false
    } else {
        const [dir, item] = selected
        highlightBox.visible = true
        highlightBox.position.copy(item.position)
        highlightBox.scale.copy(item.scale).add(selectedItemScaleOffset)

        // console.log(selected)
    }

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // render object id scene
    // renderer.render(pickingScene, camera)
}

function box(width: number, height: number, depth: number) {
    width = width * 0.5
    height = height * 0.5
    depth = depth * 0.5

    var geometry = new THREE.BufferGeometry();
    var position = [];

    position.push(
        - width, - height, - depth,
        - width, height, - depth,

        - width, height, - depth,
        width, height, - depth,

        width, height, - depth,
        width, - height, - depth,

        width, - height, - depth,
        - width, - height, - depth,

        - width, - height, depth,
        - width, height, depth,

        - width, height, depth,
        width, height, depth,

        width, height, depth,
        width, - height, depth,

        width, - height, depth,
        - width, - height, depth,

        - width, - height, - depth,
        - width, - height, depth,

        - width, height, - depth,
        - width, height, depth,

        width, height, - depth,
        width, height, depth,

        width, - height, - depth,
        width, - height, depth
    );

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));

    return geometry;

}