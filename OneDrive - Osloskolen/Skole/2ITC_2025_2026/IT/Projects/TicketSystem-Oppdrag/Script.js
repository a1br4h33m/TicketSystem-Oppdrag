// Modal/Popup Management
const signInModal = document.getElementById('signInModal');
const signUpModal = document.getElementById('signUpModal');

const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');

const closeSignIn = document.getElementById('closeSignIn');
const closeSignUp = document.getElementById('closeSignUp');

const signInOverlay = document.getElementById('signInOverlay');
const signUpOverlay = document.getElementById('signUpOverlay');

const switchToSignUp = document.getElementById('switchToSignUp');
const switchToSignIn = document.getElementById('switchToSignIn');

const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');

// Open modals
signInBtn.addEventListener('click', () => {
    openModal(signInModal);
});

signUpBtn.addEventListener('click', () => {
    openModal(signUpModal);
});

// Close modals
closeSignIn.addEventListener('click', () => {
    closeModal(signInModal);
});

closeSignUp.addEventListener('click', () => {
    closeModal(signUpModal);
});

signInOverlay.addEventListener('click', () => {
    closeModal(signInModal);
});

signUpOverlay.addEventListener('click', () => {
    closeModal(signUpModal);
});

// Switch between modals
switchToSignUp.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signInModal);
    setTimeout(() => openModal(signUpModal), 300);
});

switchToSignIn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signUpModal);
    setTimeout(() => openModal(signInModal), 300);
});

// Modal helper functions
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (signInModal.classList.contains('active')) {
            closeModal(signInModal);
        }
        if (signUpModal.classList.contains('active')) {
            closeModal(signUpModal);
        }
    }
});

// ============================================
// FORM HANDLING - READY FOR FLASK/MARIADB
// ============================================

// Sign In Form Handler
signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('signInEmail').value,
        password: document.getElementById('signInPassword').value,
        remember: document.querySelector('input[name="remember"]').checked
    };
    
    console.log('Sign In Data:', formData);
    
    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token/session
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('Login successful!');
            console.log('User type:', data.user.user_type);
            console.log('Stored user data:', JSON.parse(localStorage.getItem('user')));
            
            showSuccess('Logg inn vellykket!');
            
            // Redirect based on user type
            setTimeout(() => {
                if (data.user.user_type === 'admin') {
                    console.log('Redirecting to admin.html');
                    window.location.href = 'admin.html';
                } else if (data.user.user_type === 'support') {
                    console.log('Redirecting to support-dashboard.html');
                    window.location.href = 'support-dashboard.html';
                } else {
                    console.log('Redirecting to my-tickets.html');
                    window.location.href = 'my-tickets.html';
                }
            }, 1000);
        } else {
            showError(data.message || 'Login feilet');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Kunne ikke koble til serveren');
    }
});

// Sign Up Form Handler
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passordene matcher ikke!');
        return;
    }
    
    const formData = {
        username: document.getElementById('signUpUsername').value,
        email: document.getElementById('signUpEmail').value,
        password: password,
        terms: document.querySelector('input[name="terms"]').checked
    };
    
    console.log('Sign Up Data:', formData);
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Konto opprettet! Vennligst logg inn.');
            setTimeout(() => {
                closeModal(signUpModal);
                signUpForm.reset();
                openModal(signInModal);
            }, 1500);
        } else {
            showError(data.message || 'Registrering feilet');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Kunne ikke koble til serveren');
    }
});

// Create Ticket Button (placeholder)
const createTicketBtn = document.getElementById('createTicketBtn');
if (createTicketBtn) {
    createTicketBtn.addEventListener('click', () => {
        // Check if user is logged in
        // TODO: Check actual auth status from session/token
        const isLoggedIn = false; // Replace with actual check
        
        if (!isLoggedIn) {
            showError('Vennligst logg inn først');
            setTimeout(() => openModal(signInModal), 1000);
        } else {
            // Redirect to ticket creation page
            window.location.href = '/create-ticket';
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show success message
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

// Generic notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease-out',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    });
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'error') {
        notification.style.background = '#FF6B6B';
    } else {
        notification.style.background = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// SESSION MANAGEMENT (for Flask integration)
// ============================================

// Check if user is logged in on page load
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (authToken && user) {
        // User is logged in
        updateUIForLoggedInUser(JSON.parse(user));
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Hide sign in/up buttons
    signInBtn.style.display = 'none';
    signUpBtn.style.display = 'none';
    
    // Show user info and logout button
    const authButtons = document.querySelector('.auth-buttons');
    
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <span style="color: #2A2A2A; font-weight: 600;">Hei, ${user.username}</span>
        <button class="btn btn-secondary" id="logoutBtn">Logg ut</button>
    `;
    
    authButtons.innerHTML = '';
    authButtons.appendChild(userInfo);
    
    // Add logout handler
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Logout function
function logout() {
    // TODO: Call Flask logout endpoint
    /*
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    });
    */
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Reload page
    window.location.reload();
}

// Check auth status on page load
checkAuthStatus();

// ============================================
// SMOOTH SCROLLING
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});