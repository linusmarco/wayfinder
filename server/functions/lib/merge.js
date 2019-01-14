const _ = require('lodash');

function merge(nodes) {
    nodes = _.sortBy(nodes, 'nodeId');

    let ints;
    nodes.forEach((n, i, a) => {
        n.wayId = String(n.wayId);
        n.ints = [];

        const lookupInfo = {
            wayId: n.wayId,
            wayNodeIdx: n.wayNodeIdx
        };

        if (i === 0) {
            ints = [lookupInfo];
        } else if (n.nodeId !== a[i - 1].nodeId) {
            const lastNodeId = a[i - 1].nodeId;
            let j = 1;
            while (a[i - j] && a[i - j].nodeId === lastNodeId) {
                a[i - j].ints = ints.filter(d => {
                    const diffWay = d.wayId !== a[i - j].wayId;
                    const sameWayDiffNode =
                        !diffWay && d.wayNodeIdx !== a[i - j].wayNodeIdx;

                    return diffWay || sameWayDiffNode;
                });

                j++;
            }

            ints = [lookupInfo];
        } else {
            ints.push(lookupInfo);
        }
    });

    const i = nodes.length - 1;
    const lastNodeId = nodes[i].nodeId;
    let j = 1;

    while (nodes[i - j] && nodes[i - j].nodeId === lastNodeId) {
        nodes[i - j].ints = ints.filter(d => {
            const diffWay = d.wayId !== nodes[i - j].wayId;
            const sameWayDiffNode =
                !diffWay && d.wayNodeIdx !== nodes[i - j].wayNodeIdx;

            return diffWay || sameWayDiffNode;
        });

        j++;
    }

    nodes = _.sortBy(nodes, ['wayId', 'wayNodeIdx']);

    const final = _.groupBy(
        _.map(nodes, n =>
            _.pick(n, ['wayId', 'maxspeed', 'lat', 'nodeId', 'ints', 'lon'])
        ),
        'wayId'
    );

    return final;
}

module.exports = merge;
