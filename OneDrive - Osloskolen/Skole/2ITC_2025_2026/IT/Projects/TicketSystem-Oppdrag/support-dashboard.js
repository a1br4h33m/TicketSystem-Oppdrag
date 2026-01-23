const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('authToken');

console.log('Support Dashboard - Checking access...');
console.log('Token exists:', !!token);
console.log('User data:', user);

// Check if user is support or admin
function checkAccess() {
    if (!token) {
        console.log('No token found, redirecting to home');
        window.location.href = 'Home.html';
        return false;
    }
    
    if (!user.user_type) {
        console.log('No user_type found, redirecting to home');
        window.location.href = 'Home.html';
        return false;
    }
    
    console.log('User type:', user.user_type);
    
    if (user.user_type !== 'support' && user.user_type !== 'admin') {
        console.log('User is not support or admin, redirecting');
        alert('Denne siden er kun for support/drift brukere');
        window.location.href = 'Home.html';
        return false;
    }
    
    console.log('Access granted!');
    return true;
}

// Check access
if (!checkAccess()) {
    // Will redirect if check fails
}

// Display username
document.getElementById('userWelcome').textContent = `Hei, ${user.username}`;

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    localStorage.clear();
    window.location.href = 'Home.html';
});

let currentFilter = 'all';

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/tickets', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tickets = data.tickets;
            const openCount = tickets.filter(t => t.status === 'open').length;
            const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
            const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;
            
            // Resolved today
            const today = new Date().toISOString().split('T')[0];
            const resolvedTodayCount = tickets.filter(t => {
                if (!t.updated_at || t.status !== 'resolved') return false;
                const ticketDate = new Date(t.updated_at).toISOString().split('T')[0];
                return ticketDate === today;
            }).length;
            
            document.getElementById('openCount').textContent = openCount;
            document.getElementById('inProgressCount').textContent = inProgressCount;
            document.getElementById('resolvedTodayCount').textContent = resolvedTodayCount;
            document.getElementById('urgentCount').textContent = urgentCount;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load tickets
async function loadTickets(filter = 'all') {
    const container = document.getElementById('ticketsContainer');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Laster tickets...</p></div>';
    emptyState.style.display = 'none';
    
    try {
        let url = '/api/tickets';
        if (filter !== 'all' && filter !== 'urgent') {
            url += `?status=${filter}`;
        }
        
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            let tickets = data.tickets;
            
            // Filter urgent tickets
            if (filter === 'urgent') {
                tickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved');
            }
            
            if (tickets.length > 0) {
                container.innerHTML = tickets.map(ticket => `
                    <div class="ticket-card support-ticket-card priority-${ticket.priority}" onclick="window.location.href='ticket-detail.html?id=${ticket.id}'">
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
                            <span><strong>Kunde:</strong> ${ticket.username || ticket.email}</span>
                            <span>${formatDate(ticket.created_at)}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '';
                emptyState.style.display = 'flex';
            }
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
        currentFilter = btn.dataset.filter;
        loadTickets(currentFilter);
    });
});

// Quick status update
async function updateTicketStatus(ticketId, newStatus) {
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
            loadTickets(currentFilter);
            loadStatistics();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Translation functions
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

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadTickets();
    
    // Refresh every 30 seconds
    setInterval(() => {
        loadStatistics();
        loadTickets(currentFilter);
    }, 30000);
});