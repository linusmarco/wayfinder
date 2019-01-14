const request = require('request');

const AWS = require('aws-sdk');
const SNS = new AWS.SNS();
const S3 = new AWS.S3();

function SNSPublish(message, arn) {
    return new Promise((resolve, reject) => {
        SNS.publish(
            {
                Message: JSON.stringify(message),
                TopicArn: arn
            },
            (err, data) => {
                if (err) reject(err);
                else resolve(data);
            }
        );
    });
}

async function S3ObjExists(key) {
    return new Promise(res => {
        S3.headObject(
            {
                Bucket: process.env.BUCKET_NAME,
                Key: key
            },
            err => {
                res(!err);
            }
        );
    });
}

async function S3GetUrl(key) {
    return new Promise(res => {
        S3.getSignedUrl(
            'getObject',
            {
                Bucket: process.env.BUCKET_NAME,
                Key: key
            },
            (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            }
        );
    });
}

async function S3Get(params) {
    return new Promise((res, rej) => {
        S3.getObject(params, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data.Body);
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

function requestPromise(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error || response.statusCode !== 200) reject(error);

            resolve({ response, body });
        });
    });
}

function parseSpeed(rawSpd) {
    let parsed;

    try {
        parsed = Number(rawSpd.replace('mph', ''));
    } catch (e) {
        console.error(`could not parse speed: ${rawSpd}`);
    }

    if (isNaN(parsed)) {
        console.error(`could not parse speed: ${rawSpd}`);
    } else {
        return parsed;
    }
}

function pointInBox(point, bounds) {
    if (!(point.lat >= bounds.s)) return false;
    if (!(point.lat <= bounds.n)) return false;
    if (!(point.lon >= bounds.w)) return false;
    if (!(point.lon <= bounds.e)) return false;

    return true;
}

function urlDecodeObj(encoded) {
    return JSON.parse(
        Buffer.from(
            encoded
                .replace(/\./g, '+')
                .replace(/_/g, '/')
                .replace(/-/g, '='),
            'base64'
        ).toString()
    );
}

function constructLambdaResp(code, body) {
    return {
        statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        isBase64Encoded: false,
        body: body
    };
}

module.exports = {
    requestPromise,
    parseSpeed,
    pointInBox,
    SNSPublish,
    S3ObjExists,
    S3GetUrl,
    S3Get,
    S3Put,
    urlDecodeObj,
    constructLambdaResp
};
