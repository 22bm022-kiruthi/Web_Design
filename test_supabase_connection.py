"""
Quick Supabase Connection Tester
Run this to verify your Supabase credentials work before using them in the backend.
"""
import os
import sys

print("=" * 60)
print("SUPABASE CONNECTION TESTER")
print("=" * 60)

# Check if supabase-py is installed
try:
    from supabase import create_client, Client
    print("✅ supabase-py library installed")
except ImportError:
    print("❌ supabase-py not installed!")
    print("\nInstall it with:")
    print("  pip install supabase")
    sys.exit(1)

# Read credentials
url = os.environ.get('SUPABASE_URL', 'https://zatafiglyptbujqzsohc.supabase.co')
publishable_key = 'sb_publishable_Vqn4Od11duK5FUtQly57Xw_lbeiNfqq'

print(f"\n📍 URL: {url}")
print(f"🔑 Key (first 20 chars): {publishable_key[:20]}...")

# Test 1: Connection with publishable key
print("\n" + "=" * 60)
print("TEST 1: Connection with PUBLISHABLE key (has RLS restrictions)")
print("=" * 60)

try:
    supabase = create_client(url, publishable_key)
    print("✅ Client created successfully")
    
    # Try to fetch from raman_data
    print("\nAttempting to query 'raman_data' table...")
    response = supabase.table('raman_data').select("*").limit(5).execute()
    
    if response.data and len(response.data) > 0:
        print(f"✅ SUCCESS! Retrieved {len(response.data)} rows")
        print("\nFirst row sample:")
        first_row = response.data[0]
        for key, value in list(first_row.items())[:5]:
            print(f"  {key}: {value}")
        if len(first_row) > 5:
            print(f"  ... and {len(first_row) - 5} more columns")
    else:
        print("⚠️  Query succeeded but returned 0 rows")
        print("   This might mean:")
        print("   - The table is empty")
        print("   - RLS policies are blocking access with publishable key")
        
except Exception as e:
    print(f"❌ FAILED: {type(e).__name__}: {e}")
    print("\n💡 This is expected if RLS is enabled!")
    print("   You need a SERVICE_ROLE key to bypass RLS")

# Test 2: Instructions for service_role key
print("\n" + "=" * 60)
print("TEST 2: How to get your SERVICE_ROLE key")
print("=" * 60)

print("""
The publishable key has limited permissions due to Row Level Security (RLS).
To fetch data from the backend, you need the SERVICE_ROLE key.

🔑 GET YOUR SERVICE_ROLE KEY:

1. Go to: https://supabase.com/dashboard/project/zatafiglyptbujqzsohc/settings/api

2. Look for the "service_role" key section (has a 🔒 icon)

3. Click the copy button to copy the full key

4. Open: backend/.env

5. Replace 'your_service_role_key_here' with the copied key:
   
   SUPABASE_URL=https://zatafiglyptbujqzsohc.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc... (paste your service_role key here)
   SUPABASE_TABLE=raman_data

6. Restart your backend:
   cd backend
   npm run dev

⚠️  SECURITY WARNING:
   - NEVER commit the service_role key to Git
   - It has full database access (bypasses RLS)
   - Keep it in backend/.env only (already in .gitignore)
""")

# Test 3: Check available tables
print("\n" + "=" * 60)
print("TEST 3: Checking for available tables")
print("=" * 60)

candidates = ['raman_data', 'raman_test', 'raman', 'spectra', 'test_data']
found_tables = []

for table_name in candidates:
    try:
        response = supabase.table(table_name).select('*').limit(1).execute()
        if response.data is not None:
            row_count_response = supabase.table(table_name).select('*', count='exact').limit(0).execute()
            count = row_count_response.count if hasattr(row_count_response, 'count') else '?'
            found_tables.append((table_name, count))
            print(f"✅ Found table: '{table_name}' (approx {count} rows)")
    except Exception as e:
        print(f"❌ Table '{table_name}' not accessible: {type(e).__name__}")

if found_tables:
    print(f"\n✅ Found {len(found_tables)} accessible table(s)")
    print("\nUse these table names in your Supabase widget!")
else:
    print("\n⚠️  No tables found with publishable key")
    print("   This confirms you need the service_role key in backend/.env")

print("\n" + "=" * 60)
print("NEXT STEPS:")
print("=" * 60)
print("""
1. Get your service_role key from Supabase dashboard
2. Add it to backend/.env (see instructions above)
3. Start backend: cd backend && npm run dev
4. Start frontend: npm run dev
5. Use Supabase widget in the app with table name 'raman_data'

Questions? The backend logs will show helpful error messages!
""")
