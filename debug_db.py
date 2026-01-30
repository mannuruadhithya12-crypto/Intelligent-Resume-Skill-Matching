import sqlite3
import os

DB_PATH = "users.db" # Check in root

if not os.path.exists(DB_PATH):
    print(f"Database file not found at {DB_PATH}")
else:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("--- Tables ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print([t[0] for t in tables])
    
    print("\n--- Users Table Schema ---")
    cursor.execute("PRAGMA table_info(users);")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
        
    conn.close()
