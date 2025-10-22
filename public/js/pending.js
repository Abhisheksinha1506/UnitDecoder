// Pending submissions page JavaScript
class PendingSubmissions {
    constructor() {
        this.submissions = [];
        this.init();
    }

    async init() {
        await this.loadSubmissions();
        this.setupVoteHandlers();
    }

    async loadSubmissions() {
        const loading = document.getElementById('loading');
        const submissionsList = document.getElementById('submissionsList');
        const emptyState = document.getElementById('emptyState');
        const errorState = document.getElementById('errorState');

        try {
            loading.style.display = 'block';
            submissionsList.style.display = 'none';
            emptyState.style.display = 'none';
            errorState.style.display = 'none';

            const response = await fetch('/api/submissions/pending');
            
            if (!response.ok) {
                throw new Error(`Failed to load submissions: ${response.status}`);
            }

            this.submissions = await response.json();
            
            loading.style.display = 'none';

            if (this.submissions.length === 0) {
                emptyState.style.display = 'block';
            } else {
                this.displaySubmissions();
                submissionsList.style.display = 'block';
            }

        } catch (error) {
            console.error('Error loading submissions:', error);
            loading.style.display = 'none';
            errorState.style.display = 'block';
            document.getElementById('errorText').textContent = error.message;
        }
    }

    displaySubmissions() {
        const container = document.getElementById('submissionsList');
        
        const submissionsHTML = this.submissions.map(submission => {
            const data = submission.submitted_data;
            const statusClass = submission.status === 'flagged_for_review' ? 'status-flagged' : 'status-pending';
            const statusText = submission.status === 'flagged_for_review' ? 'Flagged' : 'Pending';
            
            return `
                <div class="submission-card" data-submission-id="${submission.id}">
                    <div class="submission-header">
                        <h3 class="submission-title">${this.escapeHtml(data.name)}</h3>
                        <span class="submission-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="submission-details">
                        <p><strong>Category:</strong> ${this.escapeHtml(data.category)}</p>
                        <p><strong>Base Unit:</strong> ${this.escapeHtml(data.base_unit)}</p>
                        <p><strong>Conversion:</strong> 1 ${this.escapeHtml(data.name)} = ${data.conversion_factor} ${this.escapeHtml(data.base_unit)}</p>
                        ${data.region ? `<p><strong>Region:</strong> ${this.escapeHtml(data.region)}</p>` : ''}
                        ${data.era ? `<p><strong>Era:</strong> ${this.escapeHtml(data.era)}</p>` : ''}
                        <p><strong>Description:</strong> ${this.escapeHtml(data.description)}</p>
                        ${data.source_url ? `<p><strong>Source:</strong> <a href="${data.source_url}" target="_blank" rel="noopener">${this.escapeHtml(data.source_url)}</a></p>` : ''}
                    </div>
                    
                    <div class="submission-actions">
                        <div class="vote-counts">
                            <span class="yes">✓ ${submission.yes_votes || 0}</span>
                            <span class="no">✗ ${submission.no_votes || 0}</span>
                        </div>
                        
                        <button class="btn btn-success vote-btn" data-submission-id="${submission.id}" data-vote="yes">
                            Vote Yes
                        </button>
                        <button class="btn btn-danger vote-btn" data-submission-id="${submission.id}" data-vote="no">
                            Vote No
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = submissionsHTML;
    }

    setupVoteHandlers() {
        const container = document.getElementById('submissionsList');
        if (!container) return;

        container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('vote-btn')) {
                const submissionId = e.target.dataset.submissionId;
                const vote = e.target.dataset.vote;
                
                await this.submitVote(submissionId, vote, e.target);
            }
        });
    }

    async submitVote(submissionId, vote, button) {
        const originalText = button.textContent;
        
        try {
            // Disable button and show loading
            button.disabled = true;
            button.textContent = 'Voting...';

            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    submissionId: parseInt(submissionId),
                    vote: vote
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Vote failed');
            }

            // Update vote counts
            this.updateVoteCounts(submissionId, result.voteCounts);
            
            // Disable all vote buttons for this submission
            const submissionCard = button.closest('.submission-card');
            const voteButtons = submissionCard.querySelectorAll('.vote-btn');
            voteButtons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = 'Voted';
            });

            // Show success message
            this.showVoteSuccess(vote);

        } catch (error) {
            console.error('Vote error:', error);
            
            // Show error message
            this.showVoteError(error.message);
            
            // Re-enable button
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    updateVoteCounts(submissionId, voteCounts) {
        const submissionCard = document.querySelector(`[data-submission-id="${submissionId}"]`);
        if (!submissionCard) return;

        const voteCountsElement = submissionCard.querySelector('.vote-counts');
        if (voteCountsElement) {
            voteCountsElement.innerHTML = `
                <span class="yes">✓ ${voteCounts.yes_votes}</span>
                <span class="no">✗ ${voteCounts.no_votes}</span>
            `;
        }
    }

    showVoteSuccess(vote) {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.zIndex = '1000';
        message.innerHTML = `
            <p>✅ Vote recorded successfully!</p>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    showVoteError(errorMessage) {
        const message = document.createElement('div');
        message.className = 'error-message';
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.zIndex = '1000';
        message.innerHTML = `
            <p>❌ ${this.escapeHtml(errorMessage)}</p>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PendingSubmissions();
});
