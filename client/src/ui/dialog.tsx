import { useDispatch, useSelector } from "react-redux";

function Dialog() {
    // const targetId = useSelector((state: RootState) => getCameraTarget(state));
    // const personObj = useSelector((state: RootState) => targetId ? selectPersonById(state, targetId) : undefined);

    // const endConversation = () => {
    //     if (personObj?.cameraTarget) dispatch(makeCameraTarget(undefined))
    // }

    // if (!personObj) return null

    return <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border p-2 flex flex-col items-center'>
        <div className='text-center p-2'>
            Hi there
        </div>
        {/* <button className="border px-1" onClick={() => endConversation()}>Next</button> */}
    </div>
}

export default Dialog