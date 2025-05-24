import React, { useMemo, createContext, useState, useContext } from 'react';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';

export enum WalkControls {
    forward = 'forward',
    backward = 'backward',
    left = 'left',
    right = 'right',
    jump = 'jump',
    run = 'run',
    use = 'use',
    altUse = 'altUse',

    brake = 'brake',
    reset = 'reset',
}

const walkControlKeys = [
    { name: WalkControls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: WalkControls.backward, keys: ['ArrowDown', 'KeyS'] },
    { name: WalkControls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: WalkControls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: WalkControls.run, keys: ['Shift'] },
    { name: WalkControls.jump, keys: ['Space'] },
    { name: WalkControls.use, keys: ['KeyE'] },
    { name: WalkControls.altUse, keys: ['KeyQ'] },
    { name: WalkControls.reset, keys: ['KeyR'] },
]


const controlSchemes = {
    simple: walkControlKeys,
    fps: walkControlKeys,
    none: [],
}

export type ControlName = WalkControls;

const ControlSchemeContext = createContext<{
    scheme: keyof typeof controlSchemes;
    setScheme: (scheme: keyof typeof controlSchemes) => void;
}>({
    scheme: 'simple',
    setScheme: () => { },
});

export const useControlScheme = () => useContext(ControlSchemeContext);

function Controls({ children }: { children: React.ReactNode }) {
    const [controlScheme, setControlScheme] = useState<keyof typeof controlSchemes>('simple');
    const map = useMemo<KeyboardControlsEntry<ControlName>[]>(() => [
        ...(controlSchemes[controlScheme])
    ], [controlScheme])

    return (
        <ControlSchemeContext.Provider value={{
            scheme: controlScheme,
            setScheme: setControlScheme
        }}>
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 100,
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '5px',
                color: 'white'
            }}>controls active
            </div>
            <KeyboardControls map={map}>
                {children}
            </KeyboardControls>
        </ControlSchemeContext.Provider>
    );
}

export default Controls;
