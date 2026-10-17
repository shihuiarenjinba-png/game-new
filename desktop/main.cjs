"use strict";
/* Offline Electron wrapper. No preload, Node renderer, network, or external navigation. */
const {app, BrowserWindow, Menu} = require("electron");
const path = require("node:path");

if (process.platform === "win32") app.setAppUserModelId("jp.handoverroom.prototype");

function openMain() {
  const window = new BrowserWindow({
    width: 1120, height: 820, minWidth: 600, minHeight: 560,
    show: false, autoHideMenuBar: true,
    backgroundColor: "#121719",
    title: "引継ぎ室",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false
    }
  });
  window.webContents.setWindowOpenHandler(() => ({action: "deny"}));
  window.webContents.on("will-navigate", event => event.preventDefault());
  window.webContents.on("will-redirect", event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.once("ready-to-show", () => window.show());
  window.loadFile(path.join(__dirname, "..", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  openMain();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openMain();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
