const hlp = require('./lib/helpers');
const get = require('./lib/getData');
const parse = require('./lib/parseData');
const merge = require('./lib/merge');
const walk = require('./lib/walk');

async function getData(event) {
    console.log(event);

    const msg = JSON.parse(event.Records[0].Sns.Message);
    const raw = await get(msg.params.mapArea);

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-raw`,
        Body: JSON.stringify(raw),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        { params: msg.params, S3Key: msg.S3Key },
        process.env.PARSE_DATA_TOPIC_ARN
    );
}

async function parseData(event) {
    console.log(event);

    const msg = JSON.parse(event.Records[0].Sns.Message);

    const raw = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-raw`
    });

    const parsed = parse(
        JSON.parse(raw.toString()),
        msg.params.mapArea.id ? null : msg.params.mapArea
    );

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-parsed`,
        Body: JSON.stringify(parsed),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        { params: msg.params, S3Key: msg.S3Key },
        process.env.MERGE_DATA_TOPIC_ARN
    );
}

async function mergeData(event) {
    console.log(event);

    const msg = JSON.parse(event.Records[0].Sns.Message);

    const parsed = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-parsed`
    });

    const merged = merge(JSON.parse(parsed.toString()));

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-merged`,
        Body: JSON.stringify(merged),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        { params: msg.params, S3Key: msg.S3Key },
        process.env.WALK_DATA_TOPIC_ARN
    );
}

async function walkData(event) {
    console.log(event);

    const msg = JSON.parse(event.Records[0].Sns.Message);

    const merged = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-merged`
    });

    const walked = walk(
        JSON.parse(merged.toString()),
        msg.params.origins,
        msg.params.metric,
        msg.params.numTicks,
        msg.params.size
    );

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3Key}-walked`,
        Body: JSON.stringify(walked),
        ContentType: 'application/json'
    });
}

module.exports = {
    getData,
    parseData,
    mergeData,
    walkData
};
