# HostAfrica MySQL apply (cPanel localhost socket)

HostAfrica shared MySQL is **only** reachable on the server as:

```text
localhost (UNIX socket /var/lib/mysql/mysql.sock)
```

GitHub password login for `git clone` **does not work** (private repo + GitHub blocked password auth). Prefer the browser ZIP + phpMyAdmin path below.

## Option A — phpMyAdmin (recommended on cPanel)

1. On your laptop, while logged into GitHub, download the branch ZIP:
   - https://github.com/Afrogains/StoriesOfIslam/archive/refs/heads/cursor/cloud-agent-1789504843135-ly7pe.zip
2. Unzip locally and find `db/hostafrica-bootstrap.sql`.
3. cPanel → **phpMyAdmin** → select database `afroclov_StoriesOfIslam`.
4. **Import** → choose `hostafrica-bootstrap.sql` → Go.
5. Confirm tables exist (`categories`, `figures`, `stories`, `schema_migrations`, …).

Optional check in phpMyAdmin SQL tab:

```sql
SELECT 'categories' t, COUNT(*) n FROM categories
UNION ALL SELECT 'figures', COUNT(*) FROM figures
UNION ALL SELECT 'stories', COUNT(*) FROM stories
UNION ALL SELECT 'schema_migrations', COUNT(*) FROM schema_migrations;
```

Expected roughly: categories 4, figures 43, stories 33, schema_migrations 1.

## Option B — Git clone with a Personal Access Token

Only if you need the full repo on the server:

1. GitHub → Settings → Developer settings → Personal access tokens → create a token with `repo` scope.
2. On HostAfrica terminal, run **one line at a time** (do not paste a whole block into the password prompt):

```bash
cd ~
git clone -b cursor/cloud-agent-1789504843135-ly7pe https://github.com/Afrogains/StoriesOfIslam.git
```

3. Username: your GitHub username  
   Password: **paste the token** (not your GitHub password).
4. Then:

```bash
cd ~/StoriesOfIslam
export DB_NAME=afroclov_StoriesOfIslam
export DB_USER=afroclov_StoriesOfIslam
export DB_PASSWORD='your-db-password'
export DB_SOCKET=/var/lib/mysql/mysql.sock
export DB_HOST=localhost
bash scripts/hostafrica-apply-on-server.sh
```

`npm` must be available for Option B. If `npm: command not found`, use Option A.

## API hosting note

If the Node API runs **off** this shared host, enable **Remote MySQL** in cPanel for the API host IP and use the server’s public hostname/IP (not `localhost`).
