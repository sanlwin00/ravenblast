import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // SMTP
  smtpList: () => ipcRenderer.invoke('smtp:list'),
  smtpSave: (profile: unknown) => ipcRenderer.invoke('smtp:save', profile),
  smtpDelete: (id: string) => ipcRenderer.invoke('smtp:delete', id),
  smtpTest: (id: string) => ipcRenderer.invoke('smtp:test', id),

  // Contacts
  contactsParseExcel: (filePath: string) => ipcRenderer.invoke('contacts:parse-excel', filePath),

  // MSG
  msgParse: (filePath: string) => ipcRenderer.invoke('msg:parse', filePath),

  // Blast
  blastStart: (config: unknown) => ipcRenderer.invoke('blast:start', config),
  blastPause: () => ipcRenderer.invoke('blast:pause'),
  blastResume: () => ipcRenderer.invoke('blast:resume'),
  blastCancel: () => ipcRenderer.invoke('blast:cancel'),

  // History
  historyList: () => ipcRenderer.invoke('history:list'),
  historyGet: (sessionId: string) => ipcRenderer.invoke('history:get', sessionId),

  // Push: main → renderer
  onBlastProgress: (cb: (progress: unknown) => void) => {
    const handler = (_: IpcRendererEvent, data: unknown) => cb(data)
    ipcRenderer.on('blast:progress', handler)
    return () => ipcRenderer.removeListener('blast:progress', handler)
  },
  onBlastComplete: (cb: (summary: unknown) => void) => {
    const handler = (_: IpcRendererEvent, data: unknown) => cb(data)
    ipcRenderer.on('blast:complete', handler)
    return () => ipcRenderer.removeListener('blast:complete', handler)
  }
})
