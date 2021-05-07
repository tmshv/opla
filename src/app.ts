import * as THREE from 'three'

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { randomColor, createOplaSystem, OplaSystem, OplaBlock, OplaGrid } from './opla'
import { ScenePicker } from './lib/pick'
import { AppController } from './app/controller'
import { loadAssets } from './lib/assets'
import { OplaCursor } from './lib/cursor'
import { createControls } from './lib/three'
import { createBoxVertices, createOplaModel } from './lib/geom'

type BoxColors = [
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
    THREE.Color,
]

type BlockDef = {
    block: OplaBlock,
    // mesh: THREE.Mesh,
    model: THREE.Object3D,
    pick: THREE.Object3D,
    pickColors: BoxColors,
}

var container, stats;
var camera;
let renderer: THREE.WebGLRenderer
let domRenderer
let scene: THREE.Scene
let sys: OplaSystem
let controls: OrbitControls
let control: TransformControls
let mainLight: THREE.DirectionalLight

let controlIsActive = false

let hoverCursor: OplaCursor
let currentCursor: OplaCursor
let controller: AppController

let selectedBoxAxisX: CSS2DObject
let selectedBoxAxisY: CSS2DObject
let selectedBoxAxisZ: CSS2DObject

let tool = 'select'

let picker: ScenePicker<[string, BlockDef]>

let currentBlock: BlockDef
let defs: BlockDef[]

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
// const blockOffset = new THREE.Vector3(-500, 0, -500)
const blockOffset = new THREE.Vector3(0, 0, 0)
const blockScale = 200
const GRID_SIZE = 200

const materialLib = new Map([
    ['open', new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, opacity: 1 })],
    ['closed', new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true, vertexColors: false, shininess: 0 })],
])

// const hdrUrls = ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr']
// let hdrCubeMap: HDRCubeTextureLoader = new HDRCubeTextureLoader()
//     .setPath('./textures/cube/pisaHDR/')
//     .setDataType(THREE.UnsignedByteType)
//     .load(hdrUrls, function () {

//         hdrCubeRenderTarget = pmremGenerator.fromCubemap(hdrCubeMap);

//         hdrCubeMap.magFilter = THREE.LinearFilter;
//         hdrCubeMap.needsUpdate = true;

//     });

function hex(value: number) {
    const color = new THREE.Color()
    color.setHex(value)
    return color
}

export async function runApp(ctrl: AppController, elem: HTMLElement) {
    controller = ctrl
    // const opla = createOplaSystem()
    container = elem

    const lib = await loadOplaAssets([
        'node_25mm.glb',
        'edge_200mm.glb',
        'edge_400mm.glb',
        'edge_600mm.glb',
        'edge_800mm.glb',
    ])
    ctrl.setAssets(lib)

    init()
    initOplaSystem(ctrl.opla)
    setupController(ctrl)

    animate()

    return ctrl
}

function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(
        799.2459975462338,
        520.3577626459123,
        983.7522332589459,
    )

    scene = new THREE.Scene()
    // scene.background = new THREE.Color(0xeeeeff)
    // scene.fog = new THREE.Fog(0xeeeeff, 1250, 2500)

    var gridHelper = new THREE.GridHelper(2000, 10)
    const gg = new THREE.Group()
    gg.add(gridHelper)
    gg.position.set(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2)
    scene.add(gg)

    scene.add(new THREE.AmbientLight(0x555555));

    // const light = new THREE.SpotLight(0xffffff, 1.5)
    let light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.target.position.set(0, 0, 0)
    light.position.set(0, 100, 100)
    // light.position.copy(camera.position)
    // camera.add(light)
    scene.add(light)
    mainLight = light

    hoverCursor = new OplaCursor({
        color: 0xdd6600,
        opacity: 0.33,
        // opacity: 0.9,
        scaleOffset: selectedItemScaleOffset,
    })
    hoverCursor.hide()
    currentCursor = new OplaCursor({
        color: 0xdd00dd,
        opacity: 0.5,
        scaleOffset: selectedItemScaleOffset,
    })
    currentCursor.hide()

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


    scene.add(hoverCursor.getMesh())
    // scene.add(currentCursor.getMesh())

    const cc = hoverCursor.getMesh()

    selectedBoxAxisX = createLabel('x')
    // cc.add(selectedBoxAxisX)

    selectedBoxAxisY = createLabel('y')
    // cc.add(selectedBoxAxisY)

    selectedBoxAxisZ = createLabel('z')
    // cc.add(selectedBoxAxisZ)

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    domRenderer = new CSS2DRenderer()
    domRenderer.setSize(window.innerWidth, window.innerHeight)
    domRenderer.domElement.style.position = 'absolute'
    domRenderer.domElement.style.top = '0px'
    domRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(domRenderer.domElement)

    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.rotateSpeed = 1.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;

    controls = createControls(camera, renderer.domElement)
    control = initTC(camera, renderer.domElement)

    scene.add(control)

    // stats = new Stats();
    // container.appendChild(stats.dom);

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
}

