# RavenBlast — Architecture

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Draft

---

## 1. Technology Stack

| Layer | Technology | Version Target |
|-------|-----------|----------------|
| Desktop shell | Electron | v31+ |
| Frontend framework | React | v18+ |
| Language | TypeScript | v5+ |
| Build tool | Vite + electron-vite | Latest |
| Styling | Tailwind CSS | v3 |
| Email body editor | TipTap | v2 |
| SMTP sending | nodemailer | v6 |
| Excel parsing | SheetJS (xlsx) | Latest |
| .msg file parsing | @kenjiuno/msgreader | Latest |
| Local storage | electron-store (encrypted) | v10+ |
| Installer | electron-builder | Latest |

---

## 2. Process Architecture

Electron runs two processes that communicate via IPC (Inter-Process Communication):

```
┌─────────────────────────────────────────┐
│            Main Process (Node.js)        │
│  - SMTP sending (nodemailer)             │
│  - Excel parsing (SheetJS)              │
│  - .msg parsing (msgreader)             │
│  - electron-store (encrypted config)    │
│  - Blast log persistence (JSON files)   │
│  - IPC handlers                         │
└──────────────┬──────────────────────────┘
               │ IPC (contextBridge)
┌──────────────▼──────────────────────────┐
│          Renderer Process (React)        │
│  - Composer UI                          │
│  - TipTap editor                        │
│  - Contact list table                   │
│  - Progress bar & send controls         │
│  - Summary report screen               │
│  - Settings / SMTP manager              │
└─────────────────────────────────────────┘
```

**Security:** `contextIsolation: true`, `nodeIntegration: false`. All Node/system access is proxied through named IPC channels exposed via `contextBridge`.

---

## 3. IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `smtp:save-profile` | R → M | Save/update an SMTP profile |
| `smtp:list-profiles` | R → M | Fetch all SMTP profiles |
| `smtp:delete-profile` | R → M | Delete a profile |
| `smtp:test-connection` | R → M | Ping SMTP server, return success/error |
| `contacts:parse-excel` | R → M | Parse .xlsx and return rows |
| `msg:parse-file` | R → M | Parse .msg and return subject/body/attachments |
| `blast:start` | R → M | Begin sending with config payload |
| `blast:pause` | R → M | Pause active blast |
| `blast:resume` | R → M | Resume paused blast |
| `blast:cancel` | R → M | Abort blast |
| `blast:progress` | M → R | Emit per-send progress updates |
| `blast:complete` | M → R | Emit final summary when done or aborted |
| `history:list` | R → M | List past blast session logs |
| `history:get` | R → M | Fetch a specific session's summary |

---

## 4. Data Models

### SmtpProfile
```typescript
interface SmtpProfile {
  id: string;           // UUID
  name: string;         // Display label (e.g. "Company Gmail")
  host: string;
  port: number;
  encryption: 'tls' | 'starttls' | 'none';
  username: string;
  password: string;     // Stored encrypted via electron-store
  fromName: string;
  defaultReplyTo: string;
}
```

### Contact
```typescript
interface Contact {
  email: string;
  name: string;
  company: string;
}
```

### BlastConfig
```typescript
interface BlastConfig {
  smtpProfileId: string;
  replyTo: string;
  to: Contact[];
  cc: string[];
  bcc: string[];
  subject: string;      // May contain {{Name}}, {{Company}}
  bodyHtml: string;     // May contain {{Name}}, {{Company}}
  attachments: Attachment[];
  delayMin: number;     // seconds
  delayMax: number;     // seconds
}
```

### BlastProgress (emitted per send)
```typescript
interface BlastProgress {
  sent: number;
  total: number;
  currentEmail: string;
  status: 'sending' | 'paused' | 'done' | 'aborted';
}
```

### BlastSummary (persisted + shown in report)
```typescript
interface BlastSummary {
  sessionId: string;
  timestamp: string;    // ISO 8601
  duration: number;     // seconds
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ email: string; message: string }>;
  smtpProfile: string;  // profile name
  subject: string;
}
```

---

## 5. Folder Structure

```
ravenblast/
├── electron/
│   ├── main.ts               # Electron main process entry
│   ├── preload.ts            # contextBridge IPC exposure
│   └── handlers/
│       ├── smtp.ts           # SMTP profile CRUD + test
│       ├── blast.ts          # Send engine + pause/cancel
│       ├── contacts.ts       # Excel parser
│       ├── msgParser.ts      # .msg file parser
│       └── history.ts        # Blast log read/write
├── src/
│   ├── App.tsx
│   ├── pages/
│   │   ├── Composer.tsx      # Main compose screen
│   │   ├── Settings.tsx      # SMTP profile manager
│   │   ├── History.tsx       # Past blast sessions
│   │   └── Summary.tsx       # Post-blast summary report
│   ├── components/
│   │   ├── RecipientChipInput.tsx
│   │   ├── AttachmentRow.tsx
│   │   ├── BodyEditor.tsx    # TipTap wrapper
│   │   ├── TemplatePicker.tsx
│   │   ├── ContactDropZone.tsx
│   │   ├── MsgDropZone.tsx
│   │   ├── DelaySlider.tsx
│   │   ├── ProgressPanel.tsx
│   │   └── SmtpSelector.tsx
│   ├── templates/
│   │   ├── newsletter.html
│   │   ├── promotion.html
│   │   └── business.html
│   ├── lib/
│   │   ├── ipc.ts            # Typed IPC wrapper for renderer
│   │   └── mergeTags.ts      # {{Name}}/{{Company}} resolver
│   └── store/
│       └── blastStore.ts     # React context for blast state
├── logs/                     # Blast session JSON logs (auto-created)
├── electron-builder.config.js
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 6. Send Engine Flow

```
BlastConfig received via IPC
        │
        ▼
For each contact in To[]:
  1. Resolve merge tags in subject + body
  2. Build nodemailer message object
  3. Send via selected SMTP profile
  4. Record result (success / error)
  5. Emit blast:progress to renderer
  6. Wait random delay (delayMin–delayMax seconds)
  7. Check pause/cancel signal before next send
        │
        ▼
All done or aborted?
  → Build BlastSummary
  → Write JSON log to /logs/{sessionId}.json
  → Emit blast:complete to renderer
```

---

## 7. Security Considerations

- SMTP passwords encrypted at rest using `electron-store` with a machine-derived encryption key
- No credentials are ever logged or included in blast summary files
- `contextIsolation` enforced — renderer cannot access Node APIs directly
- File paths validated in main process before reading (prevent path traversal)
