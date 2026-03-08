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

## March 8, 2026 - Auth Flow + Shipping Timeline

### Status: COMPLETED ✅

**Authentication Flow Updated:**
1. Username/Email + Password → Login
2. If 2FA enabled: Show OTP screen with method selection
   - 📧 Email Code (default)
   - 📱 Authenticator App (TOTP)
   - 📱 SMS (future - needs Twilio)
3. Enter 6-digit code → Verify → Complete login

**Registration Form (Amazon-style):**
- First Name + Last Name (required)
- Suffix dropdown (Jr., Sr., II, III, IV)
- Date of Birth with 18+ age verification
- Email + Password with confirmation (min 8 chars)
- Terms of Service notice

**Shipping Timeline Added (Spring 2026):**
| Tier | Order By | Delivery By | Notes |
|------|----------|-------------|-------|
| Easter Local | April 1 | April 11 | MA/CT/SC/GA only |
| Standard | Palm Sunday (April 5) | Pentecost (May 31) | FREE iPDF while waiting |
| Bulk/Church | Contact | Custom | orders@kingdom-soul.com |

**Key Fixes:**
1. Removed beta-login fallback that caused confusing error
2. Fixed token storage consistency across app
3. Added OTP verification screen with method selection
4. Added shipping timeline banner for physical orders

---

## Nibble Extraction Complete
- 24 PDFs extracted (12 YE + 12 AE)
- New cover images downloaded

---

## Prioritized Backlog

### P0 - Critical
- ~~Login Bug~~ **FIXED**
- ~~Auth Flow (Username → OTP)~~ **IMPLEMENTED**
- ~~Shipping Dates~~ **ADDED**
- [ ] Thumbnail matching selection

### P1 - High Priority
- [ ] Map Nibble PDFs to products
- [ ] Update Nibble cards with new covers
- [ ] SMS OTP via Twilio (when credentials provided)

---

## Files Modified This Session
- `/app/frontend/src/CheckoutPage.js` - Login modal, OTP flow, registration form, shipping timeline
