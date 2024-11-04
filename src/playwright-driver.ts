import {Browser, chromium, Page} from "playwright";  // Or 'webkit' or 'firefox'.
import {entriesIntoObject} from "./util";

import {config, LocalStorage, PersistentFileInterface} from "./config";
export const launchBrowserServer = async () => {
    const browserServer = await chromium.launchServer({
        handleSIGINT: false
    });
    // maybe do stuff with browser server
    return browserServer;
}

export const createBrowserConnection = async (wsEndpoint: string) => {
    const browser = await chromium.connect(wsEndpoint);

    // maybe do something with browser

    return browser;
};

export const saveCookieClickerState = async (page: Page, localStorageConfig: PersistentFileInterface<"localStorage">) => {
    await page.evaluate(() => {
        (globalThis as any).Game.WriteSave();
    });
    const state = await page.context().storageState();
    const local = state.origins.find((x) => x.origin.includes("dashnet"));
    if(!local) throw new Error();
    const nextLocalhost = entriesIntoObject(local.localStorage.map(({name, value}) => [name, value]));
    localStorageConfig.set(nextLocalhost as any);
}

export const createCookieClickerPage = async (browser: Browser) => {
    const page = await browser.newPage();
    await page.setViewportSize({
        width: 1920,
        height: 1080
    })
    const {localStorageConfig, pageConfig, aiConfig} = await config;
    await page.goto(pageConfig.get().cookieClickerPage);
    const LocalStorageContext = localStorageConfig.get();
    page.on('console', (x) => {
        console.log(`[Console Message]: ${x.text()}`)
    });

    await page.evaluate((LocalStorageContext) => {
        // Load save
        for(const [key, value] of Object.entries(LocalStorageContext)){
            localStorage.setItem(key, value);
        }
    }, LocalStorageContext);
    await page.reload();

    await page.waitForFunction(() =>
        typeof ((globalThis as any).Game.LoadSave) !== "undefined"
        && (globalThis as any).Game.ready === 1
        && typeof (globalThis as any).Game.prefs !== "undefined"
    );

    console.log("Game is ready to RIP")

    await page.evaluate(() => {
        (globalThis as any).Game.prefs.showBackupWarning = 0;
        (globalThis as any).Game.LoadSave();
        (globalThis as any).Game.CloseNotes();
        (globalThis as any).ScriptInjector = {
            initializeScript: () => {},
            tearDownScript: () => {},
            // @ts-ignore
            onInitialize(fn){
                this.initializeScript = fn;
            },
            // @ts-ignore
            onTearDown(fn){
                this.tearDownScript = fn;
            }
        };
    });

    await page.evaluate(aiConfig.get());
    await page.evaluate(`ScriptInjector.initializeScript()`)
    aiConfig.onUpdate(async (data) => {
        await page.evaluate(`ScriptInjector.tearDownScript()`)
        await page.evaluate(data);
        await page.evaluate(`ScriptInjector.initializeScript()`)
    });

    setInterval(async () => {
      await saveCookieClickerState(page, localStorageConfig);
    }, 10_000);

    return page;
};