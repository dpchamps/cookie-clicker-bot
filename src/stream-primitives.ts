import {Writable, Readable} from "stream";

export class ScreenShotStream extends Writable {
    buffer: Array<Buffer>;
    bufferSize: number
    connections: Set<Readable> = new Set();

    constructor(bufferSize = 1, options = {}) {
        super(options);
        this.buffer = [];
        this.bufferSize = bufferSize;
        this.cork()
    }

    // Emit the new image to all connected listeners
    emitNewImage(imageData: Buffer) {
        for (const listener of this.connections) {
            listener.push(imageData)
        }
    }

    // Method to create a new readable stream for a client
    createClientStream() {
        const clientStream = new Readable({
            read() {}  // No-op, as we push data to it directly
        });

        // Send the last 5 images in the buffer to the new client
        for (const image of this.buffer) {
            clientStream.push(image);
        }

        // Add the client stream to the list of listeners
        this.connections.add(clientStream);

        // Remove the client stream when it ends or is destroyed
        clientStream.on('close', () => {
            console.log(`client stream closed. remaining connections: ${this.connections.size}`);
            this.connections.delete(clientStream);
            if(this.connections.size === 0){
                console.log("corking");
                this.cork();
            }
        });

        return clientStream;
    }

    pipeWithClientStream(destination: Writable){
        this.uncork();
        const client = this.createClientStream();
        client.pipe(destination, {end: false});
        destination.on('close', () => {
            console.log("ws stream closed")
            client.unpipe(destination);
            client.destroy();
        });
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        if (this.buffer.length >= this.bufferSize) {
            this.buffer.shift();  // Remove the oldest image
        }
        this.buffer.push(chunk);
        this.emitNewImage(chunk);
        callback();
    }
}

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