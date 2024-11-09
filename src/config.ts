import fs from "fs/promises";
import path from 'path';
import {Readable} from 'stream';
import assert from "assert";
import {createMutex} from "./pMutex";
const DATA_DIRECTORY = path.join(__dirname, "../data");

const PAGE_CONFIG_PATH = path.join(DATA_DIRECTORY, "pageConfig.json");
const LOCAL_STORAGE_PATH = path.join(DATA_DIRECTORY, "localstorage.json");
const SERVER_CONFIG_PATH = path.join(DATA_DIRECTORY, "serverConfig.json");
const AI_SCRIPT_PATH = path.join(DATA_DIRECTORY, "ai.js");

export type PageConfig = {
    cookieClickerPage: string
};

export type ServerConfig = {
    webSocketServerPort: number,
    httpServerPort: number,
    screenshotInterval: number
}


export type LocalStorage = {
    CookieClickerGame: string,
    CookieClickerLang: string,
    lastExternalReferrer: string,
    lastExternalReferrerTime: string
}

type Configs =
    | { name: "pageConfig", config: PageConfig}
    | { name: "serverConfig", config: ServerConfig}
    | { name: "localStorage", config: LocalStorage}
    | { name: "script", config: string}

type DataOfConfig<ConfigName extends String> = Extract<Configs, { name: ConfigName }>['config']
const ConfigMap = {
    pageConfig: PAGE_CONFIG_PATH,
    serverConfig: SERVER_CONFIG_PATH,
    localStorage: LOCAL_STORAGE_PATH,
    script: AI_SCRIPT_PATH
} as const

export type PersistentFileInterface<T extends string> = {
    get: () => DataOfConfig<T>
    set: (data: DataOfConfig<T>) => void
    onUpdate: (listener: (data: DataOfConfig<T>) => Promise<void>|void) => void
}
const persistentFileAccessor = async <T extends Configs['name']>(type: T, json = true): Promise<PersistentFileInterface<T>> => {
    const filePath = ConfigMap[type];
    const listeners: Set<(x: DataOfConfig<T>) => Promise<void>|void> = new Set();
    const lock = createMutex();
    const getFileData = async () => {
        const fileContents = await fs.readFile(filePath, 'utf8');
        return  json ? JSON.parse(fileContents) : fileContents;
    }

    let data = await getFileData();
    let delta = performance.now();

    const asyncWatcher = fs.watch(filePath, {
        persistent: true,
    });

    const watcher = Readable.from(asyncWatcher);
    watcher.on('data', async (fileData) => {
        await lock(async () => {
            if(performance.now() - delta < 2500) return;
            console.info(`${filePath} updated with ${JSON.stringify(fileData)}`);
            data = await getFileData();
            for(const listener of listeners){
                await listener(data);
            }
            delta = performance.now();
        });
    });


    return {
        get: () => data,
        onUpdate: (listener) => {
            listeners.add(listener);
        },
        set: async (nextData) => {
            try{
                const nextDataToWrite = json ? JSON.stringify(nextData, null, 2) : nextData;
                assert(typeof nextDataToWrite === "string");
                await fs.cp(filePath, `${filePath}__backup`)
                await fs.writeFile(filePath, nextDataToWrite);
            } catch(e){
                console.error(`Failed to write`, e);
            }

        }
    }
}

console.log("Creating Persistent Data Accessor")
const SERVER_CONFIG = persistentFileAccessor('serverConfig');
const LOCALSTORAGE_CONFIG = persistentFileAccessor('localStorage');
const PAGE_CONFIG = persistentFileAccessor('pageConfig');
const AI_CONFIG = persistentFileAccessor('script', false);

export const config = Promise.all([SERVER_CONFIG, LOCALSTORAGE_CONFIG, PAGE_CONFIG, AI_CONFIG]).then(([
    serverConfig,
    localStorageConfig,
    pageConfig,
    aiConfig
]) => ({serverConfig, localStorageConfig, pageConfig, aiConfig}) as const);