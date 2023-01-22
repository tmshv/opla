import { Camera } from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

export class TransformController {
	public control: TransformControls

	constructor(camera: Camera, target: HTMLElement) {
		this.control = new TransformControls(camera, target)
	}

	public onChange() {

	}
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