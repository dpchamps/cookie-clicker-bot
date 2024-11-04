import {WebSocket, Server, createWebSocketStream} from "ws";
import {Writable} from "stream";
import {createIntervalStream, ScreenShotStream} from "./stream-primitives";
import {Page} from "playwright";
import {config} from "./config";

export const createScreenshotStreamingWebsocketServer = async () => {
    const {serverConfig} = await config;
    const wss = new WebSocket.Server({ port: serverConfig.get().webSocketServerPort });


    return {
        close: async () => {
            return Promise.race([
                new Promise<void>((res, reject) => {
                    for(const client of wss.clients){
                        client.close();
                    }
                    wss.close((err) => {
                        if(err) return reject(err);
                        res();
                    })
                }),
                new Promise((_, reject) => {
                    setTimeout(() => reject("timedout"), 200)
                })
            ]).catch((e) => {
                console.error(`Could not shutdown websocket server gracefully: ${e}`)
            })
        },
        initializeStreamToPage: (page: Page) => {
            const screenShotStream = createIntervalStream(() => page.screenshot({fullPage: true}), serverConfig.get().screenshotInterval).pipe(new ScreenShotStream(), {end: false});

            wss.on('connection', (ws, req) => {
                console.log(`[Server] Client Connected ${req.socket.remoteAddress} (${req.headers['x-forwarded-for']})`)
                if(ws.readyState !== ws.OPEN) return;
                const wsStream = createWebSocketStream(ws);
                wsStream.on('error', (e) => {
                    wsStream.destroy(e)
                    ws.close(500);
                });
                ws.on('close', () => {
                    console.log(`[Server] Client Disconnected ${req.socket.remoteAddress} (${req.headers['x-forwarded-for']})`);
                    wsStream.destroy()
                });
                screenShotStream.pipeWithClientStream(wsStream);
            });
        }
    }
}

