const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server')

if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error(
    '.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.'
  )
}

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, path.join(MEDUSA_SERVER_PATH, '.env'))
}

console.log('Installing dependencies in .medusa/server...')
execSync('pnpm install --prod', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
})


module.exports = async function addPublishableApiKeyToEnv(publishableApiKey) {
  const RAILWAY_API_TOKEN = process.env.RAILWAY_API_TOKEN;
  const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
  const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;
  const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;

  const query = `
    mutation variableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input) {
        id
        name
      }
    }
  `;

  return fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RAILWAY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          projectId: PROJECT_ID,
          environmentId: ENVIRONMENT_ID,
          serviceId: SERVICE_ID,
          name: "MEDUSA_PUBLISHABLE_KEY",
          value: publishableApiKey,
        },
      },
    }),
  });
}