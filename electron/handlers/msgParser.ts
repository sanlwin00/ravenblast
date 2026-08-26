import { ipcMain } from 'electron'
import { readFileSync, existsSync } from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MsgReader = require('@kenjiuno/msgreader').default ?? require('@kenjiuno/msgreader')

export function registerMsgHandlers(): void {
  ipcMain.handle('msg:parse', (_event, filePath: string) => {
    if (!filePath) {
      return { error: 'No file path received. Make sure you are dropping the file from Windows Explorer, not from a browser or email client.' }
    }
    if (!existsSync(filePath)) {
      return { error: `File not found at path: ${filePath}` }
    }

    try {
      const buf = readFileSync(filePath)
      const reader = new MsgReader(buf)
      const fileData = reader.getFileData()

      const bodyHtml: string =
        fileData.bodyHTML ||
        fileData.bodyHtml ||
        (fileData.body ? `<pre style="white-space:pre-wrap">${fileData.body}</pre>` : '')

      return {
        subject: fileData.subject || '',
        bodyHtml,
        attachments: (fileData.attachments || []).map((a: { fileName?: string }) => ({
          name: a.fileName || 'attachment'
        }))
      }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })
}
