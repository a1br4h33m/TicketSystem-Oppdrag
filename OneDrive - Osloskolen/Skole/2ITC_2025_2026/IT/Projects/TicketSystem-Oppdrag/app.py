print("=" * 50)
print("Starting TechSupport AS Server...")
print("=" * 50)

try:
    from flask import Flask, request, jsonify, send_from_directory
    print("✓ Flask imported successfully")
except ImportError as e:
    print(f"✗ Failed to import Flask: {e}")
    print("Run: pip install Flask")
    exit(1)

try:
    from flask_cors import CORS
    print("✓ Flask-CORS imported successfully")
except ImportError as e:
    print(f"✗ Failed to import Flask-CORS: {e}")
    print("Run: pip install Flask-CORS")
    exit(1)

try:
    from werkzeug.security import generate_password_hash, check_password_hash
    print("✓ Werkzeug imported successfully")
except ImportError as e:
    print(f"✗ Failed to import Werkzeug: {e}")
    print("Run: pip install Werkzeug")
    exit(1)

try:
    import mysql.connector
    print("✓ MySQL Connector imported successfully")
except ImportError as e:
    print(f"✗ Failed to import mysql.connector: {e}")
    print("Run: pip install mysql-connector-python")
    exit(1)

try:
    import jwt
    print("✓ PyJWT imported successfully")
except ImportError as e:
    print(f"✗ Failed to import PyJWT: {e}")
    print("Run: pip install PyJWT")
    exit(1)

from datetime import datetime, timedelta

print("\n" + "=" * 50)
print("Testing Database Connection...")
print("=" * 50)


