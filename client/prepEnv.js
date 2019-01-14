const fs = require('fs');
const path = require('path');

const { getStackResource } = require('../slsHelpers');

prep();

async function prep() {
    const env = process.env.BUILD_ENV;

    console.log(`Prepping .env.local for ${env} environment`);

    const apiUrl = await getStackResource('serverless_backend.yml', env, 'ApiGatewayRestApi');

    const envVars = {
        VUE_APP_REGION: 'us-east-1',
        VUE_APP_STAGE: env,
        VUE_APP_API_URL: `https://${apiUrl}.execute-api.us-east-1.amazonaws.com`
    };

    fs.writeFileSync(
        path.join(__dirname, '.env.local'),
        Object.entries(envVars)
            .map(e => e.join('='))
            .join('\n')
    );
}
