const db = require('../db/database');
const config = require('../config');
const { normalizeString, generatePhoneticKey } = require('./normalize');

/**
 * Process submissions for automated verification
 * Note: No longer processing submissions since submission system was removed
 */
function processSubmissions() {
  console.log('🔄 Processing submissions for verification...');
  
  try {
    // No submissions to process since submission system was removed
    const submissions = [];
    let processedCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;
    let flaggedCount = 0;
    
    for (const submission of submissions) {
      const { id, yes_votes, no_votes } = submission;
      
      // Tier 1: Auto-verify (overwhelmingly positive)
      if (yes_votes >= config.voteThresholds.autoVerify.yes && 
          no_votes < config.voteThresholds.autoVerify.no) {
        
        console.log(`✅ Auto-verifying submission ${id} (${yes_votes} yes, ${no_votes} no)`);
        
        // Add to main units table
        const unitData = JSON.parse(submission.submitted_data);
        const unitId = db.addVerifiedUnit(unitData);
        
        // Update submission status
        db.updateSubmissionStatus(id, 'auto_verified');
        
        verifiedCount++;
        processedCount++;
        continue;
      }
      
      // Tier 2: Auto-reject (overwhelmingly negative)
      if (no_votes >= config.voteThresholds.autoReject.no) {
        console.log(`❌ Auto-rejecting submission ${id} (${no_votes} no votes)`);
        
        db.updateSubmissionStatus(id, 'rejected');
        rejectedCount++;
        processedCount++;
        continue;
      }
      
      // Tier 3: Flag for review (controversial)
      if (no_votes >= config.voteThresholds.flagged.no || 
          (yes_votes >= 5 && no_votes >= 2)) {
        
        console.log(`⚠️  Flagging submission ${id} for review (${yes_votes} yes, ${no_votes} no)`);
        
        db.updateSubmissionStatus(id, 'flagged_for_review');
        flaggedCount++;
        processedCount++;
        continue;
      }
      
      // Not enough votes yet, keep as pending
      console.log(`⏳ Submission ${id} still pending (${yes_votes} yes, ${no_votes} no)`);
    }
    
    console.log(`📊 Verification results: ${processedCount} processed, ${verifiedCount} verified, ${rejectedCount} rejected, ${flaggedCount} flagged`);
    
  } catch (error) {
    console.error('❌ Error processing submissions:', error);
  }
}

/**
 * Start the verification worker
 */
function startVerificationWorker() {
  console.log('🚀 Starting verification worker...');
  
  // Run immediately
  processSubmissions();
  
  // Then run on interval
  setInterval(processSubmissions, config.verificationInterval);
  
  console.log(`⏰ Verification worker will run every ${config.verificationInterval / 1000} seconds`);
}

/**
 * Manual verification for trusted verifiers
 */
function manualVerify(submissionId, verifierId) {
  try {
    const submission = db.getSubmissionById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    if (submission.status !== 'flagged_for_review') {
      throw new Error('Submission is not flagged for review');
    }
    
    // Add to main units table
    const unitData = JSON.parse(submission.submitted_data);
    const unitId = db.addVerifiedUnit(unitData);
    
    // Update submission status
    db.updateSubmissionStatus(submissionId, 'expert_verified');
    
    console.log(`✅ Expert verification: Submission ${submissionId} verified by ${verifierId}`);
    
    return {
      success: true,
      unitId,
      message: 'Submission verified by expert'
    };
    
  } catch (error) {
    console.error('❌ Expert verification failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manual rejection for trusted verifiers
 */
function manualReject(submissionId, verifierId, reason = '') {
  try {
    const submission = db.getSubmissionById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    // Update submission status
    db.updateSubmissionStatus(submissionId, 'rejected');
    
    console.log(`❌ Expert rejection: Submission ${submissionId} rejected by ${verifierId} - ${reason}`);
    
    return {
      success: true,
      message: 'Submission rejected by expert'
    };
    
  } catch (error) {
    console.error('❌ Expert rejection failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processSubmissions,
  startVerificationWorker,
  manualVerify,
  manualReject
};
