# RavenBlast — Requirements

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Draft

---

## 1. Overview

RavenBlast is a Windows 11 desktop bulk email sender with an Outlook-style composer interface. It is designed for business owners who need to send personalized emails to multiple customers using their own SMTP accounts — no cloud service, no subscription, all local.

**Primary users:** Small business owners, including non-technical and elderly users.

---

## 2. Functional Requirements

### 2.1 Composer

| ID | Requirement |
|----|-------------|
| F-01 | Display an Outlook-style email composer as the main screen |
| F-02 | To field accepts multiple email addresses entered as chips (type + Enter or comma) |
| F-03 | CC field accepts multiple email addresses |
| F-04 | BCC field accepts multiple email addresses |
| F-05 | Subject line is a free-text input |
| F-06 | Attachments can be added via button or drag-and-drop; each attachment shows filename and size with a remove button |
| F-07 | Email body is a rich text / HTML editor (TipTap) supporting bold, italic, underline, bullet lists, links, and images |
| F-08 | Body editor has a toggle between rich text (WYSIWYG) and raw HTML view |
| F-09 | A template picker dropdown loads a pre-built HTML marketing layout into the body editor |

### 2.2 Contact List Import

| ID | Requirement |
|----|-------------|
| F-10 | A drag-and-drop zone accepts `.xlsx` Excel files |
| F-11 | App parses the Excel file using SheetJS and displays a column mapper: which column is Email, Name, Company |
| F-12 | Mapped contacts populate the To field as chips |
| F-13 | Subject and body support merge tags: `{{Name}}` and `{{Company}}` — resolved per recipient at send time |
| F-14 | Contact list shows a preview table (Name, Email, Company) before sending |

### 2.3 Outlook Message Import

| ID | Requirement |
|----|-------------|
| F-15 | A drag-and-drop zone accepts `.msg` Outlook message files |
| F-16 | App parses the `.msg` file and extracts: Subject, HTML body, plain text body (fallback), and attachments |
| F-17 | Extracted content auto-populates the Subject and body editor fields |
| F-18 | Extracted attachments are added to the attachment list |

### 2.4 SMTP Account Manager

| ID | Requirement |
|----|-------------|
| F-19 | Settings screen allows adding, editing, and deleting SMTP profiles |
| F-20 | Each profile stores: Profile name, Host, Port, Encryption (TLS/STARTTLS/None), Username, Password, From Name, Default Reply-To |
| F-21 | Passwords are stored encrypted locally using electron-store with AES encryption |
| F-22 | Composer has a dropdown to select which SMTP profile to send from |
| F-23 | Reply-To address can be overridden per-send in the composer |
| F-24 | SMTP profiles can be tested with a connection check (ping SMTP server) |

### 2.5 Send Engine

| ID | Requirement |
|----|-------------|
| F-25 | Emails are sent individually per recipient (not grouped in one To: blast) |
| F-26 | A configurable random delay is applied between each send, with min and max bounds (default: 3–10 seconds) |
| F-27 | Delay min/max are set via a slider in the composer before sending |
| F-28 | A progress bar displays: Sent / Total count and current recipient email |
| F-29 | Send can be Paused and Resumed |
| F-30 | Send can be Cancelled/Aborted at any point |
| F-31 | A Test Send button sends the current email (with merge tags resolved to sample values) to a specified test email address |

### 2.6 Summary Report

| ID | Requirement |
|----|-------------|
| F-32 | After a blast completes (or is aborted), a Summary Report screen is shown |
| F-33 | Summary includes: Total recipients, Emails sent successfully, Emails failed, Emails skipped (if aborted), Duration |
| F-34 | Failed entries show the recipient email and the error/exception message |
| F-35 | Summary is exportable as a CSV file for external review |
| F-36 | Summaries are persisted locally as a log file (JSON) per blast session with timestamp |
| F-37 | A Send History screen lists past blast sessions and allows viewing their summary report |

### 2.7 Email Templates

| ID | Requirement |
|----|-------------|
| F-38 | App ships with 3 built-in HTML email templates: Newsletter, Promotion/Offer, Plain Business |
| F-39 | Templates are fully editable in the body editor after selection |
| F-40 | Merge tags `{{Name}}` and `{{Company}}` are pre-placed in template bodies |

---

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF-01 | App runs on Windows 11 (64-bit) as a standalone installed application |
| NF-02 | All data (SMTP profiles, logs, templates) is stored locally — no internet connection required except for sending |
| NF-03 | UI is optimized for accessibility: large fonts (minimum 14px), high contrast, large click targets (minimum 44px), clear labels |
| NF-04 | App must not crash or lose compose data if the user closes the send dialog mid-blast |
| NF-05 | SMTP passwords must never be stored in plain text |
| NF-06 | App startup time must be under 5 seconds on a modern Windows 11 machine |
| NF-07 | Installer is a single `.exe` file distributed without requiring admin rights where possible |
| NF-08 | Send engine must handle at least 500 recipients per blast without UI freeze (background process via IPC) |

---

## 4. Out of Scope (v1.0)

- Cloud sync or remote access
- Email open/click tracking
- Unsubscribe link automation
- Scheduling future blasts
- OAuth / Gmail API integration
- Mobile or web version
