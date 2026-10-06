'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('burgerDesktop', Object.freeze({
  isPinned: () => ipcRenderer.invoke('burger:is-pinned'),
  togglePin: () => ipcRenderer.invoke('burger:toggle-pin'),
  pasteImage: () => ipcRenderer.invoke('burger:paste-image'),
  copyText: text => ipcRenderer.invoke('burger:copy-text', text)
}));
