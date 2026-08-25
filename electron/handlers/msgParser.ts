import { ipcMain } from 'electron'
import { readFileSync } from 'fs'

export function registerMsgHandlers(): void {
  ipcMain.handle('msg:parse', (_event, filePath: string) => {
    // Dynamic import to avoid top-level CJS/ESM issues with msgreader
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MsgReader = require('@kenjiuno/msgreader').default ?? require('@kenjiuno/msgreader')
    const buf = readFileSync(filePath)
    const reader = new MsgReader(buf)
    const fileData = reader.getFileData()

    return {
      subject: fileData.subject || '',
      bodyHtml: fileData.bodyHTML || (fileData.body ? `<pre style="white-space:pre-wrap">${fileData.body}</pre>` : ''),
      attachments: (fileData.attachments || []).map((a: { fileName?: string; dataId?: number }) => ({
        name: a.fileName || 'attachment'
      }))
    }
  })
}
