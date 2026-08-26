import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // SMTP
  smtpList: () => ipcRenderer.invoke('smtp:list'),
  smtpSave: (profile: unknown) => ipcRenderer.invoke('smtp:save', profile),
  smtpDelete: (id: string) => ipcRenderer.invoke('smtp:delete', id),
  smtpTest: (id: string) => ipcRenderer.invoke('smtp:test', id),
  smtpTestProfile: (profile: unknown) => ipcRenderer.invoke('smtp:test-profile', profile),
  smtpSendTest: (args: unknown) => ipcRenderer.invoke('smtp:send-test', args),

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

  // Templates
  templatesList: () => ipcRenderer.invoke('templates:list'),
  templatesSave: (t: unknown) => ipcRenderer.invoke('templates:save', t),
  templatesDelete: (id: string) => ipcRenderer.invoke('templates:delete', id),

  // AI Chat
  aiGetKey: () => ipcRenderer.invoke('ai:get-key'),
  aiSetKey: (key: string) => ipcRenderer.invoke('ai:set-key', key),
  aiGetModel: () => ipcRenderer.invoke('ai:get-model'),
  aiSetModel: (model: string) => ipcRenderer.invoke('ai:set-model', model),
  aiChat: (messages: unknown) => ipcRenderer.invoke('ai:chat', messages),

  // Draft persistence
  draftGet: () => ipcRenderer.invoke('draft:get'),
  draftSave: (data: unknown) => ipcRenderer.invoke('draft:save', data),

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
