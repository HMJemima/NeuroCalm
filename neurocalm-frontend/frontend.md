# NeuroCalm Frontend - Complete Development Prompt for Claude Code

## Project Overview

Build a modern, dark-themed React frontend for **NeuroCalm** - an AI-powered EEG Stress Detection platform. Users can upload EEG files (.mat, .edf, .csv) and get instant stress analysis results.

## Tech Stack

- **Framework**: React 18+ with Vite
- **Package Manager**: Yarn
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand (or React Context)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

---


## Design System
]
### Color Palette (CSS Variables)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0f1c;
  --bg-secondary: #111827;
  --bg-card: rgba(17, 24, 39, 0.7);
  --bg-glass: rgba(255, 255, 255, 0.03);
  
  /* Borders */
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(59, 130, 246, 0.3);
  
  /* Text */
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  
  /* Accent Colors */
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --accent-yellow: #f59e0b;
  --accent-red: #ef4444;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #3b82f6, #8b5cf6);
  --gradient-success: linear-gradient(135deg, #10b981, #06b6d4);
  --gradient-danger: linear-gradient(135deg, #ef4444, #f59e0b);
  
  /* Shadows */
  --shadow-glow: 0 0 60px rgba(59, 130, 246, 0.15);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0f1c',
        'bg-secondary': '#111827',
        'bg-card': 'rgba(17, 24, 39, 0.7)',
        'bg-glass': 'rgba(255, 255, 255, 0.03)',
        'border-color': 'rgba(255, 255, 255, 0.08)',
        'text-primary': '#f9fafb',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',
        'accent-blue': '#3b82f6',
        'accent-purple': '#8b5cf6',
        'accent-cyan': '#06b6d4',
        'accent-green': '#10b981',
        'accent-yellow': '#f59e0b',
        'accent-red': '#ef4444',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'sans-serif'],
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
}
```

### Typography

- **Headings**: Space Grotesk (font-display), weights: 600, 700
- **Body**: Inter (font-sans), weights: 400, 500, 600
- **Font sizes**:
  - h1: 64px (landing), 28px (dashboard)
  - h2: 42px (section titles)
  - h3: 18px (card titles)
  - body: 14px
  - small: 12px, 11px
  - labels: 11px uppercase, letter-spacing: 1px

---

## Project Structure

```
src/
├── assets/
│   └── fonts/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Avatar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Modal.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── BackgroundEffects.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── SocialButtons.jsx
│   ├── dashboard/
│   │   ├── StatsCard.jsx
│   │   ├── UploadZone.jsx
│   │   ├── AnalysisResult.jsx
│   │   ├── BandPowerChart.jsx
│   │   └── HistoryTable.jsx
│   └── admin/
│       ├── UsersTable.jsx
│       ├── SystemStats.jsx
│       ├── ActivityFeed.jsx
│       └── ModelInfo.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── DashboardPage.jsx
│   ├── HistoryPage.jsx
│   ├── SettingsPage.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminUsers.jsx
│       └── AdminAnalytics.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useAnalysis.js
│   └── useAdmin.js
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── analysisService.js
│   └── adminService.js
├── store/
│   ├── authStore.js
│   └── analysisStore.js
├── utils/
│   ├── constants.js
│   └── helpers.js
├── App.jsx
├── main.jsx
└── index.css
```

---

## Component Specifications

### 1. BackgroundEffects Component

Animated gradient orbs for visual depth:

```jsx
// Floating gradient orbs positioned absolute
// 3 orbs with different colors and positions:
// - Orb 1: Blue (#3b82f6), top-right, 600px, blur 100px
// - Orb 2: Purple (#8b5cf6), bottom-left, 500px, blur 100px  
// - Orb 3: Cyan (#06b6d4), center, 400px, blur 100px
// All orbs: opacity 0.3-0.4, animate-float with staggered delays
```

### 2. Sidebar Component (Dashboard)

```
Width: 260px (desktop), collapsible on mobile
Background: bg-card with backdrop-blur
Border: 1px solid border-color on right

Structure:
├── Logo Section
│   ├── Logo Icon (gradient blue-purple, rounded-xl, 40x40px)
│   └── "NeuroCalm" text (font-display, 22px, font-bold)
│
├── Navigation Sections
│   ├── Section Label ("MENU", "ACCOUNT" - 11px uppercase, text-muted)
│   └── Nav Items
│       ├── Icon (18px, lucide-react)
│       ├── Label (14px, font-medium)
│       └── Optional Badge (for notifications)
│       
│       States:
│       - Default: text-secondary, transparent bg
│       - Hover: bg-glass, text-primary
│       - Active: bg-blue-500/10, text-accent-blue, left border 3px blue
│
└── User Profile (bottom, border-top)
    ├── Avatar (38x38, gradient, rounded-xl, initials)
    ├── Name (13px, font-semibold)
    └── Email/Status (11px, text-muted)
