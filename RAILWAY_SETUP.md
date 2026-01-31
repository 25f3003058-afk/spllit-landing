# Railway Database Setup

## Add Phone Column to Production Database

Run this SQL command in Railway's PostgreSQL database to add the phone column:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
```

## How to Apply:

1. Go to Railway Dashboard: https://railway.app
2. Open your project: `ankit-production-f3d4`
3. Click on PostgreSQL database
4. Go to "Data" tab
5. Click "Query" 
6. Paste the SQL above and execute

OR use Railway CLI:
```bash
railway connect postgres
\c your_database_name
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
```

## Verification:

After running the command, verify the column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'phone';
```

The registration should now work perfectly with phone numbers stored!
