import * as THREE from 'three';

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { randomColor, createOplaSystem, OplaSystem, OplaBlock, OplaGrid } from './opla';
import { ScenePicker } from './lib/pick'
import { AppController } from './app/controller';
import { loadAssets } from './lib/assets';
import { OplaCursor } from './lib/cursor';
import { createControls } from './lib/three';
import { createBoxVertices } from './lib/geom';

var container, stats;
var camera;
let renderer: THREE.WebGLRenderer
let domRenderer
let scene: THREE.Scene
let sys: OplaSystem
let controls: OrbitControls

let hoverCursor: OplaCursor
let currentCursor: OplaCursor
let controller: AppController

let selectedBoxAxisX: CSS2DObject
let selectedBoxAxisY: CSS2DObject
let selectedBoxAxisZ: CSS2DObject

let tool = 'select'

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
// const blockOffset = new THREE.Vector3(-500, 0, -500)
const blockOffset = new THREE.Vector3(0, 0, 0)
const blockScale = 200

const materialLib = new Map([
    ['open', new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, opacity: 1 })],
    ['closed', new THREE.MeshPhongMaterial({ color: 0xccccdd, flatShading: true, vertexColors: false, shininess: 0 })],
])

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

function setupController(ctrl: AppController) {
    ctrl.subjects.cellDimension.subscribe(dim => {
        if (!currentCursor.isVisible()) {
            return
        }

        const cell = currentCursor.getCell()
        const grid = ctrl.opla.grid

        if (grid.isCellDimensionEqual(cell, dim)) {
            return
        }

        console.log('set axis', cell, grid.getCellDimensions(cell), dim)

        grid.setCellDimension(cell, dim)

        cleanScene()
        initOplaSystem(ctrl.opla)
    })

    const x = ctrl.subjects.tool.subscribe(newTool => {
        tool = newTool

        // renderer.domElement.addEventListener('click', onClick)
    })
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

function scaleToAsset(name: string, value: number) {
    return `${name}_${value}mm`
}

function createBlockMesh(block: OplaBlock) {
    // const matrix = block.createScaleMatrix(controller.opla.grid, blockScale, blockOffset)
    // const material = materialLib.get(block.blockType)
    // const geometry = new THREE.BoxBufferGeometry()
    // geometry.applyMatrix4(matrix)

    const [position, scale] = controller.opla.grid.getCellTransform(block.cellLocation, blockScale, blockOffset)
    const s = scale.clone().multiplyScalar(0.5)
    const sx = s.x
    const sy = s.y
    const sz = s.z

    const g = new THREE.Group()
    g.position.copy(position)

    // nodes

    createBoxVertices(s).forEach(position => {
        let n = controller.createAsset('node_25mm')
        n.position.copy(position)
        g.add(n)
    })

    // y edges (vertical)

    let asset = scaleToAsset('edge', scale.y)
    let n = controller.createAsset(asset)
    n.position.set(-sx, 0, -sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.position.set(-sx, 0, sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.position.set(sx, 0, -sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.position.set(sx, 0, sz)
    g.add(n)

    // z edges

    // asset = 'edge_200mm'
    asset = scaleToAsset('edge', scale.z)
    n = controller.createAsset(asset)
    n.rotateX(Math.PI / 2)
    n.position.set(sx, -sy, 0)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateX(Math.PI / 2)
    n.position.set(sx, sy, 0)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateX(Math.PI / 2)
    n.position.set(-sx, sy, 0)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateX(Math.PI / 2)
    n.position.set(-sx, -sy, 0)
    g.add(n)

    // x edges

    // asset = 'edge_200mm'
    asset = scaleToAsset('edge', scale.x)
    n = controller.createAsset(asset)
    n.rotateZ(Math.PI / 2)
    n.position.set(0, -sy, -sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateZ(Math.PI / 2)
    n.position.set(0, sy, sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateZ(Math.PI / 2)
    n.position.set(0, -sy, sz)
    g.add(n)

    n = controller.createAsset(asset)
    n.rotateZ(Math.PI / 2)
    n.position.set(0, sy, -sz)
    g.add(n)

    return g
}

type BlockDef = {
    block: OplaBlock,
    // mesh: THREE.Mesh,
    mesh: THREE.Group,
    pick: THREE.BoxBufferGeometry,
    pickColors: BoxColors,
    position: THREE.Vector3,
    scale: THREE.Vector3,
}
function createBoxes(opla: OplaSystem): BlockDef[] {
    return opla.blocks.map(block => {
        const mesh = createBlockMesh(block)

        const [position, scale] = opla.grid.getCellTransform(block.cellLocation, blockScale, blockOffset)
        const matrix = block.createMatrix(opla.grid, blockScale, blockOffset)
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
        applyVertexColorsToBoxFaces(pick, pickColors) // give the geometry's vertices a color corresponding to the "id"

        return {
            block,
            mesh,
            pick,
            pickColors,
            position,
            scale,
        }
    })
}

function initScene() {

}

function cleanScene() {
    const objects = scene.getObjectByName('opla-group')
    scene.remove(objects)
}

function initOplaSystem(opla: OplaSystem) {
    sys = opla
    let boxes = createBoxes(opla)

    let objects = new THREE.Group()
    objects.name = 'opla-group'

    for (let item of boxes) {
        objects.add(item.mesh)
    }
    scene.add(objects)

    createPicker(boxes)

    const cell = currentCursor.getCell()
    const [pos, scale] = controller.opla.grid.getCellTransform(cell, blockScale, blockOffset)
    currentCursor.setup(cell, pos, scale)
}

function createLabel(label: string) {
    const elem = document.createElement('div')
    elem.className = 'label'
    elem.textContent = label
    elem.style.marginTop = '-1em'

    return new CSS2DObject(elem)
}

function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(
        799.2459975462338,
        520.3577626459123,
        983.7522332589459,
    )

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeeeeff)
    // scene.fog = new THREE.Fog(0xeeeeff, 1250, 2500)

    var gridHelper = new THREE.GridHelper(1000, 20)
    scene.add(gridHelper)

    scene.add(new THREE.AmbientLight(0x555555));

    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    scene.add(light);

    hoverCursor = new OplaCursor({
        color: 0xdd3300,
        opacity: 0.25,
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
    scene.add(currentCursor.getMesh())

    const cc = hoverCursor.getMesh()

    selectedBoxAxisX = createLabel('x')
    cc.add(selectedBoxAxisX)

    selectedBoxAxisY = createLabel('y')
    cc.add(selectedBoxAxisY)

    selectedBoxAxisZ = createLabel('z')
    cc.add(selectedBoxAxisZ)

    renderer = new THREE.WebGLRenderer({ antialias: true });
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

    // stats = new Stats();
    // container.appendChild(stats.dom);

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
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
    picker = new ScenePicker(camera, renderer)
    boxes.forEach(item => {
        item.pickColors.forEach((color, i) => {
            picker.setItem(color.getHex(), [directionName[i], item])
        })
    })

    const scene = new THREE.Scene()
    picker.setScene(scene)

    const picks = boxes.map(item => item.pick)
    if (picks.length > 0) {
        const pickingMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, flatShading: true })
        const pickingObjects = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(picks), pickingMaterial)
        scene.add(pickingObjects)
    }
}

function onMouseMove(e: MouseEvent) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function onClick(e: MouseEvent) {
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
    const [dir, def] = selected
    const cell = nextBlockCell(sys.grid, dir, def)
    if (!cell) {
        return
    }

    const block = sys.createBlock()
    block.cellLocation.copy(cell)
    block.blockType = 'closed'
    // block.blockType = Math.random() < 0.1 ? 'closed' : 'open'

    sys.addBlock(block)
    cleanScene()
    initOplaSystem(sys)
}

function onSelectBlockAtCoord(x: number, y: number) {
    const selected = picker.pick(x, y)
    if (!selected) {
        currentCursor.hide()
        return
    }

    const [dir, def] = selected
    const cell = def.block.cellLocation

    currentCursor.setup(cell, def.position, def.scale)
    currentCursor.show()

    const dim = sys.grid.getCellDimensions(cell)
    controller.setCellDimension(dim.x, dim.y, dim.z)
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
    const v = directionNorm
        .get(dir)
        .clone()
    const cell = def.block.cellLocation
        .clone()
        .add(v)

    // next cell is out of grid bounds
    if (cell.x < 0 || cell.y < 0 || cell.z < 0) {
        return null
    }

    return cell
}

function nextBlockPosition(grid: OplaGrid, dir: string, def: BlockDef) {
    const cell = nextBlockCell(grid, dir, def)
    if (!cell) {
        return [null, null]
    }

    return grid.getCellTransform(cell, blockScale, blockOffset)
}

function currentBlockPosition(def: BlockDef) {
    return [def.position, def.scale]
}

function handleHightlightBoxOnSelect(selected: [string, BlockDef]) {
    const [dir, def] = selected
    const [pos, scale] = currentBlockPosition(def)
    if (pos) {
        hoverCursor.setup(def.block.cellLocation, pos, scale)
        hoverCursor.show()

        const v = 1
        selectedBoxAxisX.position.set(v, 0, 0)
        selectedBoxAxisY.position.set(0, v, 0)
        selectedBoxAxisZ.position.set(0, 0, v)

        // earthLabel.position.set(0, EARTH_RADIUS, 0);
        // earthLabel.rotateY(Math.PI / 2)
    }
}

function handleHightlightBoxOnAdd(selected: [string, BlockDef]) {
    const [dir, def] = selected
    const [pos, scale] = nextBlockPosition(sys.grid, dir, def)
    if (pos) {
        hoverCursor.setup(def.block.cellLocation, pos, scale)
        hoverCursor.show()
    }
}

function render() {
    controls.update()

    // console.log(camera.position)
    // console.log(controls.target)

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

        // do not show hover cursor if it under visible selected cursor
        if (currentCursor.isVisible() && hoverCursor.getCell().equals(currentCursor.getCell())) {
            hoverCursor.hide()
        }
    }

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    domRenderer.render(scene, camera);
    // renderer.render(picker.getScene(), camera)
}
