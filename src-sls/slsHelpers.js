const AWS = require('aws-sdk');
const fs = require('fs');
const yaml = require('js-yaml');

const sls = yaml.safeLoad(fs.readFileSync('./serverless.yml', 'utf8'));

AWS.config = new AWS.Config({
    credentials: new AWS.SharedIniFileCredentials({
        profile: sls.provider.profile
    }),
    region: sls.provider.region
});

const cf = new AWS.CloudFormation();

async function listStackResources(resources, nextToken) {
    resources = resources || [];

    resources = resources.concat(
        await new Promise((res, rej) => {
            cf.listStackResources(
                {
                    StackName: `${sls.service}-${sls.provider.stage}`,
                    NextToken: nextToken
                },
                function(err, data) {
                    if (err) rej(err, err.stack);
                    else if (data.NextToken) {
                        return listStackResources(
                            resources,
                            response.NextToken
                        );
                    } else res(data);
                }
            );
        })
    );

    return resources.reduce((p, c) => p.concat(c.StackResourceSummaries), []);
}

async function getApiUrl() {
    const resources = await listStackResources();

    const apis = resources.filter(
        r => r.LogicalResourceId === 'ApiGatewayRestApi'
    );

    if (apis.length !== 1) {
        throw new Error(
            `${
                apis.length
            } APIs found, 1 expected. Have you run "sls deploy" yet?`
        );
    }

    return apis[0].PhysicalResourceId;
}

module.exports = {
    getApiUrl
};