```

Navigation Items:
- Dashboard (Home icon)
- New Analysis (Upload icon)
- History (History icon)
- Reports (BarChart icon)
- Settings (Settings icon)
- Help (HelpCircle icon)
- Logout (LogOut icon)

### 3. UploadZone Component

```
Container: Dashed border (2px), rounded-2xl, padding 48px
Background: transparent
Border Color: border-color (default), accent-blue (hover), accent-green (dragover)

Structure:
├── Upload Icon (80x80px, gradient bg, rounded-2xl, Upload icon 32px)
├── Title: "Drag & Drop your EEG file here" (18px, font-semibold)
├── Subtitle: "or click to browse from your computer" (14px, text-secondary)
├── Format Badges: .mat, .edf, .csv (bg-glass, border, rounded-lg, 12px)
└── Browse Button (gradient primary, rounded-xl, padding 12px 24px)

States:
- Default: dashed border
- Hover: border-accent-blue, bg-blue-500/5
- Drag Over: border-accent-green, bg-green-500/10
- File Selected: Show file preview card

File Preview Card:
├── File Icon (48x48, bg-blue-500/10, rounded-xl)
├── File Name (14px, font-semibold)
├── File Meta: "2.4 MB • 32 channels • 60 seconds" (12px, text-muted)
├── Remove Button (X icon, bg-red-500/10, text-red)
└── Analyze Button (full-width, gradient green-cyan, "Analyze Stress Level")
```

### 4. AnalysisResult Component (Stress Meter)

```
Main Ring:
- SVG circle, 180x180px
- Background ring: stroke rgba(255,255,255,0.05), stroke-width 14
- Progress ring: stroke gradient (green for relaxed, red for stressed)
- Stroke-dasharray animation for progress

Center Content:
├── Score Value (48px, font-display, font-bold, color based on result)
│   - Relaxed (0-40): accent-green
│   - Moderate (41-60): accent-yellow
│   - Stressed (61-100): accent-red
├── Label: "Relaxed" / "Stressed" (16px, font-semibold, same color)
└── Confidence Badge: "87% confidence" (bg-glass, rounded-full, 12px)

Bottom Stats Row (3 columns):
├── Confidence: "87%" + "Confidence"
├── Stress Prob: "13%" + "Stress Prob"
└── Features: "1222" + "Features"
```

### 5. BandPowerChart Component

```
5 Band Power Bars (vertical layout):

Each Bar:
├── Color Dot (12x12, rounded)
├── Band Info
│   ├── Name: Delta/Theta/Alpha/Beta/Gamma (13px, font-medium)
│   └── Frequency: "0.5-4 Hz" etc (11px, text-muted)
├── Progress Bar Container (flex-1, h-10px, bg-glass, rounded)
│   └── Progress Fill (height 100%, gradient, rounded)
└── Value: "35%" (50px, text-right, 13px, font-semibold)

Colors:
- Delta: #6366f1 (indigo)
- Theta: #8b5cf6 (purple)
- Alpha: #06b6d4 (cyan)
- Beta: #10b981 (green)
- Gamma: #f59e0b (yellow)
```

### 6. HistoryTable Component

```
Table Container: bg-card, rounded-2xl, border

Header Row:
- Columns: File Name, Date, Result, Confidence, Actions
- Style: 11px uppercase, text-muted, letter-spacing 0.5px

Body Rows:
├── File Cell
│   ├── Icon (36x36, bg-blue-500/10, rounded-lg)
│   └── Filename (14px)
├── Date: "Today, 10:30 AM" (14px)
├── Result Badge
│   - Relaxed: bg-green-500/10, text-green, CheckCircle icon
│   - Stressed: bg-red-500/10, text-red, AlertCircle icon
├── Confidence: "87%" (14px)
└── Actions
    ├── View (Eye icon)
    ├── Download (Download icon)
    └── Delete (Trash icon)
    
    Action buttons: 32x32, rounded-lg, border, hover:border-blue
```

### 7. StatsCard Component

```
Container: bg-card, rounded-2xl, padding 20px, border

Structure:
├── Header Row (flex, justify-between)
│   ├── Icon (44x44, rounded-xl, bg with opacity)
│   └── Change Badge: "+12%" or "-5%"
│       - Positive: bg-green-500/10, text-green
│       - Negative: bg-red-500/10, text-red
├── Value (font-display, 28px, font-bold)
└── Label (13px, text-secondary)

