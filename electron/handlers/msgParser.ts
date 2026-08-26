import { ipcMain } from 'electron'
import { readFileSync, existsSync } from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MsgReader = require('@kenjiuno/msgreader').default ?? require('@kenjiuno/msgreader')

function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Split into blocks on double newlines (paragraphs)
  const blocks = escaped.split(/\n{2,}/)

  const htmlBlocks = blocks.map(block => {
    const lines = block.split('\n')

    // Detect bullet block: lines starting with * or -
    const isBulletBlock = lines.every(l => /^\s*[*\-]\s/.test(l) || l.trim() === '')
    if (isBulletBlock) {
      const items = lines
        .filter(l => /^\s*[*\-]\s/.test(l))
        .map(l => `<li style="margin-bottom:4px">${linkify(l.replace(/^\s*[*\-]\s/, ''))}</li>`)
        .join('')
      return `<ul style="margin:0 0 12px 20px;padding:0">${items}</ul>`
    }

    // Regular paragraph: join lines, convert URLs to links
    const para = lines.map(l => linkify(l)).join('<br>')
    return `<p style="margin:0 0 12px 0">${para}</p>`
  })

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">${htmlBlocks.join('')}</div>`
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" style="color:#0078D4">$1</a>'
  )
}

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
        (fileData.body ? plainTextToHtml(fileData.body) : '')

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
