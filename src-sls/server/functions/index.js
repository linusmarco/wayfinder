const getData = require('./lib/getData');
const parseData = require('./lib/parseData');
const merge = require('./lib/merge');
const walk = require('./lib/walk');

module.exports.handler = async event => {
    const params = JSON.parse(
        Buffer.from(event.queryStringParameters.d, 'base64').toString()
    );

    try {
        const raw = await getData(params.mapArea);
        console.log(
            `Got ${raw.elements.length} nodes and ways from overpass API`
        );
        const nodes = parseData(raw, params.mapArea.id ? null : params.mapArea);
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

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            isBase64Encoded: false,
            body: JSON.stringify(walked)
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
};
