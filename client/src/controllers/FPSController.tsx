import { PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useMemo } from 'react'
import * as THREE from 'three'

// Define keyboard key constants
const KEYS = {
    w: 87,
    a: 65,
    s: 83,
    d: 68,
}

// Interface for input state
interface InputState {
    leftButton: boolean;
    rightButton: boolean;
    mouseXDelta: number;
    mouseYDelta: number;
    mouseX: number;
    mouseY: number;
}

class InputController {
    private target_: HTMLElement | Document;
    private current_: InputState = {
        leftButton: false,
        rightButton: false,
        mouseXDelta: 0,
        mouseYDelta: 0,
        mouseX: 0,
        mouseY: 0
    };
    private previous_: InputState | null = null;
    private keys_: Record<number, boolean> = {};
    private previousKeys_: Record<number, boolean> = {};

    constructor(target?: HTMLElement) {
        this.target_ = target || document
        this.initialize_()
    }

    initialize_(): void {
        this.current_ = {
            leftButton: false,
            rightButton: false,
            mouseXDelta: 0,
            mouseYDelta: 0,
            mouseX: 0,
            mouseY: 0
        }
        this.previous_ = null
        this.keys_ = {}
        this.previousKeys_ = {}
        this.target_.addEventListener('click', (e) => this.onClick_(e as MouseEvent), false)
        this.target_.addEventListener(
            'mousedown',
            (e) => this.onMouseDown_(e as MouseEvent),
            false
        )
        this.target_.addEventListener(
            'mousemove',
            (e) => this.onMouseMove_(e as MouseEvent),
            false
        )
        this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e as MouseEvent), false)
        document.addEventListener('keydown', (e) => this.onKeyDown_(e), false)
        document.addEventListener('keyup', (e) => this.onKeyUp_(e), false)
    }

    onClick_(e: MouseEvent): void {
        if (this.target_ instanceof HTMLElement) {
            this.target_.requestPointerLock()
        }
    }

    onMouseMove_(e: MouseEvent): void {
        if (document.pointerLockElement !== this.target_) {
            this.current_.mouseXDelta = 0
            this.current_.mouseYDelta = 0

            return
        }

        this.current_.mouseXDelta = e.movementX
        this.current_.mouseYDelta = e.movementY
    }

    onMouseDown_(e: MouseEvent): void {
        this.onMouseMove_(e)

        switch (e.button) {
            case 0: {
                this.current_.leftButton = true
                break
            }
            case 2: {
                this.current_.rightButton = true
                break
            }
        }
    }

    onMouseUp_(e: MouseEvent): void {
        this.onMouseMove_(e)

        switch (e.button) {
            case 0: {
                this.current_.leftButton = false
                break
            }
            case 2: {
                this.current_.rightButton = false
                break
            }
        }
    }

    onKeyDown_(e: KeyboardEvent): void {
        this.keys_[e.keyCode] = true
    }

    onKeyUp_(e: KeyboardEvent): void {
        this.keys_[e.keyCode] = false
    }

    key(keyCode: number): boolean {
        return !!this.keys_[keyCode]
    }

    isReady(): boolean {
        return this.previous_ !== null
    }

    getMouseXDelta(): number {
        return this.current_.mouseXDelta
    }

    getMouseYDelta(): number {
        return this.current_.mouseYDelta
    }

    update(_: number): void {
        this.current_.mouseXDelta = 0
        this.current_.mouseYDelta = 0
    }
}

class FirstPersonCamera {
    private camera_: THREE.PerspectiveCamera;
    private input_: InputController;
    private rotation_: THREE.Quaternion;
    private translation_: THREE.Vector3;
    private phi_: number;
    private phiSpeed_: number;
    private theta_: number;
    private thetaSpeed_: number;
    private headBobActive_: boolean;
    private headBobTimer_: number;

    constructor(camera: THREE.PerspectiveCamera, canvas: HTMLElement) {
        this.camera_ = camera
        this.input_ = new InputController(canvas)
        this.rotation_ = new THREE.Quaternion()
        this.translation_ = new THREE.Vector3().copy(camera.position).setY(0.9)
        this.phi_ = 0
        this.phiSpeed_ = 0.85
        this.theta_ = 0
        this.thetaSpeed_ = 0.85
        this.headBobActive_ = false
        this.headBobTimer_ = 0
    }

    update(timeElapsedS: number): void {
        this.updateRotation_(timeElapsedS)
        this.updateCamera_(timeElapsedS)
        this.updateTranslation_(timeElapsedS)
        this.updateHeadBob_(timeElapsedS)
        this.input_.update(timeElapsedS)
    }

    updateCamera_(_: number): void {
        this.camera_.quaternion.copy(this.rotation_)
        this.camera_.position.copy(this.translation_)
        this.camera_.position.y += Math.sin(this.headBobTimer_ * 20) * 0.1

        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyQuaternion(this.rotation_)

        forward.multiplyScalar(100)
        forward.add(this.translation_)
    }

    updateHeadBob_(timeElapsedS: number): void {
        if (this.headBobActive_) {
            const wavelength = Math.PI
            const nextStep =
                1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength)
            const nextStepTime = (nextStep * wavelength) / 10
            this.headBobTimer_ = Math.min(
                this.headBobTimer_ + timeElapsedS,
                nextStepTime
            )

            if (this.headBobTimer_ == nextStepTime) {
                this.headBobActive_ = false
            }
        }
    }

    updateTranslation_(timeElapsedS: number): void {
        const forwardVelocity =
            (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0)
        const strafeVelocity =
            (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0)

        const qx = new THREE.Quaternion()
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_)

        const forward = new THREE.Vector3(0, 0, -1)
        forward.applyQuaternion(qx)
        forward.multiplyScalar(forwardVelocity * timeElapsedS * 10)

        const left = new THREE.Vector3(-1, 0, 0)
        left.applyQuaternion(qx)
        left.multiplyScalar(strafeVelocity * timeElapsedS * 10)

        this.translation_.add(forward)
        this.translation_.add(left)

        if (forwardVelocity != 0 || strafeVelocity != 0) {
            this.headBobActive_ = true
        }
    }

    updateRotation_(timeElapsedS?: number): void {
        const xh = this.input_.getMouseXDelta() / window.innerWidth
        const yh = this.input_.getMouseYDelta() / window.innerHeight

        this.phi_ += -xh * this.phiSpeed_
        this.theta_ = THREE.MathUtils.clamp(
            this.theta_ + -yh * this.thetaSpeed_,
            -Math.PI / 3,
            Math.PI / 3
        )

        const qx = new THREE.Quaternion()
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_)
        const qz = new THREE.Quaternion()
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_)

        const q = new THREE.Quaternion()
        q.multiply(qx)
        q.multiply(qz)

        this.rotation_.copy(q)
    }
}


const FPSController = () => {
    const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
    const gl = useThree((s) => s.gl)

    const camControl = useMemo(() => {
        return new FirstPersonCamera(camera, gl.domElement)
    }, [camera, gl])

    useFrame((s) => {
        camControl.update(s.clock.getDelta() * 4)
    })

    return (
        <>
            <PerspectiveCamera position={[0, 0, 5]} makeDefault fov={22} />
        </>
    )
}

export default FPSController