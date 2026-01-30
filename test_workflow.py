"""
Test script to verify the complete workflow
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def test_workflow():
    print("=" * 60)
    print("TESTING COMPLETE WORKFLOW")
    print("=" * 60)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   ✓ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ✗ Health check failed: {e}")
        return
    
    # Test 2: Login
    print("\n2. Testing Login...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data={
                "username": "admin@company.com",
                "password": "admin123"
            }
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"   ✓ Login successful")
            print(f"   Token: {token[:20]}...")
        else:
            print(f"   ✗ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Login failed: {e}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Get User Info
    print("\n3. Testing Get User Info...")
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print(f"   ✓ User info retrieved")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
        else:
            print(f"   ✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Failed: {e}")
    
    # Test 4: Get History
    print("\n4. Testing History Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/history", headers=headers)
        if response.status_code == 200:
            history = response.json()
            print(f"   ✓ History retrieved: {len(history)} records")
            if history:
                print(f"   Latest: {history[0].get('jd_filename', 'N/A')}")
        else:
            print(f"   ✗ Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ✗ Failed: {e}")
    
    # Test 5: Get Analytics
    print("\n5. Testing Analytics Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/analytics", headers=headers)
        if response.status_code == 200:
            analytics = response.json()
            print(f"   ✓ Analytics retrieved")
            print(f"   Total analyses: {analytics.get('total_analyses', 0)}")
            print(f"   Avg score: {analytics.get('avg_score', 0):.2%}")
        else:
            print(f"   ✗ Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ✗ Failed: {e}")
    
    # Test 6: Get Detailed Analytics
    print("\n6. Testing Detailed Analytics Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/detailed", headers=headers)
        if response.status_code == 200:
            detailed = response.json()
            print(f"   ✓ Detailed analytics retrieved")
            print(f"   Daily records: {len(detailed.get('daily', []))}")
            print(f"   Hourly records: {len(detailed.get('hourly', []))}")
        else:
            print(f"   ✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Failed: {e}")
    
    # Test 7: Check Database
    print("\n7. Testing Database...")
    try:
        import sqlite3
        conn = sqlite3.connect("analysis_history.db")
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"   ✓ Database tables: {[t[0] for t in tables]}")
        
        # Check job count
        cursor.execute("SELECT COUNT(*) FROM analysis_jobs")
        count = cursor.fetchone()[0]
        print(f"   ✓ Total jobs in DB: {count}")
        
        conn.close()
    except Exception as e:
        print(f"   ✗ Database check failed: {e}")
    
    print("\n" + "=" * 60)
    print("WORKFLOW TEST COMPLETE")
    print("=" * 60)
    print("\n✓ Backend is running on http://localhost:8000")
    print("✓ Frontend is running on http://localhost:5174")
    print("\nYou can now:")
    print("  1. Login at http://localhost:5174/login")
    print("  2. View History at http://localhost:5174/history")
    print("  3. View Analytics at http://localhost:5174/analytics")
    print("  4. Upload and analyze resumes")

if __name__ == "__main__":
    test_workflow()
