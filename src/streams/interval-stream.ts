import {Readable} from "stream";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function* executeFnWithDelay<T>(fn: () => Promise<T>|T, ms: number){
    while(true){
        await delay(ms);
        console.info("Taking Screenshot");
        yield await fn();
    }
}

export const createIntervalStream = <T>(fn: () => Promise<T>|T, ms: number) => {
    return Readable.from(executeFnWithDelay(fn, ms));
};