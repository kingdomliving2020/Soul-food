# Soul Food - Kingdom Living Project
## Demo Site Deployment Summary

### 🎉 Deployment Status: SUCCESS

The Soul Food website has been successfully pulled from GitHub and deployed for testing!

---

## 📋 Application Overview

**Soul Food - Kingdom Living Project** is a comprehensive spiritual education platform featuring:

- **Spiritual Curriculum**: Multi-series Bible study program (Break*fast, Lunch, Dinner, Supper, Holiday)
- **Interactive Trivia Games**: Multiple game modes with lifelines and leaderboards
- **E-commerce System**: Purchase lessons, bundles, and game passes
- **Multi-tier Access**: Free preview, day pass, eBook, subscription, and instructor editions

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (localhost:27017)
- **Key Libraries**: 
  - Motor (async MongoDB driver)
  - Stripe SDK (payment processing)
  - emergentintegrations (Stripe integration)
  - Pydantic (data validation)

### Frontend
- **Framework**: React 19
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **Router**: React Router DOM v7
- **State Management**: Context API (CartContext)

---

## 🚀 Deployed Services

### Backend API
- **URL**: http://localhost:8001
- **Status**: ✅ RUNNING
- **Features**:
  - RESTful API endpoints
  - Soul Food series management
  - Trivia game system
  - Payment processing (test mode)
  - Coupon validation system

### Frontend
- **URL**: http://localhost:3000
- **Status**: ✅ RUNNING
- **Features**:
  - Responsive landing page
  - Series catalog with availability status
  - Free lesson preview
  - Gaming Central (trivia games)
  - Shopping cart & checkout
  - Authentication integration

### Database
- **MongoDB**: ✅ RUNNING
- **Database Name**: soul_food_db
- **Collections**:
  - lessons (8 lessons initialized)
  - users
  - user_sessions
  - payment_transactions
  - coupon_usage

---

## 📊 Initialized Content

### Soul Food Series
1. **Break*fast** (Available) - Foundation in Christ
   - Esther: Courage in Crisis
   
2. **Lunch** (Q1 2026) - Kingdom Relationships

3. **Dinner** (Q2 2026) - Finding Your Purpose

4. **Supper** (Q3 2026) - Maturity in the Faith

5. **Holiday Series** (Available) - 4 C's of Christianity
   - The Cradle: Christ's Birth
   - The Cross: Sacrifice and Victory
   - The Covenant: God's Eternal Promise
   - The Comforter: The Holy Spirit

6. **Leap of Faith** (Available) - Free Sample
   - My Brother's Keeper & Consistency Pays

7. **Bonus Content** (Available)
   - Names of God
   - Times & Seasons

### Game Modes
- Practice Mode (Free)
- Quarter Challenge
- Series Challenge
- 4C's Holiday Special
- Soul Food Millionaire

### Products Available
- Single Lesson: $1.99 (list: $4.99)
- Monthly Pack (4 Lessons): $5.99 (list: $6.75)
- Mealtime Bundle (12 Lessons): $12.99 (list: $13.99)
- Combo Bundle (24 Lessons): $22.99 (list: $24.99)
- Instructor Set (36 Lessons): $39.99 (list: $44.99)
- Gaming Day Pass: $29.99 (list: $40.00)

### Active Coupons
- **SoulX1079**: 15% off (50 uses remaining)
- **SoulX1003**: 15% off (50 uses remaining)
- **Beta1!2!3!**: 100% off beta testers (20 uses)
- Multiple 10% off codes available

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=soul_food_db
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_mock_key_for_development
ENV=development
```

**Frontend (.env)**:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Supervisor Services
All services managed by supervisor and set to auto-restart:
- ✅ backend (port 8001)
- ✅ frontend (port 3000)  
- ✅ mongodb
- ✅ nginx-code-proxy
- ✅ code-server

---

## 🧪 Testing Endpoints

### Backend API Tests
```bash
# Root API
curl http://localhost:8001/api/

# Get all series
curl http://localhost:8001/api/series

# Get lessons
curl http://localhost:8001/api/lessons

# Get trivia access tiers
curl http://localhost:8001/api/trivia/access-tiers

# Get products
curl http://localhost:8001/api/payments/products

# Get coupon stats
curl http://localhost:8001/api/coupons/stats/Beta1!2!3!
```

### Frontend Access
```bash
# Open in browser
http://localhost:3000
```

---

## 📝 Key Features Implemented

### 1. Soul Food Curriculum System
- Multi-series spiritual education platform
- Quarterly content unlock schedule
- Edition-based access control (Adult, Youth, Instructor)
- Rich multimedia support (audio prayers, theme videos)

### 2. Trivia Gaming System
- Multiple game modes with progressive difficulty
- Lifelines: 50/50, Ask Congregation, Scripture Hint, Prayer Pause
- Leaderboard and badges system
- Day pass and subscription tiers

### 3. E-commerce Platform
- Stripe integration (test mode configured)
- Product catalog with sale pricing
- Coupon validation system
- Shopping cart functionality
- Checkout flow with payment success/cancel pages

### 4. Authentication
- Emergent authentication integration
- Session-based user management
- Multi-tier subscription support

---

## 🎯 Demo Testing Checklist

- ✅ Landing page loads successfully
- ✅ Series catalog displays correctly
- ✅ Free lesson preview available
- ✅ Gaming Central section visible
- ✅ Shopping cart functional
- ✅ Backend APIs responding
- ✅ Database initialized with content
- ✅ Payment system configured (test mode)
- ✅ Coupon system operational

---

## 📦 Dependencies Installed

### Backend (Python)
- fastapi==0.110.1
- motor==3.3.1 (MongoDB async)
- stripe==14.0.1
- emergentintegrations==0.1.0
- pydantic==2.12.4
- python-dotenv==1.2.1
- uvicorn==0.25.0
- And 100+ supporting packages

### Frontend (Node/React)
- react==19.0.0
- react-router-dom==7.5.1
- axios==1.8.4
- @radix-ui/* (20+ UI components)
- tailwindcss==3.4.17
- lucide-react==0.507.0
- And 80+ supporting packages

---

## 🔄 Service Management

### Restart Services
```bash
sudo supervisorctl restart all
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Check Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Frontend logs  
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log
```

---

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs (FastAPI auto-generated)

---

## 📌 Important Notes

1. **Payment System**: Currently configured with test Stripe key for demo purposes
2. **Beta Access**: Special beta coupon "Beta1!2!3!" provides 100% off for first 20 users
3. **Content Schedule**: Some series locked until Q1-Q3 2026
4. **Hot Reload**: Both frontend and backend have hot reload enabled for development

---

## 🎨 Screenshots

The application features:
- Beautiful gradient hero section with call-to-action
- Series cards with unlock status indicators
- Free lesson preview with crossword puzzle
- Gaming Central section with trivia games
- Rich multimedia learning experience section
- Professional footer with links

---

## ✅ Ready for Testing!

The Soul Food demo site is now fully operational and ready for comprehensive testing. All services are running, the database is initialized with sample content, and the application is accessible at http://localhost:3000.

**Deployment Date**: November 29, 2025
**Source**: https://github.com/kingdomliving2020/Soul-food (main branch)
**Environment**: Development/Testing

---

For questions or issues, check the logs or restart services using supervisor commands listed above.
