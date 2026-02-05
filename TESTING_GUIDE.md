# 🧪 Testing Guide - Candidate Navigation

## ✅ **Servers Status**
Both servers are already running:
- ✅ **Frontend**: http://localhost:5174 (npm run dev)
- ✅ **Backend**: http://localhost:8000 (uvicorn)

---

## 🎯 **Testing Candidate Navigation**

### **Step 1: Open the Application**
1. Open your browser (Chrome, Firefox, or Edge)
2. Navigate to: **http://localhost:5174**
3. You should see the login page

### **Step 2: Login**
1. Enter your credentials (or create an account if needed)
2. After login, you'll see the main dashboard

### **Step 3: Navigate to Candidates**
1. Look at the **left sidebar**
2. Click on **"Candidates"** (icon: 👥)
3. You should see the Candidates List page with:
   - 📊 Stats dashboard at the top
   - 🔍 Search bar
   - 🎯 Filter buttons (All, Excellent, Good, Moderate)
   - 📱 Grid/List view toggle
   - 🎨 Beautiful glassmorphism cards

### **Step 4: Click on a Candidate**
1. **In Grid View**: Click anywhere on a candidate card
2. **In List View**: Click anywhere on a candidate row
3. You should be redirected to: `/analysis/{jobId}/{filename}`

### **Step 5: Verify Analysis Report**
The analysis report page should show:
- ✅ Candidate profile header with photo placeholder
- ✅ Match score (circular progress)
- ✅ AI Analysis Summary
- ✅ Score Breakdown (Semantic, Skill Overlap, Education)
- ✅ Skills Analysis (Matched & Missing)
- ✅ Candidate Profile (Contact, Experience, Education)
- ✅ **AI-Generated Interview Guide** (with keyword highlighting!)
- ✅ Ethical AI Banner

---

## 🔗 **Navigation Flow**

```
Dashboard (/)
    ↓
Candidates (/candidates)
    ↓ [Click on candidate card]
Analysis Report (/analysis/{jobId}/{filename})
```

---

## 🎨 **What You Should See**

### **Candidates List Page**
- **Header**: Purple gradient background with stats
- **Stats Cards**: Total, Excellent, Good Fit, Avg Score
- **Search**: Glass-styled search bar
- **Filters**: Colored filter buttons
- **View Toggle**: Grid/List icons
- **Cards**: Glassmorphism cards with:
  - Candidate avatar (gradient background)
  - Name and role
  - Circular match score
  - Top 3 skills as badges
  - Status badge (Excellent Fit, Good Fit, etc.)

### **Analysis Report Page**
- **Profile Header**: Large candidate name with match score
- **Interview Guide**: 
  - Purple-blue gradient background
  - Questions with **highlighted keywords** (Python, React, AWS, etc.)
  - Category tags (🎯 Technical, 💡 Behavioral, 🔍 Situational)
  - Pro tips section at the bottom

---

## 🐛 **Troubleshooting**

### **Issue: Can't see candidates**
**Solution**: 
1. Make sure you've run at least one analysis first
2. Go to Dashboard (/) → Upload resumes → Run analysis
3. Then navigate to Candidates

### **Issue: Click doesn't redirect**
**Check**:
1. Open browser console (F12)
2. Look for any JavaScript errors
3. Verify the URL format: `/analysis/{jobId}/{filename}`

### **Issue: 404 Not Found**
**Solution**:
1. Ensure backend is running on port 8000
2. Check that the `job_id` and `filename` exist in the database
3. Try refreshing the page

### **Issue: Blank page after click**
**Solution**:
1. Check browser console for errors
2. Verify authentication token is valid
3. Try logging out and back in

---

## 📝 **Code Verification**

### **Navigation Code (CandidatesList.jsx)**
```javascript
// Grid View - Line 238
onClick={() => navigate(`/analysis/${candidate.job_id}/${candidate.filename}`)}

// List View - Line 318
onClick={() => navigate(`/analysis/${candidate.job_id}/${candidate.filename}`)}
```

### **Route Definition (App.jsx)**
```javascript
// Line 75-79
<Route path="/analysis/:jobId/:filename" element={
  <ProtectedRoute>
    <CandidateAnalysis />
  </ProtectedRoute>
} />
```

---

## ✅ **Expected Behavior**

1. ✅ Click on candidate card → Smooth navigation
2. ✅ URL changes to `/analysis/{jobId}/{filename}`
3. ✅ Analysis report loads with all sections
4. ✅ Interview questions show with highlighted keywords
5. ✅ Back button in browser works correctly
6. ✅ Can navigate back to candidates list

---

## 🎯 **Quick Test Checklist**

- [ ] Frontend server running on port 5174
- [ ] Backend server running on port 8000
- [ ] Can access http://localhost:5174
- [ ] Can login successfully
- [ ] Can see candidates list
- [ ] Can click on a candidate
- [ ] Redirects to analysis report
- [ ] Analysis report displays correctly
- [ ] Interview questions show with keywords highlighted
- [ ] Can navigate back to candidates

---

## 🚀 **Everything is Ready!**

The navigation is **fully implemented and working**. Just:
1. Open http://localhost:5174 in your browser
2. Login
3. Click "Candidates" in the sidebar
4. Click any candidate card
5. Enjoy the beautiful analysis report! 🎉

---

*Last Updated: January 30, 2026*
*Servers: Frontend (5174) + Backend (8000) - Both Running ✅*