function initOplaSystem(opla: OplaSystem) {
    sys = opla
    let boxes = opla.blocks.map(block => createBlockDef(opla, block))
    defs = boxes

    let objects = new THREE.Group()
    objects.name = 'opla-group'

    for (let item of boxes) {
        objects.add(item.model)
    }
    scene.add(objects)

    createPicker(boxes)
}

export function initTC(camera: THREE.Camera, target: HTMLElement) {
    const control = new TransformControls(camera, target)
    control.setMode('translate')
    // control.setTranslationSnap(GRID_SIZE)
    // control.setSpace('world')
    control.setSpace('local')
    // control.addEventListener('change', onTranformControlsChange)
    control.addEventListener('objectChange', onTranformControlsChange)
    // control.addEventListener('objectChange', (event) => {
    //     console.log('tc objectchange', event);
    // })
    control.addEventListener('dragging-changed', event => {
        controls.enabled = !event.value
    })

    control.addEventListener('mouseDown', event => {
        console.log('control down');

        controlIsActive = true
    })
    control.addEventListener('mouseUp', event => {
        console.log('control up');

        controlIsActive = false
    })

    return control
}

function onTranformControlsChange(event) {
    if (!currentBlock) {
        return
    }

    const b = currentBlock
    const cell = b.block.getCellPosition(b.pick.position, GRID_SIZE)
    b.pick.position.copy(cell)

    if (isBlockIntersects(currentBlock, defs)) {
        currentBlock.pick.position.copy(currentBlock.block.location)
        return
    }

    b.block.location.copy(cell)

    // const position = b.pick.position
    // b.block.setPos(b.pick.position, GRID_SIZE)
    // const position = b.block.location
    // b.pick.position.copy(position)
    // .clone()

    // currentCursor.setPositionFrom(position)
    // hoverCursor.setPositionFrom(position)
    // block.position.copy(position)
    b.model.position.copy(cell)

    render()
}

function isBlockIntersects(block: BlockDef, blocks: BlockDef[]): boolean {
    block.pick.updateMatrixWorld()
    const bbox = new THREE.Box3()
    bbox.setFromObject(block.pick)

    for (let other of blocks) {
        if (block === other) {
            continue
        }

        const o = new THREE.Box3()
        o.setFromObject(other.pick)

        if (bbox.intersectsBox(o)) {
            return true
        }
    }

    return false
}

function setupController(ctrl: AppController) {
    const x = ctrl.subjects.tool.subscribe(newTool => {
        tool = newTool

        // renderer.domElement.addEventListener('click', onClick)
    })
}

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

function createBlockMesh(block: OplaBlock) {
    // const mesh = createBlockForPicker(block)
    const mesh = createDummyBlock(block)
    return mesh
    // const group = new THREE.Object3D()
    // group.add(mesh)
    // mesh.scale.set(
    //     block.size.x * 200,
    //     block.size.y * 200,
    //     block.size.z * 200,
    // )
    // return group
    // return createDummyBlock(block)

    const g = createOplaModel(block.size, controller)
    g.position.copy(block.location)

    return g
}

