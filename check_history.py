import sqlite3
from api.history_db import get_all_jobs

print("--- Fetching Jobs ---")
try:
    jobs = get_all_jobs(limit=5)
    print(f"Retrieved {len(jobs)} jobs")
    for job in jobs:
        print(f"Job ID: {job.get('job_id')} Type: {type(job.get('job_id'))}")
        for k, v in job.items():
            if isinstance(v, bytes):
                print(f"  KEY {k} is BYTES: {v}")
            elif isinstance(v, str):
                pass # print(f"  KEY {k} is STR")
            else:
                print(f"  KEY {k} is {type(v)}")
except Exception as e:
    print(f"Error: {e}")