Hover: border-color changes to accent-blue/30, translateY(-2px)
```

---

## Page Layouts

### 1. Landing Page (Non-Authenticated)

```
Full Layout:
├── Navbar (fixed top)
│   ├── Logo
│   ├── Nav Links: Features, How It Works, Pricing, Research, Contact
│   └── Buttons: "Log In" (ghost), "Get Started" (primary)
│
├── Hero Section (min-height: 100vh)
│   ├── Left Content (max-width: 650px)
│   │   ├── Badge: "AI-Powered EEG Analysis" (bg-blue-500/10, border)
│   │   ├── H1: "Detect Stress with Brain Science" (64px)
│   │   │   └── "Brain Science" in gradient text
│   │   ├── Description (18px, text-secondary)
│   │   ├── CTA Buttons: "Try Free Analysis", "Watch Demo"
│   │   └── Stats Row: "95% Accuracy", "10K+ Analyses", "<30s Processing"
│   │
│   └── Right Visual (absolute, 550px)
│       └── Demo Result Card (showing sample analysis)
│
├── Features Section
│   ├── Section Header: Badge + Title + Description
│   └── 6 Feature Cards (3x2 grid)
│       - Easy File Upload
│       - AI-Powered Detection
│       - Detailed Reports
│       - Secure & Private
│       - Analysis History
│       - Export Results
│
├── How It Works Section (different bg)
│   └── 4 Step Cards (horizontal)
│       1. Create Account
│       2. Upload EEG File
│       3. AI Processing
│       4. Get Results
│
├── CTA Section
│   └── CTA Box (gradient border, centered)
│
└── Footer
    ├── Logo + Copyright
    ├── Links: Privacy, Terms, Docs, Support
    └── Social Icons
```

### 2. Login/Signup Page

```
Split Layout (50/50):

Left Panel (Brand):
├── Logo (large, 64px icon)
├── Tagline: "Understand Your Brain, Control Your Stress" (28px)
├── Description (16px, text-secondary)
└── Feature List (3 items with icons)
    - Easy Upload
    - Fast Processing
    - Detailed Reports

Right Panel (Auth Form):
├── Tab Switcher: "Log In" | "Sign Up"
├── Form Header
│   ├── Title: "Welcome back!" / "Create Account"
│   └── Subtitle
├── Form Fields
│   ├── Email (with icon)
│   ├── Password (with icon + toggle visibility)
│   └── [Signup: Full Name, Confirm Password]
├── Remember Me + Forgot Password (login only)
├── Submit Button (full-width, gradient)
├── Divider: "or continue with"
├── Social Buttons: Google, GitHub, Microsoft
└── Footer Link: "Don't have account? Sign up"
```

### 3. User Dashboard

```
Layout with Sidebar:

├── Sidebar (260px, fixed)
│
└── Main Content (margin-left: 260px, padding: 32px)
    │
    ├── Header
    │   ├── Left: "Welcome back, [Name] 👋" + subtitle
    │   └── Right: Search, Notifications, [Actions]
    │
    ├── Upload Section (2 columns: 1fr 400px)
    │   ├── Upload Zone Card
    │   └── Quick Stats Card (4 stat items vertical)
    │
    ├── Results Section (shown after analysis, 2 columns)
    │   ├── Stress Result Card (ring + stats)
    │   └── Band Power Chart Card
    │
    └── History Section
        └── Recent Analyses Table
```

### 4. Admin Dashboard

```
Layout with Sidebar (admin variant):

├── Sidebar
│   ├── Logo + "ADMIN PANEL" badge (red)
│   ├── Nav: Dashboard, Analytics, Users, Analyses, ML Model, Server, Settings
│   └── Admin Profile
│
└── Main Content
    │
    ├── Header: "Admin Dashboard" + description
    │
    ├── Stats Grid (4 columns)
    │   ├── Total Users
    │   ├── Total Analyses
    │   ├── Avg Processing Time
    │   └── Model Accuracy
    │
    ├── Main Grid (2 columns: 1fr 400px)
    │   │
    │   ├── Left Column
    │   │   ├── Users Table Card
    │   │   │   ├── Header: Title + "Add User" button
    │   │   │   └── Table: User, Role, Analyses, Status, Joined, Actions
    │   │   │
    │   │   └── Analytics Chart Card (bar chart)
    │   │
    │   └── Right Column
    │       ├── Activity Feed Card
    │       │   └── Activity Items (icon + text + time)
    │       │
    │       ├── System Status Card
    │       │   └── 4 Progress Bars: CPU, Memory, Storage, GPU
    │       │
    │       ├── ML Model Info Card
    │       │   └── Key-value pairs: Type, Version, Accuracy, Features
    │       │
    │       └── Quick Actions Card (2x2 grid)
    │           - Add User, Export Data, Update Model, Security
