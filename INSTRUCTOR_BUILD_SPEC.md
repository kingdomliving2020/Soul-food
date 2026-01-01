# Soul Food - Instructor Access Build Specification
## Version 1.0 | Saved for Future Implementation

---

## User Stories

- **As an Instructor**, I want to access a secure dashboard so I can quickly find the resources I need to teach.
- **As an Instructor**, I want to view instructor-only versions of lessons so I can access answer keys and facilitation notes.
- **As an Instructor**, I want to manage my class rosters so I can keep track of my students and their progress.
- **As an Instructor**, I want to review student submissions (if enabled) so I can provide feedback.
- **As an Admin**, I want to manage users and their roles so I can ensure only authorized individuals have access.
- **As an Admin**, I want to create instructor accounts via an invite-only system so I can control who becomes an instructor.
- **As an Admin**, I want to disable instructor accounts so I can revoke access when necessary.
- **As a Student/Youth**, I want to access my lesson content and activities so I can learn.
- **As an Adult Reader**, I want to access the Adult Edition content so I can read and engage with it.
- **As a Student/Adult Reader**, I want to be prevented from seeing answer keys or instructor notes so the integrity of the lesson is maintained.

---

## Features to Build

1. Secure Login System
2. Role-Based Access Control (RBAC)
3. Instructor Dashboard (Home)
4. Instructor-only versions of lessons
5. Answer Keys and Activity Solutions
6. Roster / Group Feature (Optional at launch, recommended)
7. Invite-only instructor creation
8. Ability to disable instructor accounts
9. Password reset email flow
10. (Optional Phase 2) 2FA for Admin/Instructor

---

## Permissions Matrix

| Feature                           | Admin | Instructor | Student/Youth | Adult Reader |
|-----------------------------------|-------|------------|---------------|--------------|
| Login / Account                   | Yes   | Yes        | Yes           | Yes          |
| Student lesson pages              | Yes   | Yes (view) | Yes           | Yes          |
| Instructor dashboard              | Yes   | Yes        | No            | No           |
| Instructor notes / Faith Nuggets  | Yes   | Yes        | No            | No           |
| Answer keys / solutions           | Yes   | Yes        | No            | No           |
| Create/disable users              | Yes   | No         | No            | No           |
| Manage content / upload revisions | Yes   | Optional   | No            | No           |
| Roster / groups                   | Yes   | Optional   | No            | No           |
| Student submissions review        | Yes   | Optional   | Optional      | Optional     |

---

## UI Specifications

### Icons
- **Instructor**: Mortarboard (graduation cap) 🎓 + clipboard
- **Student/Youth**: Baseball cap + spark 🧢✨
- **Adult**: 👨

### Instructor Dashboard Must Include:
- Quick links to: Instructor Lesson Library, Answer Keys, Faith Nuggets, Jeopardy Bank, Roster
- Search bar to find lessons by quarter/month/lesson number, title, Scripture reference, or topic
- Optional 'Class Tools' panel with: print/download instructor notes, share student links, view recent submissions

### Lesson Pages - Instructor View:
Same as student view, plus additional tabs/accordion sections for:
- Answer Key
- Facilitation Notes
- Faith Nuggets (later)
- Timing tips
- Discussion prompts

---

## Technical Requirements

### Authentication
- Email + password login
- Password reset email flow
- Instructor accounts created by Admin invite only (no public instructor sign-up)

### Authorization (RBAC)
- Roles: Admin, Instructor, Student/Youth, Adult Reader
- RBAC permissions enforced on the **backend**, not just in the navigation
- Answer keys stored separately and never rendered in Student role (server-side permission check required)

### Protected Routes
1. `/instructor` - Instructor Dashboard (Instructor/Admin only)
2. Instructor Lesson Library - same pages as students but with instructor-only sections
3. Answer Keys - stored separately, never visible to Student/Adult roles

### Security
- Backend enforcement of all permissions
- Answer keys strictly protected from unauthorized access
- Optional 2FA for enhanced security (Phase 2)

### Audit Logging
Log key events: login, role change, content edits, account disabled

### PDF Export Requirements
- Lessons should start on odd pages for POD exports where applicable
- Headings must be consistent with the Youth Edition style

---

## Emergent Build Prompt (Copy/Paste)

```
Build the Instructor side of my SOFU website with role-based access (RBAC). 
Roles: Admin, Instructor, Student/Youth, Adult Reader. 
Admin has full access. Instructors can access Instructor-only tools. 
Students/Adults can only see student/adult lesson pages. 

Create these protected areas: 
1) /instructor (Instructor Dashboard) – only Instructor/Admin. 
2) Instructor Lesson Library – same lesson pages as students, but with Instructor-only sections: Answer Key, Facilitation Notes (and later Faith Nuggets). 
3) Answer Keys are stored separately and must never be visible to Student/Adult roles (enforce server-side permissions). 

Authentication: email + password login, password reset, and invite-only Instructor accounts (no public instructor signup). 
Admin tools: create/disable users, assign roles, and manage instructor invites. 

Ensure lessons start on odd pages for POD exports where applicable, and keep headings consistent with the Youth Edition style. 
Deliver a clean, simple UI with icons: Instructor = mortarboard; Student/Youth = cap + spark. 

Notes: This is intentionally 'SOFU Lite'—secure, clear, and easy to follow without overbuilding.
```

---

## Implementation Status

- [ ] RBAC System
- [ ] Instructor Dashboard
- [ ] Answer Key Storage
- [ ] Facilitation Notes
- [ ] Class Roster Feature
- [ ] Admin User Management
- [ ] Invite System
- [ ] Audit Logging

---

*Document saved for post-launch Phase 2 implementation*
