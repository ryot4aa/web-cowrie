# Database (MySQL) - Local development

This project doesn't include a backend; to run a local MySQL instance for a Laravel backend use the provided Docker compose file.

Start MySQL with Docker Compose:

```bash
docker compose -f docker-compose.mysql.yml up -d
```

Verify container is healthy:

```bash
docker ps
docker compose -f docker-compose.mysql.yml logs mysql --follow
```

Or, if you want to use Laragon MySQL instead of Docker, import the dummy SQL file at `sql/laravel_dummy_data.sql` into your Laragon MySQL.

Laravel `.env` example values are in `.env.mysql.example`. Copy or merge into your Laravel project's `.env`:

```
DB_CONNECTION=mysql
DB_HOST=mysql        # use 127.0.0.1 if Laravel runs on host
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret
```

If Laravel is running in a separate Docker Compose network, set `DB_HOST` to the MySQL service name (`mysql` by default).

To create the schema (from your Laravel project):

```bash
php artisan migrate
```

**Laragon (local)**: If you use Laragon on this machine, its MySQL is available at `127.0.0.1:3306`.

I created a database and user for you:

- **Database**: `laravel`
- **User**: `laravel`
- **Password**: `secret`
- **Host**: `127.0.0.1`

Test connection from this machine:

```powershell
& 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysql.exe' -u laravel -p -h 127.0.0.1 -P 3306 -e "SELECT VERSION();"
```

Or use root with empty password (Laragon default):

```
DB_USERNAME=root
DB_PASSWORD=
```

Copy the appropriate values into your Laravel project's `.env` and run `php artisan migrate`.
