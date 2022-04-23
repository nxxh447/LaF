// LaF Client ウィンドウローダー (c) 2022 Hiro527
require('v8-compile-cache');
import {
    app,
    BrowserWindow,
    clipboard,
    dialog,
    ipcMain,
    shell,
} from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import * as fs from 'fs';
import * as localShortcut from 'electron-localshortcut';
import isDev from 'electron-is-dev';

import { localization } from '../core/i18n';
import { i18n } from 'i18next';

const PackageInfo = require('../../package.json');

let locale = localization(app.getLocale());
const config = new Store();

const initSwapper = (win: BrowserWindow) => {
    const swapPath = path.join(app.getPath('documents'), '/LaFSwap');
    if (!fs.existsSync(swapPath)) {
        fs.mkdir(swapPath, { recursive: true }, (e) => {
            log.warn('ERROR IN RESOURCE SWAPPER');
            log.warn(e);
        });
    }
    const urls: string[] = [];
    const recursiveFolder = (win: BrowserWindow, prefix = '') => {
        try {
            fs.readdirSync(path.join(swapPath, prefix), {
                withFileTypes: true,
            }).forEach((cPath) => {
                if (cPath.isDirectory()) {
                    recursiveFolder(win, `${prefix}/${cPath.name}`);
                } else {
                    const name = `${prefix}/${cPath.name}`;
                    const isAsset =
                        /^\/(models|textures|sound|scares)($|\/)/.test(name);
                    if (isAsset) {
                        urls.push(
                            `*://assets.krunker.io${name}`,
                            `*://assets.krunker.io${name}?*`
                        );
                    } else {
                        urls.push(
                            `*://krunker.io${name}`,
                            `*://krunker.io${name}?*`,
                            `*://comp.krunker.io${name}`,
                            `*://comp.krunker.io${name}?*`
                        );
                    }
                }
            });
        } catch (e) {
            log.warn('Error in Resource Swapper');
            log.warn(e);
        }
    };
    recursiveFolder(win);
    if (urls.length) {
        win.webContents.session.webRequest.onBeforeRequest(
            { urls: urls },
            (details, callback) =>
                callback({
                    redirectURL:
                        'laf://' +
                        path.join(swapPath, new URL(details.url).pathname),
                })
        );
    }
};

export const LaunchGame = async (): Promise<BrowserWindow> => {
    const Window = new BrowserWindow({
        width: config.get('window.width', 1500) as number,
        height: config.get('window.height', 1500) as number,
        x: config.get('window.x', undefined) as number | undefined,
        y: config.get('window.y', undefined) as number | undefined,
        show: false,
        title: 'LaF Client',
        frame: false,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, '../script/GameWindow.js'),
            webviewTag: true,
        },
    });
    [
        [
            'Esc',
            () => {
                // ゲーム内でのESCキーの有効化
                Window.webContents.send('ESC');
            },
        ],
        [
            'F4',
            () => {
                Window.webContents.send('HQJoin');
            },
        ],
        [
            'F5',
            () => {
                // リ↓ロ↑ードする
                Window.reload();
            },
        ],
        [
            'F6',
            () => {
                // 別のマッチへ
                Window.webContents.send('NewGame');
            },
        ],
        [
            'F7',
            () => {
                // クリップボードへURLをコピー
                Window.webContents.send('CopyURL');
            },
        ],
        [
            'F8',
            () => {
                // クリップボードのURLへアクセス
                const copiedText = clipboard.readText();
                if (copiedText.match(/^https?:\/\/krunker.io\/\?game=.*/))
                    Window.webContents.send('OpenGame', copiedText);
            },
        ],
        [
            'F11',
            () => {
                const isFullScreen = Window.isFullScreen();
                config.set('window.isFullscreen', !isFullScreen);
                Window.setFullScreen(!isFullScreen);
            },
        ],
        [
            'Ctrl+Shift+F1',
            () => {
                // クライアントの再起動
                app.relaunch();
                app.quit();
            },
        ],
        [
            ['Ctrl+F1', 'F12'],
            () => {
                // 開発者ツールの起動
                Window.webContents.openDevTools();
            },
        ],
    ].forEach((k) => {
        localShortcut.register(
            Window,
            k[0] as string | string[],
            k[1] as () => void
        );
    });
    // initSwapper(Window);
    Window.loadFile(path.join(__dirname, '../../assets/ui/GameWindow.html'));
    Window.removeMenu();
    Window.on('ready-to-show', () => {
        Window.show();
    })
    return Window;
};
