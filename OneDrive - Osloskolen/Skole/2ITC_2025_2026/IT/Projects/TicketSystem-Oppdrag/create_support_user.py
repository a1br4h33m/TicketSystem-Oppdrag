"""
Script for å opprette en test support-bruker
"""

import mysql.connector
from werkzeug.security import generate_password_hash

DB_CONFIG = {
    'host': 'localhost',
    'user': 'techsupport_user',
    'password': 'MittPassord123!',  # ednre passord her
    'database': 'techsupport_db'
}

def create_support_user():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # hvis brukere allerede eksisterer så printer den bare ut info
        cursor.execute("SELECT id FROM users WHERE email = %s", ('support@techsupport.no',))
        existing = cursor.fetchone()
        
        if existing:
            print("✗ Support-bruker eksisterer allerede!")
            print("   Brukernavn: support_test")
            print("   E-post: support@techsupport.no")
            cursor.close()
            conn.close()
            return
        
        username = 'support_test'
        email = 'support@techsupport.no'
        password = 'support123'  # Endre dette hvis du vil
        user_type = 'support'
        
        password_hash = generate_password_hash(password)
        
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, user_type, is_active) VALUES (%s, %s, %s, %s, 1)",
            (username, email, password_hash, user_type)
        )
        
        conn.commit()
        
        print("=" * 50)
        print("✓ Support-bruker opprettet!")
        print("=" * 50)
        print(f"Brukernavn: {username}")
        print(f"E-post: {email}")
        print(f"Passord: {password}")
        print(f"Type: {user_type}")
        print("=" * 50)
        print("\nDu kan nå logge inn med:")
        print(f"  E-post: {email}")
        print(f"  Passord: {password}")
        print("=" * 50)
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"✗ Database feil: {e}")
    except Exception as e:
        print(f"✗ Feil: {e}")

if __name__ == '__main__':
    create_support_user()