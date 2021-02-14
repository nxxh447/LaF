require("v8-compile-cache");
const { ipcRenderer } = require("electron");
const log = require("electron-log");
const utils = require("./utils.js")
const tools = require("./tools.js")
const langRes = require("./lang")
// const path = require("path");

const lafUtils = new utils();
const lafTools = new tools();

const langPack = new langRes.ja_JP();

Object.assign(console, log.functions);

window.prompt = (message, defaultValue) => {
    return ipcRenderer.sendSync("PROMPT", message, defaultValue);
};

const initIpc = () => {
    ipcRenderer.on("ESC", () => {
        document.exitPointerLock();
    });
};
initIpc();


document.addEventListener("DOMContentLoaded", () => {
    window.utils = new utils();
    let observer = new MutationObserver(() => {
        observer.disconnect();
        lafUtils.setupGameWindow();
    });
    observer.observe(document.getElementById("instructions"), {childList: true});
});
