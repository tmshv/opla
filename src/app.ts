import * as THREE from 'three';

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { randomColor, createOplaSystem, OplaSystem, OplaBlock, OplaGrid } from './opla';
import { ScenePicker } from './lib/pick'
import { AppController } from './app/controller';

var container, stats;
var camera;
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
var highlightBox;
let sys: OplaSystem
let controls: OrbitControls

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

export function runApp(ctrl: AppController, elem: HTMLElement) {
    // const opla = createOplaSystem()
    container = elem

    init()
    initOplaSystem(ctrl.opla)
    setupController(ctrl)

    animate()

    return ctrl
}

function setupController(ctrl: AppController) {
    // const click = fromEvent(renderer.domElement, 'click')
    // click.pipe(map(x => {
    //     console.log(x);

    //     return x
    // }))

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
    scene.fog = new THREE.Fog(0xeeeeff, 1250, 2500)

    var gridHelper = new THREE.GridHelper(1000, 20)
    scene.add(gridHelper)

    scene.add(new THREE.AmbientLight(0x555555));

    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    scene.add(light);

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

    controls = createControls(camera, renderer.domElement)

    // stats = new Stats();
    // container.appendChild(stats.dom);

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
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
    block.blockType = Math.random() < 0.1 ? 'closed' : 'open'

    sys.addBlock(block)
    cleanScene()
    initOplaSystem(sys)
}

function onSelectBlockAtCoord(x: number, y: number) {
    const selected = picker.pick(x, y)
    if (!selected) {
        return
    }

    const [dir, def] = selected
    console.log(def)

    // test

    const cell = def.block.cellLocation

    if (dir === 'top') {
        sys.grid.axisY[cell.y] += Math.random()
    }
    if (dir === 'bottom') {
        sys.grid.axisY[cell.y] -= Math.random()
    }

    if (dir === '1-0') {
        sys.grid.axisX[cell.x] += Math.random()
    }
    if (dir === '1-1') {
        sys.grid.axisX[cell.x] -= Math.random()
    }

    if (dir === '2-0') {
        sys.grid.axisZ[cell.z] += Math.random()
    }
    if (dir === '2-1') {
        sys.grid.axisZ[cell.z] -= Math.random()
    }
    // sys.grid.axisX[cell.x] = 1 + Math.random()
    // sys.grid.axisX[cell.x] = 1 + Math.random()

    cleanScene()
    initOplaSystem(sys)
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
        highlightBox.visible = true
        highlightBox.position.copy(pos)
        highlightBox.scale.copy(scale).add(selectedItemScaleOffset)
    }
}

function handleHightlightBoxOnAdd(selected: [string, BlockDef]) {
    const [dir, def] = selected
    const [pos, scale] = nextBlockPosition(sys.grid, dir, def)
    if (pos) {
        highlightBox.visible = true
        highlightBox.position.copy(pos)
        highlightBox.scale.copy(scale).add(selectedItemScaleOffset)
    }
}

function render() {
    controls.update()

    // console.log(camera.position)
    // console.log(controls.target)

    const selected = picker.pick(mouse.x, mouse.y)
    if (!selected) {
        highlightBox.visible = false
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