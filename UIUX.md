# RavenBlast — UI/UX Design Specification

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Draft

---

## 1. Design Philosophy

RavenBlast is used by business owners, including elderly or non-technical users. Every design decision prioritizes:

- **Clarity over cleverness** — labels are explicit, no icon-only buttons
- **Large targets** — all interactive elements are at least 44px tall
- **One thing at a time** — no information overload; progressive disclosure
- **Forgiveness** — confirm before destructive actions, never silent data loss
- **Predictable layout** — consistent placement, no surprise navigation

---

## 2. Typography & Spacing

| Element | Size | Weight |
|---------|------|--------|
| Body text | 15px | Regular |
| Labels / field headers | 13px | Medium |
| Button text | 15px | SemiBold |
| Section headings | 18px | Bold |
| Page title | 22px | Bold |
| Error / warning text | 14px | Regular, red |

- Minimum line height: 1.5×
- Minimum padding inside buttons: 12px vertical, 20px horizontal
- Form fields: 48px tall minimum

Font: **Inter** (bundled) — clean, highly legible, designed for screens.

---

## 3. Color Palette

### Light Mode (Default)

| Role | Color |
|------|-------|
| Background | `#F5F5F5` |
| Surface (cards, panels) | `#FFFFFF` |
| Primary action | `#0078D4` (Outlook blue) |
| Primary hover | `#106EBE` |
| Destructive | `#D32F2F` |
| Text primary | `#1A1A1A` |
| Text secondary | `#555555` |
| Border | `#D0D0D0` |
| Success | `#2E7D32` |
| Warning | `#E65100` |

### Dark Mode

| Role | Color |
|------|-------|
| Background | `#1E1E1E` |
| Surface | `#2D2D2D` |
| Primary action | `#4DA6FF` |
| Text primary | `#F0F0F0` |
| Border | `#444444` |

---

## 4. Application Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [RavenBlast Logo]           [Settings ⚙]  [History 📋]     │  ← Top nav bar (56px)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   MAIN CONTENT AREA (screen-dependent)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Navigation is top-bar only. No sidebar. Three destinations: **Composer** (home), **Settings**, **History**.

---

## 5. Screen: Composer (Main)

```
┌──────────────────────────────────────────────────────────────────┐
│  RavenBlast                              [Settings]  [History]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌── From Account ──────────────────────────────────────────┐   │
│  │  [ Select SMTP Account ▼ ]   Reply-To: [____________]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Recipients ────────────────────────────────────────────┐   │
│  │  To:   [chip chip chip +____________]    [Import Excel]  │   │
│  │  CC:   [_________________________________________]        │   │
│  │  BCC:  [_________________________________________]        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Subject ────────────────────────────────────────────────┐  │
│  │  [_______________________________________________]         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── Message Body ───────────────────────── [Template ▼] ───┐   │
│  │  [B] [I] [U] [•] [🔗] [Img] [</>HTML]                    │   │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │                                                      │ │  │
│  │  │   (Rich text editor area — min 300px tall)           │ │  │
│  │  │                                                      │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Attachments ────────────────────────────────────────────┐  │
│  │  [+ Add File]    file1.pdf ✕    contract.docx ✕           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── Drop Zone ──────────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐   │  │
│  │  │  📎 Drop Excel file  │  │  📄 Drop .msg file       │   │  │
│  │  │  (.xlsx contacts)    │  │  (load email content)   │   │  │
│  │  └──────────────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── Send Options ───────────────────────────────────────────┐  │
│  │  Delay between emails:  [===●====] 3 sec  to  [====●==]  │  │
│  │                          Min                    Max       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Test Send → my@email.com ]          [ 🚀 Send to All (47) ]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key UX notes:**
- Recipient count shown on the Send button ("Send to All (47)")
- "Import Excel" opens file dialog AND supports drag-drop
- Template picker loads HTML into editor — user sees confirmation dialog before overwriting existing content
- Drop zones are visually distinct, labeled with icons AND text

---

## 6. Screen: Sending Progress

Replaces main content area when send is in progress (no new window):

```
┌──────────────────────────────────────────────────────────────────┐
│  RavenBlast — Sending in Progress                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Sending to: john.smith@example.com                            │
│                                                                  │
│   ████████████████████░░░░░░░░░░░░░░░░░  38 / 47               │
│                                                                  │
│   ✅ 36 Sent    ❌ 2 Failed    ⏳ 9 Remaining                    │
│                                                                  │
│   Next send in: 6 seconds...                                    │
│                                                                  │
│                [ ⏸ Pause ]        [ ✕ Abort ]                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Large readable font throughout
- Countdown timer shown between sends
- Abort asks for confirmation: "Are you sure you want to stop? Emails already sent will not be recalled."

---

## 7. Screen: Summary Report

Shown automatically after blast completes or is aborted:

```
┌──────────────────────────────────────────────────────────────────┐
│  Blast Complete — Summary Report                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Sent on: August 24, 2026 at 10:42 PM                         │
│   Duration: 4 minutes 12 seconds                               │
│   Account: Company Gmail                                        │
│   Subject: "Summer Promotion for {{Name}}"                      │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │   📬 Total       47                                       │  │
│   │   ✅ Sent         44                                       │  │
│   │   ❌ Failed        2                                       │  │
│   │   ⏭ Skipped       1  (aborted)                            │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   Failed Emails:                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  bad@domain.xyz     │  Connection refused (port 25)      │  │
│   │  test@broken.com    │  550 Recipient not found           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│        [ 📥 Export CSV ]        [ ✉ Start New Blast ]           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Screen: Settings — SMTP Accounts

```
┌──────────────────────────────────────────────────────────────────┐
│  Settings — Email Accounts                    [ + Add Account ]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Company Gmail                                           │    │
│  │  smtp.gmail.com : 587 (STARTTLS)                        │    │
│  │  From: Acme Corp <hello@acme.com>                       │    │
│  │                        [ Edit ]  [ Test ]  [ Delete ]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Office 365                                              │    │
│  │  smtp.office365.com : 587 (STARTTLS)                    │    │
│  │  From: Sam <sam@company.ca>                             │    │
│  │                        [ Edit ]  [ Test ]  [ Delete ]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Add/Edit opens a modal (not a new page):
- All fields clearly labeled with placeholder examples
- "Test Connection" button in modal pings SMTP before saving
- Password field has show/hide toggle

---

## 9. Screen: History

```
┌──────────────────────────────────────────────────────────────────┐
│  Blast History                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Aug 24, 2026 — Summer Promotion — 44/47 sent    [ View ]        │
│  Aug 21, 2026 — Newsletter July — 120/120 sent   [ View ]        │
│  Aug 15, 2026 — New Feature Launch — 88/90 sent  [ View ]        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Clicking View shows the full Summary Report for that session.

---

## 10. Accessibility & Elderly UX Guidelines

- All buttons have visible text labels — no icon-only controls (except secondary actions)
- Tab order follows natural reading flow top-to-bottom
- All inputs have a visible label above (not placeholder-only)
- Error messages are red, bold, and placed directly below the relevant field
- Confirmation dialogs for: overwriting body with template, aborting a blast, deleting an SMTP profile
- "Success" and "Error" feedback uses both color AND an icon (not color alone)
- App window minimum size: 900×700px; resizable
- Dark mode toggle accessible from every screen via top-right icon
