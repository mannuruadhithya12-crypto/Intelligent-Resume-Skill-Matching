import sqlite3
import os

DB_PATH = "users.db"

if not os.path.exists(DB_PATH):
    print(f"Error: {DB_PATH} not found.")
else:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT id, email, full_name, role, provider FROM users").fetchall()
        print("--- Users ---")
        for r in rows:
            print(f"ID: {r['id']} | Email: {r['email']} | Name: {r['full_name']} | Role: {r['role']} | Provider: {r['provider']}")
    except Exception as e:
        print(f"Query Error: {e}")
    conn.close()
