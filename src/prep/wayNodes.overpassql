[out:json][timeout:800];

way
  ["highway"]
  ["highway"!~"footway|cycleway|path|service|track|pedestrian|steps"]
  (area:##AREAID##)
  ->.relevant_ways;

foreach.relevant_ways->.this_way{
  .this_way;
  out body;

  node(w.this_way)->.this_ways_nodes;

  .this_ways_nodes
  out body;
}