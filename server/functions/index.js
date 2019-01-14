const crypto = require('crypto');

const hlp = require('./lib/helpers');

async function poll(event) {
    const mapAreaEncoded = event.queryStringParameters.area;
    const paramsEncoded = event.queryStringParameters.params;
    const firstReq = Number(event.queryStringParameters.reqNo) === 0;

    const params = hlp.urlDecodeObj(paramsEncoded);

    const S3KeyMapArea = crypto
        .createHash('md5')
        .update(mapAreaEncoded)
        .digest('hex');

    const S3KeyParams = crypto
        .createHash('md5')
        .update(paramsEncoded)
        .digest('hex');

    if (!(await hlp.S3ObjExists(`${S3KeyMapArea}-raw`))) {
        if (firstReq) {
            await hlp.SNSPublish(
                { params, S3KeyMapArea, S3KeyParams },
                process.env.GET_DATA_TOPIC_ARN
            );
        }

        return hlp.constructLambdaResp(
            200,
            JSON.stringify({
                progress: 'noData'
            })
        );
    } else if (!(await hlp.S3ObjExists(`${S3KeyMapArea}-parsed`))) {
        if (firstReq) {
            await hlp.SNSPublish(
                { params, S3KeyMapArea, S3KeyParams },
                process.env.PARSE_DATA_TOPIC_ARN
            );
        }

        return hlp.constructLambdaResp(
            200,
            JSON.stringify({
                progress: 'rawData'
            })
        );
    } else if (!(await hlp.S3ObjExists(`${S3KeyMapArea}-merged`))) {
        if (firstReq) {
            await hlp.SNSPublish(
                { params, S3KeyMapArea, S3KeyParams },
                process.env.MERGE_DATA_TOPIC_ARN
            );
        }

        return hlp.constructLambdaResp(
            200,
            JSON.stringify({
                progress: 'parsedData'
            })
        );
    } else if (!(await hlp.S3ObjExists(`${S3KeyParams}-walked`))) {
        if (firstReq) {
            await hlp.SNSPublish(
                { params, S3KeyMapArea, S3KeyParams },
                process.env.WALK_DATA_TOPIC_ARN
            );
        }

        return hlp.constructLambdaResp(
            200,
            JSON.stringify({
                progress: 'mergedData'
            })
        );
    } else {
        const walkedUrl = await hlp.S3GetUrl(`${S3KeyParams}-walked`);

        return hlp.constructLambdaResp(
            200,
            JSON.stringify({
                progress: 'walkedData',
                walkedUrl: walkedUrl
            })
        );
    }
}

module.exports = {
    poll
};
