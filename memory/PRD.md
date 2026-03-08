# Soul Food - Product Requirements Document

## Original Problem Statement
Build a full-stack e-commerce and learning platform called "Soul Food" for spiritual education content.

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **Payments**: Stripe integration (Live mode)
- **Email Service**: Resend (kingdom-soul.com)

---

## March 8, 2026 - CRITICAL BUG FIX: Login System

### Status: COMPLETED ✅

**ROOT CAUSE IDENTIFIED:**
1. **Database had 0 users** - User accounts don't exist
2. **Login modal was falling back to beta-login** which showed confusing "Invalid beta username" error

**Fixes Applied:**
1. Removed beta-login fallback from checkout LoginModal
2. Fixed token storage keys for consistency across app
3. Created proper Amazon-style registration form with:
   - First Name + Last Name (required)
   - Suffix dropdown (Jr., Sr., II, III, IV)
   - Date of Birth with 18+ age verification
   - Email (required)
   - Password + Confirm Password (min 8 chars)
   - Terms of Service notice

**How to Proceed:**
1. Click "Create an account" in the login modal
2. Fill out the registration form
3. You'll be logged in and can complete purchases

### Nibble Extraction (24 PDFs)
- 12 Youth Edition lessons (L1-L12)
- 12 Adult Edition lessons (L1-L12)
- Saved to `/app/content/downloads/nibbles/`

### New Cover Images Downloaded
- `breakfast-ye-nibble.png`
- `breakfast-ae-nibble.jpg`
- `holiday-ye-nibble.jpg`
- `holiday-ae-nibble.jpg`

---

## Prioritized Backlog

### P0 - Critical (User Blocking)
- ~~Login Bug~~ **FIXED**
- [ ] **Thumbnail matching selection** - Update image when user selects different edition

### P1 - High Priority
- [ ] Map new Nibble PDFs to products
- [ ] Update Nibble product cards to use new covers
- [ ] Process IE Breakfast files (when uploaded)

### P2 - Medium Priority
- [ ] Word Search Game
- [ ] Custom Domain Linking

---

## Files Modified This Session
- `/app/frontend/src/CheckoutPage.js` - Fixed login, improved registration form
- `/app/content/downloads/nibbles/` - 24 new PDF files