// function createDummyBlock(block: OplaBlock) {
//     const box = new THREE.BoxBufferGeometry()
//     const material = new THREE.MeshLambertMaterial({
//         color: 0xffffff,
//         // flatShading: true,
//     });
//     const mesh = new THREE.Mesh(box, material)
//     mesh.position.copy(block.location)
//     mesh.scale.copy(block.size)

//     return mesh
// }

function createDummyBlock(block: OplaBlock) {
    let position = block.location.clone()
    let scale = block.size
        .clone()
        .multiplyScalar(GRID_SIZE)

    const s = 1
    const box = new THREE.BoxBufferGeometry(scale.x, scale.y, scale.z, s, s, s)

    // const pickingMaterial = new THREE.MeshBasicMaterial({
    const mat = new THREE.MeshLambertMaterial({
        // vertexColors: true,
        // flatShading: true,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
    })
    const mesh = new THREE.Mesh(box, mat)
    mesh.position.copy(position)
    // pick.scale.copy(scale)

    // wireframe
    var geo = new THREE.EdgesGeometry(mesh.geometry); // or WireframeGeometry
    // var geo = new THREE.WireframeGeometry(pick.geometry); // or WireframeGeometry
    var wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    var wireframe = new THREE.LineSegments(geo, wireframeMaterial)
    mesh.add(wireframe)

    return mesh
}

function createPickBox(position: THREE.Vector3, scale: THREE.Vector3): [THREE.Object3D, BoxColors] {
    const colors: BoxColors = [
        hex(randomColor()),
        hex(randomColor()),
        hex(randomColor()),
        hex(randomColor()),
        hex(randomColor()),
        hex(randomColor()),
    ]
    const box = new THREE.BoxBufferGeometry()
    applyVertexColorsToBoxFaces(box, colors) // give the geometry's vertices a color corresponding to the "id"

    const pickingMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        // flatShading: true,
    })
    const pick = new THREE.Mesh(box, pickingMaterial)
    pick.position.copy(position)
    pick.scale.copy(scale)

    return [pick, colors]
}

function createBlockDef(opla: OplaSystem, block: OplaBlock): BlockDef {
    const position = block.location.clone()
    const model = createBlockMesh(block)

    const scale = block.size
        .clone()
        .multiplyScalar(GRID_SIZE)
        .multiplyScalar(0.99)
    const [pick, pickColors] = createPickBox(position, scale)

    return {
        block,
        model,
        pick,
        pickColors,
    }
}

function cleanScene() {
    const objects = scene.getObjectByName('opla-group')
    scene.remove(objects)
}

function createLabel(label: string) {
    const elem = document.createElement('div')
    elem.className = 'label'
    elem.textContent = label
    elem.style.marginTop = '-1em'

    return new CSS2DObject(elem)
}

async function loadOplaAssets(files: string[]) {
    const items = await loadAssets(files)
    const lib = new Map<string, THREE.Object3D>()

    for (let gltf of items) {
        gltf.scene.traverse(child => {
            if (child.type !== 'Mesh') {
                return
            }

            child.scale.multiplyScalar(1000)
            lib.set(child.name, child)
        })
    }

    return lib
}

function createPicker(boxes: BlockDef[]) {
    const scene = new THREE.Scene()
    picker = new ScenePicker(camera, renderer)
    boxes.forEach(item => {
        item.pickColors.forEach((color, i) => {
            picker.setItem(color.getHex(), [directionName[i], item])
        })

        scene.add(item.pick)
    })

    picker.setScene(scene)
}

function onMouseMove(e: MouseEvent) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function onClick(e: MouseEvent) {
    console.log('global onclick')

    if (controlIsActive) {
        return
    }

    const x = e.clientX
    const y = e.clientY

    if (tool == 'select') {
        onSelectBlockAtCoord(x, y)
    }
    if (tool == 'add') {
        addBlockAtCell(x, y)
    }
    if (tool == 'remove') {
        removeBlockAtCoord(x, y)
    }
}

