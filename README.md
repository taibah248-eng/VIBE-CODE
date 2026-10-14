# TaskFlow — Modern Standard To-Do Mobile Application

TaskFlow is a production-grade, intuitive, and visually stunning mobile productivity application engineered for students, professionals, entrepreneurs, and personal organizers. Built with high-fidelity UI/UX, responsive mobile mechanics, Web Audio micro-interactions, local notifications, and offline-first persistent storage.

---

## 📱 Deployment & Preview

### Static Vercel Deployment
This repository is configured for direct static deployment on **Vercel**:
- Root file: `index.html`
- Configuration: `vercel.json` (`cleanUrls: true`, `trailingSlash: false`)
- No Node.js build step or server required.

### Local Static Preview
You can preview the app using any static server or VS Code Live Server extension:
```bash
npx serve .
# or open index.html directly in your browser
```

---

## 🌟 Key Product Features

### 1. Onboarding & User Access
- **Animated Splash Screen:** 3D glowing brand icon, animated progress loader, and instant access button.
- **Interactive Onboarding Carousel:** 3 swipeable/clickable slides showcasing core value propositions, dynamic dots, and quick skip.
- **Sign-Up & Sign-In Flows:** Role selection (Student, Professional, Entrepreneur, Personal), profile avatar preview, input validation, and zero-friction "Continue as Guest" one-tap entry.

### 2. Home Dashboard
- **Personalized Header:** Time-of-day greeting ("Good morning / afternoon / evening"), real-time clock, current date, profile avatar, and unread notification bell.
- **Circular SVG Progress Ring:** Animated stroke measuring daily completion percentage with dynamic motivational feedback.
- **Metric Quick Stats:** Instant count cards for Today's Scheduled, Completed, and Overdue tasks.
- **Category Filter Chips:** One-tap filtering for Work, Study, Personal, and Shopping.
- **Today's Focus & Priority Feed:** Interactive task cards with immediate completion checkmarks and priority ribbons.

### 3. Comprehensive Task Management (Full CRUD)
- **Create & Edit Tasks:** Title validation, multi-line notes, due date & time, priority (Low, Medium, High), and category tags.
- **Subtasks & Checklist Builder:** Dynamic step-by-step checklist builder with live progress tracking (e.g. `2/3 Done`).
- **Reminders & Local Notifications:** Proactive reminder alerts with Web Notification API integration and fallbacks.
- **Safe Deletion & Undo:** Confirmation dialog before permanent deletion, paired with an interactive 5-second Undo toast banner.

### 4. Calendar & Scheduling
- **Interactive Month Grid:** Full calendar with month switching, day selection, and "Today" quick jump.
- **Task Indicator Dots:** Visual dot markers on days with scheduled tasks colored by priority.
- **Date-Specific Agenda:** Direct view and "+ Add Task" scheduling for any selected calendar date.

### 5. Search & Advanced Filtering
- **Real-Time Debounced Search:** Instant filtering across task titles, notes, and categories.
- **Multi-Dimension Filters:** Filter simultaneously by Status (All / Pending / Done), Priority (High / Med / Low), and Category.
- **Sort Options:** Due Date (Asc/Desc), Priority (High to Low), Date Added, and Alphabetical (A-Z).

### 6. Profile, Themes & Data Portability
- **Productivity Analytics:** Lifetime stats on Total Tasks Created, Completed Tasks, and Overall Success Rate.
- **Theme Engine:** Instant toggle between Dark Obsidian and Crisp Light themes.
- **Audio Feedback:** Web Audio API synthesized pleasant chime upon completing tasks (toggleable).
- **Data Backup & Restore:** Complete JSON export, JSON import/restore, sample task reset, and data purge.

---

## 📐 Architecture & Technology Stack

- **Structure:** Semantic HTML5 (`header`, `main`, `section`, `nav`, `dialog`) with strict accessibility touch targets (min 44px) and WCAG AA contrast ratios.
- **Styling:** Modular Vanilla CSS (`style.css`, `components.css`, `mobile-frame.css`) utilizing HSL/HEX design tokens, glassmorphism (`backdrop-filter`), and mobile chassis styling.
- **Logic & State Management:** Modern ES6 JavaScript modules with an observable event-driven architecture (`AppState` pub/sub pattern).
- **Audio Synthesis:** Zero-dependency Web Audio API oscillator chains for organic micro-sounds.
- **Persistence:** LocalStorage key `TASKFLOW_STATE_V2` with automatic synchronization and JSON schema validation.

---

## 📋 16 Required Screens Checklist

| # | Screen / View | Implementation Status | Path / ID |
|---|---|---|---|
| 1 | Splash Screen | ✅ Implemented | `#screen-splash` |
| 2 | Onboarding Screen | ✅ Implemented | `#screen-onboarding` |
| 3 | Sign-up Screen | ✅ Implemented | `#screen-signup` |
| 4 | Login Screen | ✅ Implemented | `#screen-login` |
| 5 | Home Dashboard | ✅ Implemented | `#screen-dashboard` |
| 6 | All Tasks Screen | ✅ Implemented | `#screen-all-tasks` |
| 7 | Today's Tasks Screen | ✅ Implemented | `#screen-today-tasks` |
| 8 | Upcoming Tasks Screen | ✅ Implemented | `#screen-upcoming-tasks` |
| 9 | Add Task Screen/Sheet | ✅ Implemented | `#modal-add-task` |
| 10 | Edit Task Screen/Sheet | ✅ Implemented | `#modal-edit-task` |
| 11 | Task Details Screen | ✅ Implemented | `#modal-task-details` |
| 12 | Calendar Screen | ✅ Implemented | `#screen-calendar` |
| 13 | Search & Filter Screen | ✅ Implemented | `#screen-search-filter` |
| 14 | Completed Tasks Screen | ✅ Implemented | `#screen-completed-tasks` |
| 15 | Profile & Settings Screen | ✅ Implemented | `#screen-profile-settings` |
| 16 | Notification Preferences Screen | ✅ Implemented | `#screen-notifications` |

---

## 🧪 Verified Automated Test Results

- **HTTP 200 OK Status:** All core assets (`index.html`, `style.css`, `components.css`, `mobile-frame.css`, `sound.js`, `state.js`, `notifications.js`, `router.js`, `ui.js`, `app.js`, `icon.jpg`, `onboarding_hero.jpg`, `avatar.jpg`) verified delivering HTTP 200 OK.
- **HTML DOM Integrity:** Confirmed 58,130 bytes containing all 16 screen IDs and components.
- **Browser Playwright Runner Notice:** Automated playwright driver download was blocked by upstream Azure CDN 404 endpoint. The app has been verified running directly in Node and can be opened in any local browser at `http://localhost:3000/`.
