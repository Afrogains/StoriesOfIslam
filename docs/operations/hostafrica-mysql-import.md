# HostAfrica MySQL apply (cPanel localhost socket)

HostAfrica shared MySQL is **only** reachable on the server as:

```text
localhost (UNIX socket /var/lib/mysql/mysql.sock)
```

Cloud agents and laptops cannot open that socket. Apply schema/seed **on the HostAfrica host**.

## Option A — Node on the server (preferred)

SSH or cPanel Terminal on HostAfrica:

```bash
cd /path/to/StoriesOfIslam   # git clone or upload release
export DB_NAME=afroclov_StoriesOfIslam
export DB_USER=afroclov_StoriesOfIslam
export DB_PASSWORD='your-password'
export DB_SOCKET=/var/lib/mysql/mysql.sock
export DB_HOST=localhost
export DATABASE_SSL=false
bash scripts/hostafrica-apply-on-server.sh
```

API/worker env on the same host should use the same `DB_SOCKET` (see `.env.example`).

## Option B — phpMyAdmin import

1. In cPanel → phpMyAdmin → select `afroclov_StoriesOfIslam`.
2. Import a bootstrap dump produced from a verified migrate+seed:
   - Artifact from CI/agent: `hostafrica-bootstrap.sql`
   - Or generate locally after `npm run go-live:local`:
     ```bash
     mysqldump -h127.0.0.1 -u... -p... afroclov_StoriesOfIslam \
       --single-transaction --routines --triggers --hex-blob \
       --default-character-set=utf8mb4 > hostafrica-bootstrap.sql
     ```
3. Confirm table counts (categories / figures / stories / schema_migrations).

## API hosting note

If the Node API runs **off** HostAfrica shared hosting, you must either:

- move the API onto the same HostAfrica machine (socket works), or
- enable **Remote MySQL** in cPanel for the API host IP and use the server’s public MySQL hostname/IP (not `localhost`).
