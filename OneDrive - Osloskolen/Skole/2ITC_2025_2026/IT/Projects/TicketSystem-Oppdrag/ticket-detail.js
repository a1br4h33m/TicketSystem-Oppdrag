const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('authToken');
const ticketId = new URLSearchParams(window.location.search).get('id');

if (!token || !ticketId) {
    window.location.href = 'Home.html';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'Home.html';
});

async function loadTicket() {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const ticket = data.ticket;
            
            document.getElementById('ticketTitle').textContent = ticket.title;
            document.getElementById('ticketDescription').textContent = ticket.description;
            
            document.getElementById('ticketMeta').innerHTML = `
                <span><strong>ID:</strong> #${ticket.id}</span>
                <span><strong>Kategori:</strong> ${translateCategory(ticket.category)}</span>
                <span><strong>Opprettet:</strong> ${formatDate(ticket.created_at)}</span>
            `;
            
            const statusSection = document.getElementById('ticketStatusSection');
            statusSection.innerHTML = `
                <span class="ticket-badge status-${ticket.status}">${translateStatus(ticket.status)}</span>
                <span class="ticket-badge priority-${ticket.priority}">${translatePriority(ticket.priority)}</span>
            `;
            
            // Add status dropdown for support/admin
            if (user.user_type === 'support' || user.user_type === 'admin') {
                const select = document.createElement('select');
                select.className = 'status-dropdown';
                select.innerHTML = `
                    <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Åpen</option>
                    <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>Under arbeid</option>
                    <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Løst</option>
                    <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Lukket</option>
                `;
                select.addEventListener('change', (e) => updateStatus(e.target.value));
                statusSection.appendChild(select);
            }
            
            loadComments(ticket.comments || []);
            
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('ticketContent').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function loadComments(comments) {
    const list = document.getElementById('commentsList');
    document.getElementById('commentCount').textContent = `(${comments.length})`;
    
    if (comments.length === 0) {
        list.innerHTML = '<p class="no-comments">Ingen kommentarer ennå.</p>';
        return;
    }
    
    list.innerHTML = comments.map(comment => `
        <div class="comment-item ${comment.user_type === 'support' || comment.user_type === 'admin' ? 'support-comment' : ''}">
            <div class="comment-header">
                <span class="comment-author ${comment.user_type === 'support' || comment.user_type === 'admin' ? 'support' : ''}">
                    ${comment.username}${comment.user_type === 'support' || comment.user_type === 'admin' ? ' (Support)' : ''}
                </span>
                <span class="comment-date">${formatDate(comment.created_at)}</span>
            </div>
            <p class="comment-text">${comment.comment}</p>
        </div>
    `).join('');
}

document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) return;
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ comment: commentText })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('commentText').value = '';
            loadTicket(); // Reload to show new comment
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function updateStatus(newStatus) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadTicket();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function translateStatus(status) {
    const map = { 'open': 'Åpen', 'in_progress': 'Under arbeid', 'resolved': 'Løst', 'closed': 'Lukket' };
    return map[status] || status;
}

function translatePriority(priority) {
    const map = { 'low': 'Lav', 'medium': 'Middels', 'high': 'Høy', 'urgent': 'Haster' };
    return map[priority] || priority;
}

function translateCategory(category) {
    const map = { 'technical': 'Teknisk', 'billing': 'Faktura', 'account': 'Konto', 'other': 'Annet' };
    return map[category] || category;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('no-NO', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

loadTicket();