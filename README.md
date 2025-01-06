# Squirrl backend

### Get started

In the terminal run:

```
$ yarn install
# then
$ yarn server
```

To create a local database, create a `.env` file and add these credentials:

```
DATABASE='squirrl'
DATABASE_HOST='127.0.0.1'
DATABASE_PORT=5432
```

Then in the terminal run:

```
$ createdb squirrl
```

Ensure PostgreSQL is installed.
