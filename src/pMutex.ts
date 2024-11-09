
const createDeferred = <T = void>() => {
    let res: (x: T) => void = () => {};
    let rej: (x: unknown) => void = () => {};
    const p = new Promise<T>((innerRes, innerRej) => {
        res=innerRes
        rej=innerRej
    });

    return {
        res,
        rej,
        p
    }
}
export const createMutex = () => {
    let {res, p} = createDeferred();
    res();

    const setNextLock = () => {
        const {res: nextRes, p: nextP} = createDeferred();
        res = nextRes;
        p = nextP;
    }

    return async (fn: () => Promise<void>) => {
        await p;
        setNextLock();
        await fn();
        res();
    }
}