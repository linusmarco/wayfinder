import json

import pandas as pd


def main():

    # read nodes
    nodes = pd.read_json('../data/nodes.json')

    # clean nodes
    nodes['wayId'] = nodes['wayId'].astype(str)
    nodes['nodeId'] = nodes['nodeId'].astype(int)
    nodes['wayNodeIdx'] = nodes['wayNodeIdx'].astype(int)
    nodes['lat'] = nodes['lat'].astype(int)
    nodes['lon'] = nodes['lon'].astype(int)

    # sort and create overall node index
    nodes.sort_values(by=['wayId', 'wayNodeIdx'])
    nodes.index.rename('nodeIdx', inplace=True)
    nodes.reset_index(inplace=True)

    # merge nodes to self to get intersections
    m = pd.merge(nodes, nodes, on='nodeId', how='left')

    # get only only true intersections
    diff_way = m['wayId_x'] != m['wayId_y']
    same_way_diff_node = ~diff_way & (m['wayNodeIdx_x'] != m['wayNodeIdx_y'])
    intersection = diff_way | same_way_diff_node
    m = m.loc[intersection]

    # get list of nodes that each node intersects
    ids = m.groupby('nodeIdx_x').apply(get_intersections)
    ids = ids.to_dict()

    # put intersection ids back onto nodes df
    nodes['ints'] = nodes['nodeIdx'].map(lambda x: ids.get(x, []))

    # convert nodes df for output
    nodes = nodes[['wayId', 'nodeId', 'wayNodeIdx', 'lat', 'lon', 'ints']]
    drops = ['wayId', 'wayNodeIdx']
    way_to_obj = lambda x: x.drop(drops, axis=1).to_dict(orient='records')
    obj = nodes.groupby('wayId').apply(way_to_obj).to_dict()

    # write final file
    with open('../data/final.json', 'w') as f:
        json.dump(obj, f)


def get_intersections(group):
    group[['wayId', 'wayNodeIdx']] = group[['wayId_y', 'wayNodeIdx_y']]

    return group[['wayId', 'wayNodeIdx']].to_dict(orient='records')


if __name__ == "__main__":
    main()
