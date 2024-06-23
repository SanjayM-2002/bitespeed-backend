# Bitespeed Backend task

## Tech Stack

- Backend: **Cloudflare worker - Hono framework**
- **Typescript** as programming language
- **Postgres** as Database
- **Prisma** as ORM, with connection pooling

## Backend setup

Clone the repo

```bash
git clone https://github.com/SanjayM-2002/bitespeed-backend.git
```

```bash
cd bitespeed-backend
```

Set up `.env` and `wrangler.toml` in backend:

Inside `.env` paste the Postgres DB url

```bash
DATABASE_URL =

```

#### Creating Connection Pool

    - Go to [PRISMA](https://www.prisma.io/data-platform/accelerate) and create a new Project.
    - Click Enable Accelerate.
    - Under Database Connection String, paste THE `Postgres DB URL` created initially(from Neon or Aiven).
    - Click `ENABLE ACCELERATE`
    - Click `Generate API KEY`
    - A URL is generated, copy this
    - It creates a `POOL URL` which we give to our backend, not the orginal DB url.

#### Inside `wrangler.toml`

    ```
    name = "backend"
    compatibility_date = "2023-12-01"

    [vars]
    DATABASE_URL="Paste the newly generated URL"

    ```

```bash
npm i
```

```bash
npm run dev
```

- **NOTE** If you make changes in the database i.e `schema.prisma` file you need to migrate using the follwing command to tell the database the the table you had added is been altered.

```bash
npx prisma migrate dev --name init_schema
```

- It will generate migration folder inside prisma.
- And then Generate the prisma client

```
npx prisma generate --no-engine
```

### To Deploy

```
npx wrangler whoami
```

```
npx wrangler login
```

```
npm run deploy
```

## Live link

[Base url: ] (https://bitespeed-backend.sanjaym2202.workers.dev)
[Identify endpoint: ] (https://bitespeed-backend.sanjaym2202.workers.dev/api/v1/identify)

## License

[MIT](https://choosealicense.com/licenses/mit/)
