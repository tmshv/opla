import * as THREE from 'three';

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { randomColor, createOplaSystem, OplaSystem, OplaBlock, OplaGrid } from './opla';

var container, stats;
var camera, scene, renderer;
var highlightBox;
let oplaGrid: OplaGrid
let controls: OrbitControls

let picker: ScenePicker<[string, BlockDef]>

var mouse = new THREE.Vector2();
let selectedItemScaleOffset = new THREE.Vector3(2, 2, 2);
const directionName = ['1-0', '1-1', 'top', 'bottom', '2-0', '2-1']
const directionNorm = new Map([
    ['1-0', new THREE.Vector3(1, 0, 0)],
    ['1-1', new THREE.Vector3(-1, 0, 0)],
    ['2-0', new THREE.Vector3(0, 0, 1)],
    ['2-1', new THREE.Vector3(0, 0, -1)],
    ['top', new THREE.Vector3(0, 1, 0)],
    ['bottom', new THREE.Vector3(0, -1, 0)],
])
const blockOffset = new THREE.Vector3(-500, 0, -500)
const blockScale = 100

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
        const coordY = y * window.devicePixelRatio | 0
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

type BlockDef = {
    block: OplaBlock,
    mesh: THREE.Mesh,
    pick: THREE.BoxBufferGeometry,
    pickColors: BoxColors,
    position: THREE.Vector3,
    scale: THREE.Vector3,
}
function createBoxes(opla: OplaSystem): BlockDef[] {
    return opla.blocks.map(block => {
        const [position, scale] = opla.grid.getCellTransform(block.cellLocation, blockScale, blockOffset)
        const matrix = block.createMatrix(opla.grid, blockScale, blockOffset)

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
        ]
        const pick = new THREE.BoxBufferGeometry()
        pick.applyMatrix4(matrix)
        // give the geometry's vertices a color corresponding to the "id"
        applyVertexColorsToBoxFaces(pick, pickColors)

        return {
            block,
            // material,
            // geometry,
            mesh,
            // matrix,
            pick,
            pickColors,
            position,
            // rotation,
            scale,
            // g: lineSegments,
        }
    })
}

function init() {
    const opla = createOplaSystem()
    oplaGrid = opla.grid
    let boxes = createBoxes(opla)

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(
        799.2459975462338,
        520.3577626459123,
        983.7522332589459,
    )

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

    highlightBox = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshBasicMaterial({
            color: 0xdd3300,
            transparent: true,
            opacity: 0.25,
        })
    )

    // let geometryBox = box(scale.x, scale.y, scale.z)
    // const dashScale = 0.1
    // let lineMaterial = new THREE.LineDashedMaterial({
    //     color: 0x333333,
    //     linewidth: 5, // in pixels
    //     // dashSize: 3 * dashScale,
    //     // gapSize: 1 * dashScale,
    // })
    // // let lineMaterial = new LineMaterial({
    // //     color: 0x330033,
    // //     // linewidth: 5, // in pixels
    // //     // vertexColors: true,
    // //     //resolution:  // to be set by renderer, eventually
    // //     // dashed: false,
    // // })
    // let geometryBox = box(1, 1, 1)
    // let lineSegments = new THREE.LineSegments(geometryBox, lineMaterial)
    // // lineSegments.applyMatrix4(matrix)
    // lineSegments.computeLineDistances()
    // highlightBox = lineSegments

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

    picker = new ScenePicker(camera, renderer)
    boxes.forEach(item => {
        item.pickColors.forEach((color, i) => {
            picker.setItem(color.getHex(), [directionName[i], item])
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

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
}

function onMouseMove(e: MouseEvent) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function onClick(e: MouseEvent) {
    const x = e.clientX
    const y = e.clientY

    const selected = picker.pick(x, y)
    if (!selected) {
        return
    }

    const [dir, def] = selected
    console.log(e.type, def.block)
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
    controls.target.set(
        -157.3899553540499,
        110.17876538143562,
        53.34107147450705,
    )
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

function nextBlockPosition(grid: OplaGrid, dir: string, def: BlockDef) {
    const v = directionNorm
        .get(dir)
        .clone()
    const cell = def.block.cellLocation
        .clone()
        .add(v)

    // next cell is out of grid bounds
    if (cell.x < 0 || cell.y < 0 || cell.z < 0) {
        return [null, null]
    }

    return grid.getCellTransform(cell, blockScale, blockOffset)
}

function currentBlockPosition(def: BlockDef) {
    return [def.position, def.scale]
}

function render() {
    controls.update()

    const selected = picker.pick(mouse.x, mouse.y)
    if (!selected) {
        highlightBox.visible = false
    } else {
        const [dir, def] = selected
        // const [pos, scale] = nextBlockPosition(oplaGrid, dir, def)
        const [pos, scale] = currentBlockPosition(def)
        if (pos) {
            highlightBox.visible = true
            highlightBox.position.copy(pos)
            highlightBox.scale.copy(scale).add(selectedItemScaleOffset)
        }
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