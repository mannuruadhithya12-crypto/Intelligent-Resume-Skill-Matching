import React from 'react';
import ResumeAnalysisPage from './ResumeAnalysisPage';

// Wrapper to maintain backward compatibility with App.jsx which imports UploadForm
const UploadForm = (props) => {
    return <ResumeAnalysisPage {...props} />;
};

export default UploadForm;
