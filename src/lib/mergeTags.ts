import type { Contact } from '../types'

export function resolveMergeTags(template: string, contact: Contact): string {
  return template
    .replace(/\{\{Name\}\}/g, contact.name || '')
    .replace(/\{\{Company\}\}/g, contact.company || '')
}
