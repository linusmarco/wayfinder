const crypto = require('crypto');

const hlp = require('./lib/helpers');

async function poll(event) {
    const S3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key: event.queryStringParameters.d
    };

    try {
        return await hlp.S3GetUrl(S3Params);
    } catch (e) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            isBase64Encoded: false,
            body: JSON.stringify({
                error: e.toString()
            })
        };
    }
}

async function initialize(event) {
    const params = JSON.parse(
        Buffer.from(event.queryStringParameters.d, 'base64').toString()
    );

    var S3Key = crypto
        .createHash('md5')
        .update(event.queryStringParameters.d)
        .digest('hex');

    const S3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${S3Key}-walked`
    };

    try {
        return await hlp.S3GetUrl(S3Params);
    } catch (e) {
        console.log('could not find cached map');

        try {
            await hlp.SNSPublish(
                { params, S3Key },
                process.env.GET_DATA_TOPIC_ARN
            );

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({
                    wait: true,
                    params,
                    S3Key
                })
            };
        } catch (e) {
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({
                    error: e.toString()
                })
            };
        }
    }
}

module.exports = {
    initialize,
    poll
};
