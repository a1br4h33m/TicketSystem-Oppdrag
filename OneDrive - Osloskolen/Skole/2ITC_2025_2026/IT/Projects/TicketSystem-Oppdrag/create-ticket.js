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

// Create Ticket Form Handler
document.getElementById('createTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('ticketTitle').value,
        category: document.getElementById('ticketCategory').value,
        priority: document.getElementById('ticketPriority').value,
        description: document.getElementById('ticketDescription').value
    };
    
    console.log('Creating ticket:', formData);
    
    try {
        const response = await fetch('/api/tickets/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('Ticket opprettet!');
            window.location.href = 'my-tickets.html';
        } else {
            alert('Feil: ' + (data.message || 'Kunne ikke opprette ticket'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Kunne ikke koble til serveren');
    }
});