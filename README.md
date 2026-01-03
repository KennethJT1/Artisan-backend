## BullMQ
Now visit → http://localhost:3000/queues to monitor jobs 👀

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

find . -type f \
  -not -name 'merged.txt' \
  -not -name '.env*' \
  -not -path '*/node_modules/*' \
  -not -path '*/.yarn/*' \
  -not -name 'yarn.lock' \
  -not -name 'package.json' \
  -not -name 'package-lock.json' \
  -not -name 'pnpm-lock.yaml' \
  -print0 | while IFS= read -r -d $'\0' file; do
    echo "===== $file =====" >> merged.txt
    cat "$file" >> merged.txt
    echo -e "\n\n" >> merged.txt
done