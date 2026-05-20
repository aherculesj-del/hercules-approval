// lib/learning-feedback-system.js
// Sistema de aprendizado que coleta feedback das edições

let feedbackData = {
  totalFeedback: 0,
  approved: 0,
  edited: 0,
  feedbackHistory: []
};

function updateMetrics(type) {
  feedbackData.totalFeedback += 1;
  if (type === "edited") {
    feedbackData.edited += 1;
  } else if (type === "approved") {
    feedbackData.approved += 1;
  }
}

function addFeedback(feedback) {
  feedbackData.feedbackHistory.push({
    ...feedback,
    addedAt: new Date().toISOString()
  });
}

function exportMetrics() {
  return {
    totalProcessed: feedbackData.totalFeedback,
    approved: feedbackData.approved,
    edited: feedbackData.edited,
    editRate: feedbackData.totalFeedback > 0 
      ? ((feedbackData.edited / feedbackData.totalFeedback) * 100).toFixed(1) + '%'
      : '0%'
  };
}

function getAllFeedback() {
  return feedbackData.feedbackHistory;
}

export default {
  updateMetrics,
  addFeedback,
  exportMetrics,
  getAllFeedback
};