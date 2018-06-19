const crypto = require('crypto');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const getData = require('./lib/getData');
const parseData = require('./lib/parseData');
const merge = require('./lib/merge');
const walk = require('./lib/walk');

module.exports.handler = async event => {
    const params = JSON.parse(
        Buffer.from(event.queryStringParameters.d, 'base64').toString()
    );

    var S3Key = crypto
        .createHash('md5')
        .update(event.queryStringParameters.d)
        .digest('hex');

    const S3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key: S3Key
    };

    try {
        return await S3GetUrl(S3Params);
    } catch (e) {
        console.log('could not find cached map');
        try {
            const raw = await getData(params.mapArea);
            console.log(
                `Got ${raw.elements.length} nodes and ways from overpass API`
            );
            const nodes = parseData(
                raw,
                params.mapArea.id ? null : params.mapArea
            );
            console.log(`Parsed ${nodes.length} nodes`);
            const merged = merge(nodes);
            console.log(
                `Calcuated intersections of ${Object.keys(merged).length} ways`
            );
            const walked = walk(
                merged,
                params.origins,
                params.metric,
                params.numTicks,
                params.size
            );
            console.log(
                `Finished walking ${walked.nodes.length} nodes from ${
                    walked.origins.length
                } origins`
            );

            await S3Put({
                Bucket: process.env.BUCKET_NAME,
                Key: S3Key,
                Body: JSON.stringify(walked),
                ContentType: 'application/json'
            });

            return await S3GetUrl(S3Params);
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
};

async function S3GetUrl(params) {
    return new Promise((res, rej) => {
        S3.headObject(params, (err, data) => {
            if (err) {
                console.log('no headObject');
                rej(err);
            } else {
                S3.getSignedUrl('getObject', params, (err, data) => {
                    if (err) {
                        console.log('no getSignedUrl');
                        rej(err);
                    } else {
                        res({
                            statusCode: 301,
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                                Location: data
                            }
                        });
                    }
                });
            }
        });
    });
}

async function S3Put(params) {
    return new Promise((res, rej) => {
        S3.putObject(params, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}
