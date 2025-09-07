# Teams System Plan

Goal: Introduce team-based roles with separate dashboards and access control.

Roles
- owner: Full access to everything within a team.
- admin: Administrative capabilities (manage products, orders, discounts, banners) but not necessarily billing/ownership tasks.
- marketing: Limited to messaging, banners, discounts, campaigns.
- member: (optional baseline) read-only or limited access.

Core Entities
- teams: id, name, slug, created_at, updated_at
- team_members: team_id, user_id, role(team_role), invited_at, joined_at
- app_users: keep as global user registry and profile (email, metadata, role if needed for platform-level ops)

Routing & UX
- /owner: Owner dashboard – visibility across all admin + team settings (placeholder now; can add billing/settings later)
- /admin: Admin dashboard – current admin pages (orders, products, discounts, banners, settings)
- /marketing: Marketing dashboard – marketing-only controls (banners, discounts, campaigns; placeholder now)

Access Control (Middleware)
- /owner: require team_members.role in ('owner')
- /admin: require team_members.role in ('owner','admin') OR legacy app_users.role = 'admin'
- /marketing: require team_members.role in ('owner','marketing')

Team Context (Future)
- Eventually add a team switcher and persist selected team in cookie or profile metadata.
- For now, role checks grant access if the user holds the required role in any team.

Data Model Migration
- Add enum team_role ('owner','admin','marketing','member')
- Add teams + team_members tables with unique(team_id,user_id)

Next Steps
1) Implement migrations under supabase/migrations.
2) Update Zod schema with TeamRole, Team, TeamMember.
3) Create /owner and /marketing dashboards + layouts.
4) Update middleware to gate new routes by team role.
5) (Optional) Add RLS policies for team_members, teams, and restricted tables.

