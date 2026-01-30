# 24-Hour Analysis History & Enhanced Analytics

## Overview
This implementation provides comprehensive analysis history tracking with automatic 24-hour retention, delete functionality, and enhanced analytics with detailed charts.

## Features Implemented

### 1. **Persistent History Database** (`api/history_db.py`)
- SQLite database for storing analysis jobs
- Automatic cleanup of records older than 24 hours
- Three main tables:
  - `analysis_jobs`: Main job records with metadata
  - `candidate_results`: Detailed candidate scoring data
  - `analytics_summary`: Aggregated daily statistics

### 2. **Backend API Enhancements** (`api/main.py`)
- **New Endpoints:**
  - `GET /api/history` - Retrieve analysis history (last 24 hours)
  - `DELETE /api/history/{job_id}` - Delete specific analysis
  - `GET /api/analytics/detailed` - Get detailed analytics with charts data
  
- **Enhanced Analytics:**
  - Total analyses count
  - Total resumes processed by AI engine
  - Success/failure rates
  - Average processing time
  - Daily and hourly breakdowns

### 3. **History Page** (`frontend/src/pages/HistoryPage.jsx`)
- **Features:**
  - View all analyses from last 24 hours
  - Delete individual analyses with confirmation
  - Status indicators (completed, failed, processing)
  - Detailed metrics per analysis:
    - Resume count
    - Average match score
    - Processing time
    - Top candidate
    - Error messages (if failed)
  - Relative timestamps ("2 hours ago")

### 4. **Enhanced Analytics Dashboard** (`frontend/src/components/AnalyticsDashboard.jsx`)
- **New Charts:**
  - **Success Rate Doughnut Chart** - Visual success/failure ratio
  - **7-Day Trend Line Chart** - Analyses and resumes over time
  - **Hourly Activity Bar Chart** - Last 12 hours breakdown
  - **Skills Demand Bar Chart** - Top skills in demand
  
- **Enhanced Metrics:**
  - Total resumes processed by AI engine
  - Average processing time per analysis
  - Model health indicators
  - Success rate percentage

### 5. **Navigation Updates**
- Added "History" menu item in sidebar
- Route: `/history`
- Icon: Clock (FiClock)
- Available to all authenticated users

## Data Retention

### Automatic Cleanup
- Analysis records are automatically deleted after **24 hours**
- Cleanup runs on every history fetch
- Orphaned candidate results are also removed

### Manual Deletion
- Users can delete analyses immediately via the History page
- Deletes both job record and all associated candidate results
- Requires confirmation before deletion

## Analytics Insights

### What Gets Tracked
1. **Per Analysis:**
   - Job ID
   - User email
   - Job description filename
   - Number of resumes
   - Status (processing, completed, failed)
   - Processing time
   - Average match score
   - Top candidate
   - Error messages

2. **Aggregated Metrics:**
   - Total analyses (7-day window)
   - Total resumes processed
   - Overall average score
   - Success/failure counts
   - Average processing time
   - Daily trends
   - Hourly activity (last 24 hours)

## Database Schema

### analysis_jobs
```sql
- job_id (TEXT, PRIMARY KEY)
- user_email (TEXT)
- jd_filename (TEXT)
- resume_count (INTEGER)
- status (TEXT: 'processing', 'completed', 'failed')
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- processing_time (REAL)
- avg_score (REAL)
- top_candidate (TEXT)
- error_message (TEXT)
```

### candidate_results
```sql
- id (INTEGER, PRIMARY KEY)
- job_id (TEXT, FOREIGN KEY)
- filename (TEXT)
- final_score (REAL)
- semantic_score (REAL)
- experience_score (REAL)
- education_score (REAL)
- rank (INTEGER)
```

## Usage

### Viewing History
1. Navigate to **History** in the sidebar
2. View all analyses from the last 24 hours
3. See detailed metrics for each analysis
4. Click trash icon to delete an analysis

### Viewing Analytics
1. Navigate to **Analytics** (Admin/HR Manager only)
2. View comprehensive dashboard with:
   - Real-time statistics
   - Success rate visualization
   - 7-day trend analysis
   - Hourly activity breakdown
   - Model health metrics

### API Usage

#### Get History
```javascript
const response = await api.get('/history', {
  params: { limit: 50 }
});
```

#### Delete Analysis
```javascript
await api.delete(`/history/${jobId}`);
```

#### Get Detailed Analytics
```javascript
const response = await api.get('/analytics/detailed', {
  params: { days: 7 }
});
```

## Benefits

1. **Transparency**: Users can see all their recent analyses
2. **Data Management**: Easy cleanup of unwanted analyses
3. **Performance Tracking**: Monitor AI engine usage and performance
4. **Trend Analysis**: Identify patterns in hiring activity
5. **Resource Planning**: Understand peak usage times
6. **Quality Assurance**: Track success rates and model health

## Technical Notes

- Database file: `analysis_history.db` (created automatically)
- Cleanup is triggered on every `/api/history` call
- Charts use Chart.js with responsive design
- All timestamps are in UTC
- Frontend displays relative times for better UX
- Admin users see all analyses; others see only their own