DB_CONFIG = {
    'host': 'localhost',
    'user': 'techsupport_user',
    'password': 'MittPassord123!',  # endre passord her
    'database': 'techsupport_db'
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    print("✓ Database connection successful!")
    conn.close()
except mysql.connector.Error as e:
    print(f"✗ Database connection failed: {e}")
    print("\nPlease check:")
    print("1. MariaDB is running")
    print("2. Username and password are correct in app.py")
    print("3. Database 'techsupport_db' exists")
    exit(1)

print("\n" + "=" * 50)
print("Creating Flask Application...")
print("=" * 50)

app = Flask(__name__)
app.secret_key = 'endre-denne-til-noe-sikkert-123456'
CORS(app)

JWT_SECRET = 'endre-denne-jwt-secret-også-789'
JWT_ALGORITHM = 'HS256'

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# Serve static files
@app.route('/')
def index():
    print("✓ Serving Home.html")
    return send_from_directory('.', 'Home.html')

@app.route('/<path:path>')
def static_files(path):
    print(f"✓ Serving {path}")
    return send_from_directory('.', path)

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    print("📝 Sign up request received")
    data = request.get_json()
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Passord må være minst 6 tegn'}), 400
    
    password_hash = generate_password_hash(password)
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        if cursor.fetchone():
            print(f"✗ User already exists: {email}")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Bruker eksisterer allerede'}), 409
        
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, user_type) VALUES (%s, %s, %s, 'customer')",
            (username, email, password_hash)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ User created: {username} ({email})")
        return jsonify({'success': True, 'message': 'Bruker opprettet'}), 201
    except Exception as e:
        print(f"✗ Sign up error: {e}")
        return jsonify({'success': False, 'message': 'Kunne ikke opprette bruker'}), 500

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    print("🔑 Sign in request received")
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    print(f"Login attempt for: {email}")
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            print(f"✗ User not found: {email}")
            return jsonify({'success': False, 'message': 'Ugyldig email eller passord'}), 401
        
        print(f"User found: {user['username']}, checking password...")
        
        if not check_password_hash(user['password_hash'], password):
            print(f"✗ Invalid password for: {email}")
            return jsonify({'success': False, 'message': 'Ugyldig email eller passord'}), 401
        
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        print(f"✓ User logged in: {user['username']} ({email}) - Type: {user['user_type']}")
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'user_type': user['user_type']
            }
        }), 200
    except Exception as e:
        print(f"✗ Sign in error: {e}")
        return jsonify({'success': False, 'message': 'Login feil'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    print("👋 Logout request received")
    return jsonify({'success': True, 'message': 'Logget ut'}), 200

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    print("🎫 Get tickets request received")
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT t.*, u.username, u.email 
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        """)
        
        tickets = cursor.fetchall()
        
        for ticket in tickets:
            if ticket.get('created_at'):
                ticket['created_at'] = ticket['created_at'].isoformat()
            if ticket.get('updated_at'):
                ticket['updated_at'] = ticket['updated_at'].isoformat()
            if ticket.get('resolved_at'):
                ticket['resolved_at'] = ticket['resolved_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        print(f"✓ Returning {len(tickets)} tickets")
        return jsonify({
            'success': True,
            'tickets': tickets,
            'count': len(tickets)
        }), 200
        
    except Exception as e:
        print(f"✗ Tickets fetch error: {e}")
        return jsonify({'success': False, 'message': 'Kunne ikke hente tickets', 'tickets': [], 'count': 0}), 200

@app.route('/api/tickets/create', methods=['POST'])
def create_ticket():
    print("📝 Create ticket request")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO tickets (user_id, title, description, category, priority, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'open', %s)
        """
        cursor.execute(query, (
            user_id,
            data['title'],
            data['description'],
            data['category'],
            data['priority'],
            datetime.now()
        ))
        
        ticket_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ Ticket created: ID {ticket_id}")
        return jsonify({'success': True, 'ticket_id': ticket_id}), 201
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tickets/my', methods=['GET'])
def get_my_tickets():
    print("🎫 Get my tickets request")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    status_filter = request.args.get('status')
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user['user_type'] in ['support', 'admin']:
            if status_filter and status_filter != 'all':
                query = "SELECT * FROM tickets WHERE status = %s ORDER BY created_at DESC"
                cursor.execute(query, (status_filter,))
            else:
                query = "SELECT * FROM tickets ORDER BY created_at DESC"
                cursor.execute(query)
        else:
            if status_filter and status_filter != 'all':
                query = "SELECT * FROM tickets WHERE user_id = %s AND status = %s ORDER BY created_at DESC"
                cursor.execute(query, (user_id, status_filter))
            else:
                query = "SELECT * FROM tickets WHERE user_id = %s ORDER BY created_at DESC"
                cursor.execute(query, (user_id,))
        
        tickets = cursor.fetchall()
        
        for ticket in tickets:
            if ticket.get('created_at'):
                ticket['created_at'] = ticket['created_at'].isoformat()
            if ticket.get('updated_at'):
                ticket['updated_at'] = ticket['updated_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        print(f"✓ Returning {len(tickets)} tickets for user {user_id} (type: {user['user_type']})")
        return jsonify({'success': True, 'tickets': tickets}), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
def get_ticket_detail(ticket_id):
    print(f"🎫 Get ticket detail: {ticket_id}")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user['user_type'] in ['support', 'admin']:
            cursor.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,))
        else:
            cursor.execute("SELECT * FROM tickets WHERE id = %s AND user_id = %s", (ticket_id, user_id))
        
        ticket = cursor.fetchone()
        
        if not ticket:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Ticket ikke funnet'}), 404
        
        cursor.execute("""
            SELECT c.*, u.username, u.user_type
            FROM ticket_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.ticket_id = %s
            ORDER BY c.created_at ASC
        """, (ticket_id,))
        
        comments = cursor.fetchall()
        
        if ticket.get('created_at'):
            ticket['created_at'] = ticket['created_at'].isoformat()
        if ticket.get('updated_at'):
            ticket['updated_at'] = ticket['updated_at'].isoformat()
        
        for comment in comments:
            if comment.get('created_at'):
                comment['created_at'] = comment['created_at'].isoformat()
        
        ticket['comments'] = comments
        
        cursor.close()
        conn.close()
        
        print(f"✓ Ticket {ticket_id} retrieved with {len(comments)} comments")
        return jsonify({'success': True, 'ticket': ticket}), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tickets/<int:ticket_id>/comment', methods=['POST'])
def add_comment_to_ticket(ticket_id):
    print(f"💬 Add comment to ticket {ticket_id}")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO ticket_comments (ticket_id, user_id, comment, created_at)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (ticket_id, user_id, data['comment'], datetime.now()))
        
        cursor.execute("UPDATE tickets SET updated_at = %s WHERE id = %s", (datetime.now(), ticket_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ Comment added to ticket {ticket_id}")
        return jsonify({'success': True}), 201
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Update Ticket Status API
@app.route('/api/tickets/<int:ticket_id>/status', methods=['PUT'])
def update_ticket_status_api(ticket_id):
    print(f"🔄 Update ticket status: {ticket_id}")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Check if user is support/admin
        cursor.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user['user_type'] not in ['support', 'admin']:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Ingen tilgang'}), 403
        
        cursor.execute("""
            UPDATE tickets 
            SET status = %s, updated_at = %s
            WHERE id = %s
        """, (data['status'], datetime.now(), ticket_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ Ticket {ticket_id} status updated to {data['status']}")
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Admin Statistics API
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    print("📊 Admin stats request received")
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM tickets")
        total_tickets = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'")
        open_tickets = cursor.fetchone()['count']
        
    
        cursor.execute("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'")
        resolved_tickets = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        print(f"✓ Stats: Users={total_users}, Tickets={total_tickets}, Open={open_tickets}, Resolved={resolved_tickets}")
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'resolved_tickets': resolved_tickets
            }
        }), 200
        
    except Exception as e:
        print(f"✗ Stats error: {e}")
        return jsonify({'success': False, 'message': 'Kunne ikke hente statistikk'}), 500

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    print("👥 Admin users request received")
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, username, email, user_type, created_at, is_active
            FROM users
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        
        for user in users:
            if user.get('created_at'):
                user['created_at'] = user['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        print(f"✓ Returning {len(users)} users")
        
        return jsonify({
            'success': True,
            'users': users
        }), 200
        
    except Exception as e:
        print(f"✗ Users fetch error: {e}")
        return jsonify({'success': False, 'message': 'Kunne ikke hente brukere'}), 500


@app.route('/api/admin/create-user', methods=['POST'])
def admin_create_user():
    print("👤 Admin create user request received")
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header:
        return jsonify({'success': False, 'message': 'Ikke autorisert'}), 401
    
    try:
        token = auth_header.split(" ")[1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = data_token['user_id']
    except:
        return jsonify({'success': False, 'message': 'Ugyldig token'}), 401
    
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
        requester = cursor.fetchone()
        
        if not requester or requester['user_type'] != 'admin':
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Ingen tilgang'}), 403
        
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        user_type = data.get('user_type', 'support')
        
        if len(password) < 6:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Passord må være minst 6 tegn'}), 400
        
        if user_type not in ['support', 'admin']:
            user_type = 'support'
        
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Bruker eksisterer allerede'}), 409
        
        # Create user
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, user_type) VALUES (%s, %s, %s, %s)",
            (username, email, password_hash, user_type)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ {user_type.capitalize()} user created: {username} ({email})")
        return jsonify({'success': True, 'message': 'Bruker opprettet'}), 201
        
    except Exception as e:
        print(f"✗ Create user error: {e}")
        return jsonify({'success': False, 'message': 'Kunne ikke opprette bruker'}), 500

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🚀 Starting Flask Server...")
    print("=" * 50)
    print("\n📋 Server will start on: http://localhost:5000")
    print("📋 Open this URL in your browser!")
    print("\nPress CTRL+C to stop the server\n")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"\n✗ Server failed to start: {e}")