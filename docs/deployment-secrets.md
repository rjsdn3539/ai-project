# Deployment Secrets

## Backend

The production backend container expects these GitHub Actions secrets.

- `JWT_SECRET`
- `OPENAI_API_KEY`
- `JUSO_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `EC2_KEY`
- `EC2_USER`
- `EC2_HOST`

`JUSO_API_KEY` is passed into the backend container as the `JUSO_API_KEY` environment variable by [.github/workflows/backend-deploy.yml](/D:/Works/AI%20Interview/ai-interview/.github/workflows/backend-deploy.yml).

## GitHub Actions setup

1. Open the repository in GitHub.
2. Go to `Settings > Secrets and variables > Actions`.
3. Add or update the `JUSO_API_KEY` secret with the production road-address API key.

## EC2 runtime check

After deployment, verify the backend container was started with the new variable.

```bash
docker inspect aimentor-backend
```

Check that `JUSO_API_KEY` exists in the container environment.
