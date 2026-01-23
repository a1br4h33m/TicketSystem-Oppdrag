
function checkAdminAccess() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (!user || !token) {
        alert('Du må være logget inn for å se denne siden');
        window.location.href = 'Home.html';
        return false;
    }
    
    const userData = JSON.parse(user);
    if (userData.user_type !== 'admin') {
        alert('Du har ikke tilgang til denne siden. Kun administratorer.');
        if (userData.user_type === 'support') {
            window.location.href = 'support-dashboard.html';
        } else {
            window.location.href = 'Home.html';
        }
        return false;
    }
    
    return true;
}


if (!checkAdminAccess()) {

}


document.getElementById('logoutBtn').addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'Home.html';
});

async function loadStatistics() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.total_users;
            document.getElementById('totalTickets').textContent = data.stats.total_tickets;
            document.getElementById('openTickets').textContent = data.stats.open_tickets;
            document.getElementById('resolvedTickets').textContent = data.stats.resolved_tickets;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadUsers() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('usersTableBody');
            const userCount = document.getElementById('userCount');
            
            userCount.textContent = data.users.length;
            
            if (data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="loading">Ingen brukere funnet</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td><strong>${user.username}</strong></td>
                    <td>${user.email}</td>
                    <td><span class="user-type user-type-${user.user_type}">${user.user_type}</span></td>
                    <td>${formatDate(user.created_at)}</td>
                    <td><span class="${user.is_active ? 'user-active' : 'user-inactive'}">${user.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = 
            '<tr><td colspan="6" class="loading" style="color: #FF6B6B;">Feil ved lasting av brukere</td></tr>';
    }
}

async function loadTickets() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/tickets', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('ticketsTableBody');
            const ticketCount = document.getElementById('ticketCount');
            
            ticketCount.textContent = data.count;
            
            if (data.tickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">Ingen tickets funnet</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.tickets.map(ticket => `
                <tr>
                    <td>${ticket.id}</td>
                    <td><strong>${ticket.title}</strong></td>
                    <td>${ticket.username || ticket.email}</td>
                    <td><span class="status-badge">${translateCategory(ticket.category)}</span></td>
                    <td><span class="status-badge priority-${ticket.priority}">${translatePriority(ticket.priority)}</span></td>
                    <td><span class="status-badge status-${ticket.status}">${translateStatus(ticket.status)}</span></td>
                    <td>${formatDate(ticket.created_at)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticketsTableBody').innerHTML = 
            '<tr><td colspan="7" class="loading" style="color: #FF6B6B;">Feil ved lasting av tickets</td></tr>';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function translateStatus(status) {
    const translations = {
        'open': 'Åpen',
        'in_progress': 'Under arbeid',
        'resolved': 'Løst',
        'closed': 'Lukket'
    };
    return translations[status] || status;
}

function translatePriority(priority) {
    const translations = {
        'low': 'Lav',
        'medium': 'Middels',
        'high': 'Høy',
        'urgent': 'Haster'
    };
    return translations[priority] || priority;
}

function translateCategory(category) {
    const translations = {
        'technical': 'Teknisk',
        'billing': 'Faktura',
        'account': 'Konto',
        'other': 'Annet'
    };
    return translations[category] || category;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Loading admin dashboard...');
    loadStatistics();
    loadUsers();
    loadTickets();
    
    setInterval(() => {
        loadStatistics();
        loadUsers();
        loadTickets();
    }, 30000);
});
document.getElementById('createSupportUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('supportUsername').value,
        email: document.getElementById('supportEmail').value,
        password: document.getElementById('supportPassword').value,
        user_type: document.getElementById('supportUserType').value
    };
    
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Bruker opprettet!');
            document.getElementById('createSupportUserForm').reset();
            loadUsers(); 
            loadStatistics(); // Reload stats
        } else {
            alert('Feil: ' + (data.message || 'Kunne ikke opprette bruker'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Kunne ikke koble til serveren');
    }
});