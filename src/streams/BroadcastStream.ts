import {Writable, Transform} from "stream";

export class BroadcastStream extends Transform {
    constructor(bufferSize = 2) {
        super({
            objectMode: true,
            highWaterMark: bufferSize
        });
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        this.push(chunk);
        callback();
    }

    pipeWithClientStream(destination: Writable){
        this.pipe(destination, {end: false});
        destination.on('close', () => {
            this.unpipe(destination);
        });
    }
}