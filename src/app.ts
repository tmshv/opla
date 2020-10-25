import * as THREE from 'three';

// import Stats from './jsm/libs/stats.module.js';

import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

var container, stats;
var camera, controls, scene, renderer;
var pickingData = [], pickingTexture, pickingScene;
var highlightBox;

var mouse = new THREE.Vector2();
var offset = new THREE.Vector3(10, 10, 10);

export function runApp(elem: HTMLElement) {
    container = elem
    init();
    animate();
}

function applyVertexColors(geometry, color) {
    let position = geometry.attributes.position;
    let colors = [];

    for (let i = 0; i < position.count; i++) {
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

function createBoxes(opla: any) {
    let matrix = new THREE.Matrix4();
    let quaternion = new THREE.Quaternion();
    let color = new THREE.Color();

    // let result = []

    const { grid, items } = opla
    const result = items.map(item => {
        const { location } = item
        let gridScale = 100
        var position = new THREE.Vector3();
        position.x = location.x * gridScale
        position.y = location.y * gridScale
        position.z = location.z * gridScale
        // position.x = Math.random() * 10000 - 5000;
        // position.y = Math.random() * 6000 - 3000;
        // position.z = Math.random() * 8000 - 4000;

        var rotation = new THREE.Euler();
        // rotation.x = Math.random() * 2 * Math.PI;
        // rotation.y = Math.random() * 2 * Math.PI;
        // rotation.z = Math.random() * 2 * Math.PI;

        gridScale = 10
        var scale = new THREE.Vector3();
        // scale.x = Math.random() * 200 + 100;
        // scale.y = Math.random() * 200 + 100;
        // scale.z = Math.random() * 200 + 100;
        scale.x = grid.axisX[location.x] * gridScale
        scale.y = grid.axisX[location.y] * gridScale
        scale.z = grid.axisX[location.z] * gridScale
        let geometry = new THREE.BoxBufferGeometry();

        quaternion.setFromEuler(rotation);
        matrix.compose(position, quaternion, scale);

        geometry.applyMatrix4(matrix);

        // give the geometry's vertices a random color, to be displayed
        applyVertexColors(geometry, color.setHex(Math.random() * 0xffffff));
        return {
            geometry,
            position,
            rotation,
            scale,
        }
    })

    for (let i = 0; i < 50; i++) {
        continue
        let geometry = new THREE.BoxBufferGeometry();

        var position = new THREE.Vector3();
        position.x = Math.random() * 10000 - 5000;
        position.y = Math.random() * 6000 - 3000;
        position.z = Math.random() * 8000 - 4000;

        var rotation = new THREE.Euler();
        rotation.x = Math.random() * 2 * Math.PI;
        rotation.y = Math.random() * 2 * Math.PI;
        rotation.z = Math.random() * 2 * Math.PI;

        var scale = new THREE.Vector3();
        scale.x = Math.random() * 200 + 100;
        scale.y = Math.random() * 200 + 100;
        scale.z = Math.random() * 200 + 100;

        quaternion.setFromEuler(rotation);
        matrix.compose(position, quaternion, scale);

        geometry.applyMatrix4(matrix);

        // give the geometry's vertices a random color, to be displayed
        applyVertexColors(geometry, color.setHex(Math.random() * 0xffffff));
        result.push({
            position,
            rotation,
            scale,
            geometry,
        });
    }

    return result
}

function createOplaBlocks() {
    const items = createGrid3(10, 10, 10, (x, y, z, i) => {
        if (Math.random() < 0.95) {
            return null
        }

        return {
            id: i,
            location: {
                x,
                y,
                z,
            },
            props: {
                // width: 10,
                // height: 10,
                // depth: 10,
            }
        }
    })
    const grid = {
        axisX: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        axisY: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        axisZ: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    }

    return {
        grid,
        items,
    }
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

function createScene(conf: { opla: any }) {
    pickingScene = new THREE.Scene();
    pickingTexture = new THREE.WebGLRenderTarget(1, 1);

    var pickingMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    var defaultMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, vertexColors: true, shininess: 0 });

    var color = new THREE.Color();

    let boxes = createBoxes(conf.opla)
    let geometriesDrawn = boxes.map(({ geometry }) => geometry)
    let geometriesPicking = [];
    boxes.forEach((item, i) => {
        let { geometry, position, rotation, scale } = item
        geometry = geometry.clone();

        // give the geometry's vertices a color corresponding to the "id"
        applyVertexColors(geometry, color.setHex(i));
        geometriesPicking.push(geometry);

        pickingData[i] = {
            position,
            rotation,
            scale,
        };
    })

    let objects = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(geometriesDrawn), defaultMaterial);
    let pickingObjects = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(geometriesPicking), pickingMaterial);

    return {
        objects,
        pickingObjects,
    }
}

function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    pickingScene = new THREE.Scene();
    pickingTexture = new THREE.WebGLRenderTarget(1, 1);

    scene.add(new THREE.AmbientLight(0x555555));

    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    scene.add(light);

    const opla = createOplaBlocks()

    let { objects, pickingObjects } = createScene({
        opla
    })
    scene.add(objects)
    pickingScene.add(pickingObjects)

    highlightBox = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshLambertMaterial({ color: 0xffff00 }
        ));
    scene.add(highlightBox);

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

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.update();

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

function pick() {

    //render the picking scene off-screen

    // set the view offset to represent just a single pixel under the mouse

    camera.setViewOffset(renderer.domElement.width, renderer.domElement.height, mouse.x * window.devicePixelRatio | 0, mouse.y * window.devicePixelRatio | 0, 1, 1);

    // render the scene

    renderer.setRenderTarget(pickingTexture);
    renderer.render(pickingScene, camera);

    // clear the view offset so rendering returns to normal

    camera.clearViewOffset();

    //create buffer for reading single pixel

    var pixelBuffer = new Uint8Array(4);

    //read the pixel

    renderer.readRenderTargetPixels(pickingTexture, 0, 0, 1, 1, pixelBuffer);

    //interpret the pixel as an ID

    var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
    var data = pickingData[id];

    if (data) {

        //move our highlightBox so that it surrounds the picked object

        if (data.position && data.rotation && data.scale) {

            highlightBox.position.copy(data.position);
            highlightBox.rotation.copy(data.rotation);
            highlightBox.scale.copy(data.scale).add(offset);
            highlightBox.visible = true;

        }

    } else {

        highlightBox.visible = false;

    }

}

function render() {

    controls.update()

    pick();

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

}
