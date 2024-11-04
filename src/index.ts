import {
    createBrowserConnection,
    createCookieClickerPage,
    launchBrowserServer,
    saveCookieClickerState
} from "./playwright-driver";
import {createScreenshotStreamingWebsocketServer} from "./web-socket-server";
import {createHttpServer} from "./http-server";
import {config} from "./config";
const main = async () => {
    console.info("Launching chromium...");
    const browserServer = await launchBrowserServer();
    console.info(`Getting wsEndpoint...`);
    const wsEndpoint = browserServer.wsEndpoint();
    console.info(`Starting browser, screenshotServer and http server`)
    const [browser, screenshotStreamingServer, httpServer] = await Promise.all([
        createBrowserConnection(wsEndpoint),
        createScreenshotStreamingWebsocketServer(),
        createHttpServer()
    ]);
    console.info(`Creating Cookie Clicker Page...`);
    const page = await createCookieClickerPage(browser);
    console.info(`Attaching page to stream...`);
    screenshotStreamingServer.initializeStreamToPage(page);

    console.info(`DONE! Process up`);

    const gracefulShutdown = async () => {
        console.log("Attempting to save browser state...");
        const {localStorageConfig} = await config;
        await saveCookieClickerState(page, localStorageConfig)
        await screenshotStreamingServer.close();
        await browserServer.close();
        await httpServer.close();
        process.exit(0);
    }


    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
})