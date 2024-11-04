import {Writable, Readable} from "stream";

export class ScreenShotStream extends Writable {
    buffer: Array<Buffer>;
    bufferSize: number
    connections: Set<Readable> = new Set();

    constructor(bufferSize = 1, options = {}) {
        super(options);
        this.buffer = [];
        this.bufferSize = bufferSize;
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
            this.connections.delete(clientStream);
        });

        return clientStream;
    }

    pipeWithClientStream(destination: Writable){
        const client = this.createClientStream();
        client.pipe(destination, {end: false});
        destination.on('close', () => {
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

export const createIntervalStream = <T>(fn: () => Promise<T>|T, ms: number) => {
    const stream = new Readable({
        objectMode: true,
        read(size: number) {}
    });

    const timer = setInterval(async () => {
        const data = await fn();
        stream.push(data);
    }, ms);

    stream.on('close', () => clearInterval(timer));

    return stream;
};