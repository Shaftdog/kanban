# Database Migrations and RLS Policies

## Applying RLS Policies to Supabase

Row Level Security (RLS) policies ensure that users can only access their own data.

### How to Apply

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `rls-policies.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute

### What the Policies Do

- **Users**: Can only view and update their own profile
- **Projects**: Full CRUD access to own projects only
- **Milestones**: Can manage milestones in their own projects
- **Tasks**: Can manage tasks in their own milestones
- **Columns**: Full CRUD access to own columns
- **Tags**: Full CRUD access to own tags
- **Task Tags**: Can manage tags on their own tasks
- **AI Recommendations**: Can view and create their own AI recommendations

### Testing RLS

After applying the policies, test by:

1. Creating a user via the application
2. Creating some projects, milestones, and tasks
3. Verifying that the user can only see their own data
4. Attempting to access another user's data (should fail)

### Disabling RLS (Development Only)

If you need to disable RLS for development/testing:

```sql
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
-- ... etc for other tables
```

**Warning**: Never disable RLS in production!
