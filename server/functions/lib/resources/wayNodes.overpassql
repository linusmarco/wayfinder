[out:json][timeout:85];

way
  ["highway"]
  ["highway"!~"footway|cycleway|path|service|track|pedestrian|steps|proposed|corridor|construction"]
  (##AREA##)
  ->.relevant_ways;

foreach.relevant_ways->.this_way{
  .this_way;
  out body;

  node(w.this_way)->.this_ways_nodes;

  .this_ways_nodes
  out body;
}