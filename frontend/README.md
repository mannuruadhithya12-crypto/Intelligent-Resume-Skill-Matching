# Resume Skill Matching Frontend

A modern React-based web application for the Intelligent Resume Skill Matching System. This frontend provides an intuitive interface for recruiters and job seekers to analyze resumes against job descriptions using advanced AI and NLP technologies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## ✨ Features

### 📊 Resume Analysis Dashboard
- **Real-time Matching**: Instant resume-job matching scores
- **Visual Analytics**: Interactive charts and graphs for score breakdown
- **Skill Mapping**: Visual representation of skill alignment
- **Experience Timeline**: Professional experience visualization

### 📤 File Upload & Processing
- **Multi-format Support**: PDF, DOCX, TXT file upload
- **Drag & Drop Interface**: Intuitive file upload experience
- **Progress Tracking**: Real-time processing status
- **Batch Upload**: Process multiple resumes simultaneously

### 🎯 Intelligent Matching
- **Semantic Analysis**: AI-powered semantic matching (not just keywords)
- **Skill Gap Analysis**: Identify missing skills and get recommendations
- **Experience Weighting**: Experience-adjusted matching scores
- **Bias-Free Matching**: Anonymized evaluation focusing on skills

### 📈 Advanced Analytics
- **Score Breakdown**: Detailed breakdown of skill, experience, and education scores
- **Candidate Ranking**: Comparative analysis across multiple candidates
- **Historical Tracking**: Track analysis history and trends
- **Export Reports**: Download detailed analysis reports

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between interface themes
- **Real-time Updates**: Live updates without page refresh
- **Accessibility**: WCAG compliant interface

## 🏗️ Technical Architecture

### Technology Stack
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization and analytics
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing
- **React Hook Form**: Form handling and validation

### Project Structure
```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Generic components (Button, Modal, etc.)
│   │   ├── upload/           # File upload components
│   │   ├── analysis/         # Analysis result components
│   │   └── charts/           # Data visualization components
│   ├── pages/                # Page-level components
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── Upload.jsx        # Resume upload page
│   │   ├── Analysis.jsx      # Results page
│   │   └── Settings.jsx      # User settings
│   ├── hooks/                # Custom React hooks
│   │   ├── useApi.js         # API communication hook
│   │   ├── useAuth.js        # Authentication hook
│   │   └── useFileUpload.js  # File upload management
│   ├── services/             # External service integrations
│   │   ├── api.js            # API client configuration
│   │   └── auth.js           # Authentication service
│   ├── utils/                # Utility functions
│   ├── styles/               # Global styles and CSS
│   └── App.jsx               # Main application component
├── public/                   # Static assets
└── dist/                     # Production build output
```

## 🔧 Development

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Resume Skill Matcher
VITE_APP_VERSION=1.0.0
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Quality
- **ESLint**: JavaScript/JSX linting with React rules
- **Prettier**: Code formatting (configured)
- **Husky**: Git hooks for pre-commit checks

## 🎯 Key Components

### FileUpload Component
- Handles drag-and-drop file uploads
- Supports multiple file formats
- Provides upload progress feedback
- Validates file types and sizes

### AnalysisResults Component
- Displays matching scores and rankings
- Shows skill gap analysis
- Provides visual charts and graphs
- Offers actionable recommendations

### Dashboard Component
- Overview of recent analyses
- Quick access to key metrics
- Historical trends and patterns
- User statistics and insights

## 📊 Data Visualization

The application uses Chart.js for creating interactive visualizations:

- **Pie Charts**: Skill score breakdown
- **Bar Charts**: Experience and education comparison
- **Line Charts**: Historical matching trends
- **Radar Charts**: Multi-dimensional skill analysis

## 🔐 Authentication

The frontend integrates with JWT-based authentication:

- Login/logout functionality
- Token management and refresh
- Protected routes and components
- User session management

## 🌐 API Integration

The frontend communicates with the FastAPI backend:

- RESTful API calls using Axios
- Real-time updates with WebSockets
- Error handling and retry logic
- Request/response interceptors

## 📱 Responsive Design

The application is fully responsive:

- **Mobile-first approach**: Designed for mobile devices first
- **Breakpoints**: Tailwind's responsive breakpoints (sm, md, lg, xl)
- **Touch-friendly**: Optimized for touch interactions
- **Progressive enhancement**: Works on all modern browsers

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Micro-interactions**: Subtle animations and transitions
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Tooltips**: Helpful context information

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```
The build output will be in the `dist/` directory.

### Deployment Options
- **Static Hosting**: Deploy to Netlify, Vercel, or GitHub Pages
- **Docker**: Use the provided Dockerfile
- **CDN**: Upload `dist/` to any CDN

## 🚀 Performance

- **Bundle Size**: Optimized with tree-shaking and code splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: Proper cache headers and service worker
- **Core Web Vitals**: Optimized for performance metrics

## 🔒 Security

- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Anti-CSRF tokens
- **Content Security Policy**: Strict CSP headers
- **HTTPS Only**: Production uses HTTPS only

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Ensure accessibility compliance
5. Test on multiple devices and browsers

## 📄 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)
