import {createServer} from 'http-server'
import {join} from "path";

export const createHttpServer = async () => {
    console.log(join(__dirname, "./webapp"));
    const server = createServer({
        root: join(__dirname, "./webapp"),
        showDir: false,
        showDotfiles: false
    });

    await server.listen(8080);

    return server;
}