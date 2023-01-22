import { randomColor } from '@/opla'
import * as THREE from 'three'
import { PickboxBuilder } from './pickbox-builder'

const normalMatrix = new THREE.Matrix3(); // create once and reuse
const worldNormal = new THREE.Vector3(); // create once and reuse

export class PlanePicker {
    private raycaster = new THREE.Raycaster()
    private objects: THREE.Object3D[]

    constructor(
        private camera: THREE.Camera,
        // private objects: THREE.Object3D[],
    ) {
    }

    public getObject() {
        const GRID_SIZE = 200
        const s = GRID_SIZE * 10
        const p = GRID_SIZE * 5

        this.objects = []
        const g = new THREE.Group()

        const planeX = createObstaclePlane(0xff0000, s)
        planeX.name = "OplaPlaneX"
        planeX.userData.colorId = randomColor()
        planeX.position.add(new THREE.Vector3(p, 0, s))
        planeX.rotateY(Math.PI / 2);
        // planeX.position.set(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2)
        this.objects.push(planeX)
        g.add(planeX);

        const planeY = createObstaclePlane(0x00ff00, s)
        planeY.name = "OplaPlaneY"
        planeY.userData.colorId = randomColor()
        planeY.position.add(new THREE.Vector3(s, -p, s))
        planeY.rotateX(-Math.PI / 2);
        // planeY.position.set(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2)
        this.objects.push(planeY)
        g.add(planeY);

        const planeZ = createObstaclePlane(0x0000ff, s)
        planeZ.name = "OplaPlaneZ"
        planeZ.userData.colorId = randomColor()
        planeZ.position.add(new THREE.Vector3(s, 0, p))
        planeZ.rotateZ(Math.PI / 2);
        // planeZ.position.set(-GRID_SIZE / 2, -GRID_SIZE / 2, -GRID_SIZE / 2)
        this.objects.push(planeZ)
        g.add(planeZ);

        g.position.add(new THREE.Vector3(-p, p, -p))

        return g
    }

    public pick(pointer: THREE.Vector2, objects = this.objects) {
        this.raycaster.setFromCamera(pointer, this.camera)
        const intersects = this.raycaster.intersectObjects(objects)

        for (let i = 0; i < intersects.length; i++) {
            const obj = intersects[i]
            const normal = obj.face.normal.clone()

            normalMatrix.getNormalMatrix(obj.object.matrixWorld)

            worldNormal.copy(normal).applyMatrix3(normalMatrix).normalize()

            return [obj.point, worldNormal]
        }

        return null
    }
}

function createObstaclePlane(color: number, size: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size);
    geometry.computeBoundingBox()
    const material = new THREE.MeshBasicMaterial({
        color,
        // side: THREE.DoubleSide,
        // side: THREE.BackSide,
        opacity: 0.75,
    });
    const plane = new THREE.Mesh(geometry, material);
    return plane;
}
