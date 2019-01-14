const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function getServerlessConfig(configPath) {
    return yaml.safeLoad(
        fs.readFileSync(path.join(__dirname, configPath), 'utf8')
    );
}

function getCloudFrontInstance(slsConfig) {
    AWS.config = new AWS.Config({
        credentials: new AWS.SharedIniFileCredentials({
            profile: slsConfig.provider.profile
        }),
        region: slsConfig.provider.region
    });

    return new AWS.CloudFormation();
}

async function listStackResources(resources, nextToken, stage, slsConfig) {
    const cf = getCloudFrontInstance(slsConfig);
    resources = resources || [];

    resources = resources.concat(
        await new Promise((res, rej) => {
            cf.listStackResources(
                {
                    StackName: `${slsConfig.service}-${stage}`,
                    NextToken: nextToken
                },
                function (err, data) {
                    if (err) {
                        rej(err, err.stack);
                    } else if (data.NextToken) {
                        return listStackResources(
                            resources,
                            response.NextToken,
                            stage
                        );
                    } else {
                        res(data);
                    }
                }
            );
        })
    );

    return resources.reduce((p, c) => p.concat(c.StackResourceSummaries), []);
}

async function getStackResource(slsConfigPath, stage, resource) {
    const slsConfig = getServerlessConfig(slsConfigPath);
    let resources = await listStackResources(
        undefined,
        undefined,
        stage,
        slsConfig
    );

    resources = resources.filter(r => r.LogicalResourceId === resource);

    if (resources.length !== 1) {
        throw new Error(`${resources.length} Resources found, 1 expected`);
    }

    return resources[0].PhysicalResourceId;
}

module.exports = {
    getStackResource
};