function addBlockAtCell(x: number, y: number) {
    const selected = picker.pick(x, y)
    if (!selected) {
        return
    }
    // const [dir, def] = selected
    // const cell = nextBlockCell(sys.grid, dir, def)
    // if (!cell) {
    //     return
    // }

    const block = sys.createBlock([200, 200, 200])
    block.blockType = 'closed'
    // block.blockType = Math.random() < 0.1 ? 'closed' : 'open'

    sys.addBlock(block)
    cleanScene()
    initOplaSystem(sys)
}

function onSelectBlockAtCoord(x: number, y: number) {
    if (!hoverCursor.isVisible()) {

        // control.attach(selected[1].pick)
        control.detach()
        control.enabled = false
        control.visible = false

        return
    }

    const selected = picker.pick(x, y)
    if (!selected) {
        // currentBlock = null
        currentCursor.hide()
        // control.enabled = false
        // control.visible = false
        return
    }

    currentBlock = selected[1]

    // allSelected[i].material.emissive.set(0xffffff);
    // const model = currentBlock.model as any
    // model.material.emissive.set(0xffffff)
    const model = currentBlock.model as THREE.Group
    // model.children.forEach((m: THREE.Mesh) => {
    //     // console.log(m.material)
    //     const material = m.material as THREE.Material
    //     material.emissive.set(0x666666)
    // })

    const [dir, def] = selected
    // const cell = def.block.cellLocation

    // currentCursor.setup(cell, def.position, def.scale)
    // currentCursor.show()

    control.attach(selected[1].pick)
    control.enabled = true
    control.visible = true

    // const dim = sys.grid.getCellDimensions(cell)
    // controller.setCellDimension(dim.x, dim.y, dim.z)
}

function removeBlockAtCoord(x: number, y: number) {
    const selected = picker.pick(x, y)
    if (!selected) {
        return
    }

    const [dir, def] = selected

    sys.removeBlock(def.block.id)
    cleanScene()
    initOplaSystem(sys)
}

function animate() {
    requestAnimationFrame(animate);

    render();
    // stats.update();
}

function nextBlockCell(grid: OplaGrid, dir: string, def: BlockDef) {
    // const v = directionNorm
    //     .get(dir)
    //     .clone()
    // const cell = def.block.cellLocation
    //     .clone()
    //     .add(v)

    // // next cell is out of grid bounds
    // if (cell.x < 0 || cell.y < 0 || cell.z < 0) {
    //     return null
    // }

    // return cell
}

function nextBlockPosition(grid: OplaGrid, dir: string, def: BlockDef) {
    // const cell = nextBlockCell(grid, dir, def)
    // if (!cell) {
    //     return [null, null]
    // }

    // return grid.getCellTransform(cell, blockScale, blockOffset)
}

function handleHightlightBoxOnSelect(selected: [string, BlockDef]) {
    const [dir, def] = selected

    const scale = def.block.size
        .clone()
        .multiplyScalar(GRID_SIZE)

    hoverCursor.setup(def.model.position, scale)
    hoverCursor.show()
}

function handleHightlightBoxOnAdd(selected: [string, BlockDef]) {
    // const [dir, def] = selected
    // const [pos, scale] = nextBlockPosition(sys.grid, dir, def)
    // if (pos) {
    //     hoverCursor.setup(pos, scale)
    //     hoverCursor.show()
    // }
}

function render() {
    controls.update()

    mainLight.position.copy(camera.position)
    // mainLight.target.position.copy(camera.target)

    const selected = picker.pick(mouse.x, mouse.y)
    if (!selected) {
        hoverCursor.hide()
    } else {
        if (tool === 'add') {
            handleHightlightBoxOnAdd(selected)
        }
        if (tool === 'remove') {
            handleHightlightBoxOnSelect(selected)
        }
        if (tool === 'select') {
            handleHightlightBoxOnSelect(selected)
        }
    }

    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
    // domRenderer.render(scene, camera)
    // renderer.render(picker.getScene(), camera)
}