```

---

## API Integration

### Base API Setup

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token or redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Endpoints to Implement

```javascript
// Auth
POST /auth/register - { email, password, full_name }
POST /auth/login - { username, password } (form data)
POST /auth/refresh - { refresh_token }

// User
GET /users/me
PUT /users/me
GET /users/me/stats

// Analysis
POST /analysis/upload - FormData with file
GET /analysis/{id}
DELETE /analysis/{id}

// History
GET /history?page=1&page_size=10

// Reports
GET /reports/{id}/pdf
GET /reports/{id}/json

// Admin
GET /admin/stats
GET /admin/users?page=1&page_size=20
PUT /admin/users/{id}
DELETE /admin/users/{id}
GET /admin/model
```

---

## State Management (Zustand)

```javascript
// src/store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));

// src/store/analysisStore.js
const useAnalysisStore = create((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  uploadProgress: 0,
  history: [],
  
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setProgress: (progress) => set({ uploadProgress: progress }),
  setHistory: (history) => set({ history }),
}));
```

---

## Routing Setup

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes (Authenticated Users) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Important UI Details

### Card Styles
```css
.card {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 60px rgba(59, 130, 246, 0.15);
}
```

### Button Variants
```css
/* Primary - Gradient */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.btn-ghost:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* Success */
.btn-success {
  background: linear-gradient(135deg, #10b981, #06b6d4);
}

/* Danger */
.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### Input Styles
```css
.input {
  width: 100%;
  padding: 14px 16px;
  padding-left: 44px; /* if has icon */
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #f9fafb;
  font-size: 14px;
}
.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.input::placeholder {
  color: #6b7280;
}
```

### Status Badges
```css
/* Relaxed */
.badge-relaxed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Stressed */
.badge-stressed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Moderate */
.badge-moderate {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}
```

---

## File Upload Implementation

```jsx
// Key functionality for UploadZone
const handleDrop = async (e) => {
  e.preventDefault();
  setIsDragOver(false);
  
  const file = e.dataTransfer.files[0];
  if (file && isValidFile(file)) {
    setSelectedFile(file);
  }
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file && isValidFile(file)) {
    setSelectedFile(file);
  }
};

const isValidFile = (file) => {
  const validExtensions = ['.mat', '.edf', '.csv'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  return validExtensions.includes(extension);
};

const handleAnalyze = async () => {
  const formData = new FormData();
  formData.append('file', selectedFile);
  
  try {
    setIsAnalyzing(true);
    const response = await api.post('/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => setProgress((e.loaded / e.total) * 100),
    });
    setResult(response.data);
  } catch (error) {
    // Handle error
  } finally {
    setIsAnalyzing(false);
  }
};
```

---

## Animation Guidelines (Framer Motion)

```jsx
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Card hover
const cardVariants = {
  hover: { 
    y: -4, 
    boxShadow: '0 0 60px rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
};

// Stagger children
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

// Progress ring animation
const ringVariants = {
  initial: { strokeDashoffset: 565 },
  animate: { strokeDashoffset: targetOffset, transition: { duration: 1 } },
};
```

---

## Environment Variables

```env
# .env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=NeuroCalm
```

---

## Summary Checklist

Build the following pages in order:

1. [ ] Setup project with Vite + React + Tailwind
2. [ ] Create global styles (index.css with CSS variables)
3. [ ] Build common components (Button, Card, Input, Badge, Avatar)
4. [ ] Build BackgroundEffects component
5. [ ] Build Navbar component
6. [ ] Build LandingPage
7. [ ] Build LoginPage + SignupPage
8. [ ] Build Sidebar component
9. [ ] Build UploadZone component
10. [ ] Build AnalysisResult component (stress ring)
11. [ ] Build BandPowerChart component
12. [ ] Build HistoryTable component
13. [ ] Build StatsCard component
14. [ ] Build DashboardPage (combining all dashboard components)
15. [ ] Build AdminDashboard with admin-specific components
16. [ ] Setup routing with protected routes
17. [ ] Connect to backend API
18. [ ] Add loading states and error handling
19. [ ] Add Framer Motion animations
20. [ ] Mobile responsiveness

The design should feel modern, glassmorphic, with smooth animations and a cohesive dark theme throughout. All interactive elements should have clear hover/active states with the accent-blue color.