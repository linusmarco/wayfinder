const hlp = require('./lib/helpers');
const get = require('./lib/getData');
const parse = require('./lib/parseData');
const merge = require('./lib/merge');
const walk = require('./lib/walk');

async function getData(event) {
    const msg = JSON.parse(event.Records[0].Sns.Message);
    const raw = await get(msg.params.mapArea);

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-raw`,
        Body: JSON.stringify(raw),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        {
            params: msg.params,
            S3KeyMapArea: msg.S3KeyMapArea,
            S3KeyParams: msg.S3KeyParams
        },
        process.env.PARSE_DATA_TOPIC_ARN
    );
}

async function parseData(event) {
    const msg = JSON.parse(event.Records[0].Sns.Message);

    const raw = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-raw`
    });

    const parsed = parse(
        JSON.parse(raw.toString()),
        msg.params.mapArea.id ? null : msg.params.mapArea
    );

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-parsed`,
        Body: JSON.stringify(parsed),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        {
            params: msg.params,
            S3KeyMapArea: msg.S3KeyMapArea,
            S3KeyParams: msg.S3KeyParams
        },
        process.env.MERGE_DATA_TOPIC_ARN
    );
}

async function mergeData(event) {
    const msg = JSON.parse(event.Records[0].Sns.Message);

    const parsed = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-parsed`
    });

    const merged = merge(JSON.parse(parsed.toString()));

    await hlp.S3Put({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-merged`,
        Body: JSON.stringify(merged),
        ContentType: 'application/json'
    });

    await hlp.SNSPublish(
        {
            params: msg.params,
            S3KeyMapArea: msg.S3KeyMapArea,
            S3KeyParams: msg.S3KeyParams
        },
        process.env.WALK_DATA_TOPIC_ARN
    );
}

async function walkData(event) {
    const msg = JSON.parse(event.Records[0].Sns.Message);

    const merged = await hlp.S3Get({
        Bucket: process.env.BUCKET_NAME,
        Key: `${msg.S3KeyMapArea}-merged`
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
        Key: `${msg.S3KeyParams}-walked`,
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
