import sqlite3
import os

DB_PATH = "users.db"

if not os.path.exists(DB_PATH):
    print(f"Error: {DB_PATH} not found.")
else:
    conn = sqlite3.connect(DB_PATH)
    try:
        # Update user acm@company.com to 'admin'
        email = "acm@company.com"
        cursor = conn.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
        if cursor.rowcount > 0:
            print(f"Successfully promoted {email} to admin.")
            conn.commit()
        else:
            print(f"User {email} not found.")
    except Exception as e:
        print(f"Update Error: {e}")
    conn.close()
