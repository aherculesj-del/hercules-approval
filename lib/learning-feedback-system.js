// hercules-approval/lib/learning-feedback-system.js
export class LearningFeedbackSystem {
  constructor() {
    this.feedback = [];
    this.metrics = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      averageQuality: 0
    };
  }

  recordFeedback(articleId, feedback) {
    this.feedback.push({
      articleId,
      timestamp: new Date().toISOString(),
      quality: feedback.quality || 0,
      relevance: feedback.relevance || 0,
      tone: feedback.tone || "neutral",
      notes: feedback.notes || "",
      approved: feedback.approved || false
    });
  }

  updateMetrics(success = true) {
    this.metrics.totalProcessed++;
    if (success) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
    }
  }

  getAverageQuality() {
    if (this.feedback.length === 0) return 0;
    const avgQuality = this.feedback.reduce((sum, f) => sum + f.quality, 0) / this.feedback.length;
    this.metrics.averageQuality = avgQuality;
    return avgQuality;
  }

  exportMetrics() {
    return {
      ...this.metrics,
      feedbackCount: this.feedback.length,
      successRate: this.metrics.totalProcessed > 0 
        ? (this.metrics.successful / this.metrics.totalProcessed * 100).toFixed(2) + '%'
        : '0%',
      averageQuality: this.getAverageQuality().toFixed(2)
    };
  }
}

export default new LearningFeedbackSystem();