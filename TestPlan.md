# RavenBlast — Test Plan

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Draft

---

## 1. Scope

This test plan covers functional testing of all RavenBlast features prior to the v1.0 release. Testing is manual (no automated test suite in v1.0).

---

## 2. Test Environment

- OS: Windows 11 (64-bit), latest updates
- Machine: Any modern x64 PC
- SMTP: At least one real SMTP account (e.g. Gmail with App Password)
- Test mailbox: A personal inbox to receive test sends

---

## 3. Test Cases

### TC-01: Application Launch

| Step | Expected Result |
|------|----------------|
| Double-click RavenBlast installer → install | Installer completes without errors |
| Launch app from desktop shortcut | App opens within 5 seconds |
| Verify main Composer screen is shown | Composer with all fields visible |

---

### TC-02: SMTP Account Setup

| Step | Expected Result |
|------|----------------|
| Click Settings | Settings screen opens |
| Click Add Account | Modal appears with all fields |
| Fill in Gmail SMTP details (smtp.gmail.com, 587, STARTTLS) | Fields accept input |
| Click Test Connection | "Connection successful" message shown |
| Click Save | Profile appears in account list |
| Click Edit on profile | Modal shows current values |
| Change From Name, save | Updated name shown in list |
| Click Delete on profile | Confirmation dialog appears |
| Confirm delete | Profile removed from list |

---

### TC-03: Composer — Manual Recipients

| Step | Expected Result |
|------|----------------|
| Type an email in To field, press Enter | Email chip appears |
| Type an invalid email, press Enter | Error shown, chip not created |
| Type email in CC field | Chip appears in CC row |
| Type email in BCC field | Chip appears in BCC row |
| Click ✕ on a chip | Chip removed |
| Fill in Subject | Text accepted |

---

### TC-04: Excel Contact Import

| Step | Expected Result |
|------|----------------|
| Drop a valid .xlsx file onto the Excel drop zone | Column mapper dialog appears |
| Map columns: Email → col A, Name → col B, Company → col C | Mapping saved |
| Confirm import | Contact chips populate the To field; preview table shown |
| Drop an invalid file (e.g. .pdf) | Error: "Please drop an Excel (.xlsx) file" |
| Drop .xlsx with missing Email column | Error: "Email column is required" |

---

### TC-05: Merge Tags

| Step | Expected Result |
|------|----------------|
| Import contacts with Name and Company | Contacts loaded |
| Type `Hello {{Name}},` in subject | Subject field accepts it |
| Type `Welcome to {{Company}}.` in body | Body accepts it |
| Click Test Send | Preview shows tags resolved to first contact's values |
| Confirm and send to test inbox | Received email shows real Name and Company values |

---

### TC-06: .msg File Import

| Step | Expected Result |
|------|----------------|
| Drop a valid .msg file onto the msg drop zone | Subject and body populated from file |
| Verify HTML body is rendered in editor | Formatting preserved |
| Verify attachments from .msg appear in attachment list | Attachment chips shown |
| Drop non-.msg file | Error: "Please drop an Outlook .msg file" |

---

### TC-07: Rich Text Editor & Templates

| Step | Expected Result |
|------|----------------|
| Type in editor, apply Bold | Text bold in editor |
| Apply Italic, Underline | Formatting applied |
| Insert a link | Link shown in editor |
| Toggle to HTML view | Raw HTML displayed |
| Edit HTML, toggle back to rich text | Changes reflected |
| Select "Newsletter" from Template picker | Confirmation dialog shown |
| Confirm | Template HTML loads into editor |
| Select template when body already has content | Warning: "This will replace your current content" |

---

### TC-08: Attachments

| Step | Expected Result |
|------|----------------|
| Click Add File, select a PDF | File shown with name and size |
| Click ✕ on attachment | File removed |
| Drag a file onto attachment area | File added |
| Add 5 attachments | All listed, no crash |

---

### TC-09: Test Send

| Step | Expected Result |
|------|----------------|
| Fill composer (To, Subject, Body) | All fields populated |
| Click Test Send | Prompt asks for test email address |
| Enter test address, confirm | Email sent to test inbox |
| Receive email | Merge tags resolved to sample values; formatting correct |
| Test Send with no SMTP selected | Error: "Please select an email account first" |

---

### TC-10: Full Blast Send

| Step | Expected Result |
|------|----------------|
| Import 5 test contacts from Excel | 5 chips in To field |
| Select SMTP account | Account shown in From dropdown |
| Set delay: 3 min, 6 max | Slider positioned correctly |
| Click Send to All (5) | Progress screen shown |
| Observe progress bar | Bar advances per send; current email shown |
| Observe delay countdown | "Next send in: X seconds" shown |
| All sends complete | Summary Report screen appears |
| Verify 5 inboxes received email | Each email has correct Name/Company |

---

### TC-11: Pause and Resume

| Step | Expected Result |
|------|----------------|
| Start blast, click Pause mid-send | Progress pauses; countdown stops |
| Click Resume | Sending continues from where it paused |
| Verify no emails skipped | Sent count continues incrementing |

---

### TC-12: Abort Blast

| Step | Expected Result |
|------|----------------|
| Start blast, click Abort mid-send | Confirmation dialog: "Are you sure?" |
| Confirm abort | Sending stops |
| Summary Report shown | Shows sent, failed, skipped (remaining) counts |

---

### TC-13: Summary Report

| Step | Expected Result |
|------|----------------|
| Complete a blast (or abort) | Summary screen shown automatically |
| Verify all counts correct | Total, Sent, Failed, Skipped match observed behavior |
| Check failed entries | Each failed row shows email + error message |
| Click Export CSV | File saved to Downloads; opens correctly in Excel |
| Click Start New Blast | Composer resets |

---

### TC-14: Blast History

| Step | Expected Result |
|------|----------------|
| Send two blasts | Both appear in History screen |
| Click View on first blast | Correct summary shown |
| Verify date, subject, account name | All accurate |

---

### TC-15: Error Handling

| Step | Expected Result |
|------|----------------|
| Use wrong SMTP password | Failed send logged with auth error |
| Send to an invalid email address | Failed logged with SMTP rejection error |
| Disconnect internet mid-blast | Remaining sends fail gracefully; no crash; summary still shown |
| Import corrupted Excel file | Clear error message, no crash |

---

### TC-16: Accessibility & UX

| Step | Expected Result |
|------|----------------|
| Increase Windows display scale to 125% | App scales; no text cut off |
| Tab through Composer fields | Tab order logical top-to-bottom |
| Toggle dark mode | All screens update; no unreadable contrast |
| All buttons have visible text labels | No icon-only controls in primary actions |

---

## 4. Pass Criteria

All TC-01 through TC-13 must pass with no P1 defects before v1.0 release. TC-14 through TC-16 must have no blocking issues.

---

## 5. Defect Severity Definitions

| Level | Definition |
|-------|-----------|
| P1 — Critical | App crash, data loss, unable to send any email |
| P2 — High | Feature broken but workaround exists |
| P3 — Medium | UI issue, minor incorrect behavior |
| P4 — Low | Cosmetic, non-impacting |
