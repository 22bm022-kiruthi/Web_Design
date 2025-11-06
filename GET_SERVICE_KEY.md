# How to Get Your Supabase Service Role Key

## Step 1: Access Your Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/zatafiglyptbujqzsohc
2. Sign in with your account (22bm022@drngpit.ac.in)

## Step 2: Navigate to API Settings

1. Click the **Settings** icon (⚙️) in the left sidebar
2. Click **API** from the settings menu

## Step 3: Find Your Service Role Key

You'll see several keys on this page:

- ✅ **`service_role` (secret)** ← THIS IS THE ONE YOU NEED
  - Starts with `eyJ...`
  - Has a 🔒 icon and says "This key has the ability to bypass Row Level Security"
  - Click the copy icon to copy it

- ❌ **`anon` key (public)** ← DON'T USE THIS ONE
  - This is the publishable key you were using before
  - Starts with `eyJ...` but has limited permissions

## Step 4: Update backend/.env

Open `backend/.env` and replace `your_service_role_key_here` with the service_role key you just copied:

```env
SUPABASE_URL=https://zatafiglyptbujqzsohc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdGFmaWdseXB0YnVqcXpzb2hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzODk3MTc0MSwiZXhwIjoxOTU0NTQ3NzQxfQ.YOUR_ACTUAL_KEY_HERE
SUPABASE_TABLE=raman_data
```

## Step 5: Restart Your Backend

```powershell
cd backend
npm run dev
```

You should see:
- "Server running on port 5001"
- "SUPABASE_URL set: true"

## Step 6: Test the Connection

Run this command from your project root:

```powershell
curl "http://127.0.0.1:5001/api/supabase/fetch?table=raman_data&limit=5" -UseBasicParsing
```

If successful, you'll see JSON data with your rows!

## Security Warning ⚠️

**NEVER commit your service_role key to GitHub!**

The `backend/.env` file is already in `.gitignore`, but double-check:
- Don't paste it in public chat
- Don't include it in screenshots
- Don't add it to any public documentation

---

## Quick Copy-Paste Commands

After updating `backend/.env` with your service_role key, run these:

```powershell
# Terminal 1 - Start Backend
cd C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main\backend
npm install
npm run dev

# Terminal 2 - Start Frontend (new PowerShell window)
cd C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main
npm install
npm run dev

# Terminal 3 - Test Backend (new PowerShell window)
cd C:\Users\lashm\Downloads\Final_Try_Web-main\Final_Try_Web-main
curl "http://127.0.0.1:5001/api/supabase/fetch?table=raman_data&limit=5" -UseBasicParsing
```

## Still Having Issues?

If you see errors, check:

1. **"SUPABASE_URL not configured"** → Restart backend after editing `.env`
2. **Connection refused** → Backend isn't running on port 5001
3. **401/403 errors** → Wrong key or table doesn't exist
4. **No data/empty array** → Table exists but is empty, or RLS is still blocking

Run your `test.py` to verify table access with the same credentials!
