const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('authToken');

if (!token) {
    window.location.href = 'Home.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'Home.html';
});

let currentFilter = 'all';

// Load tickets
async function loadTickets(filter = 'all') {
    const container = document.getElementById('ticketsContainer');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Laster tickets...</p></div>';
    emptyState.style.display = 'none';
    
    try {
        const url = filter === 'all' ? '/api/tickets/my' : `/api/tickets/my?status=${filter}`;
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success && data.tickets.length > 0) {
            container.innerHTML = data.tickets.map(ticket => `
                <div class="ticket-card" onclick="window.location.href='ticket-detail.html?id=${ticket.id}'">
                    <div class="ticket-card-header">
                        <div>
                            <h3 class="ticket-card-title">${ticket.title}</h3>
                            <div class="ticket-card-meta">
                                <span class="ticket-badge status-${ticket.status}">${translateStatus(ticket.status)}</span>
                                <span class="ticket-badge priority-${ticket.priority}">${translatePriority(ticket.priority)}</span>
                                <span class="ticket-badge category">${translateCategory(ticket.category)}</span>
                            </div>
                        </div>
                    </div>
                    <p class="ticket-card-description">${ticket.description}</p>
                    <div class="ticket-card-footer">
                        <span class="ticket-id">#${ticket.id}</span>
                        <span>${formatDate(ticket.created_at)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p style="text-align:center;color:red;">Kunne ikke laste tickets</p>';
    }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTickets(btn.dataset.filter);
    });
});

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
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

loadTickets();