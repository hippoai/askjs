import { Map, fromJS } from 'immutable'

const Node = (key, props) => Map({
  key,
  props: fromJS(props), // key - value for all properties
  out: Map(), // key (edgeKey) - value (reference to the edge)
  in: Map() // key (edgeKey) - value (reference to the edge)
})

const Edge = (key, label, start, end, props) => Map({
  key,
  label,
  start,
  end,
  props: fromJS(props)
})

const newEmptyGraph = () => Map({
  nodes: Map(),
  edges: Map()
})

const Graph = (g) => {

  let _graph = g || newEmptyGraph()

  // hasNode
  const hasNode = (key) => _graph.hasIn(['nodes', key])

  // getNode
  const getNode = (key) => _graph.getIn(['nodes', key])

  // getNodeProp
  const getNodeProp = (key, prop) => _graph.getIn(['nodes', key, 'props', prop])

  const _mergeNode = (g, key, props) => g.hasIn(['nodes', key])
      ? g.mergeIn(['nodes', key, 'props'], props)
      : g.setIn(['nodes', key], Node(key, props))

  // mergeNode
  function mergeNode(key, props){
    return Graph(_mergeNode(_graph, key, props))
  }

  // hasEdge
  const hasEdge = (key) => _graph.hasIn(['edges', key])

  // getEdge
  const getEdge = (key) => _graph.getIn(['edges', key])

  // getEdgeProp
  const getEdgeProp = (key, prop) => _graph
    .getIn(['edges', key, 'props', prop])

  const _mergeEdge = (g, key, props, label, start, end) => {
    const g1 = g.hasIn(['edges', key])
      ? g.mergeIn(['edges', key, 'props'], props)
      : g.setIn(['edges', key], Edge(key, label, start, end, props))

    const g2 = g1
      .setIn(['nodes', start, 'out', key], label)
      .setIn(['nodes', end, 'in', key], label)

    return g2
  }

  // mergeEdge
  function mergeEdge(key, props, label, start, end){
    return Graph(_mergeEdge(_graph, key, props, label, start, end))
  }

  // inEKeys
  const inEKeys = (nodeKey, label) => {
    return _graph.getIn(['nodes', nodeKey, 'in'])
      .filter(
        (edgeLabel, edgeKey) => (edgeLabel === label) && hasEdge(edgeKey)
      )
  }

  // inE
  const inE = (nodeKey, label) => {
    return inEKeys(nodeKey, label)
      .map((edgeLabel, edgeKey) => getEdge(edgeKey))
  }

  // outEKeys
  const outEKeys = (nodeKey, label) => {
    return _graph.getIn(['nodes', nodeKey, 'out'])
      .filter(
        (edgeLabel, edgeKey) => (edgeLabel === label) && hasEdge(edgeKey)
      )
  }

  // outE
  const outE = (nodeKey, label) => {
    return outEKeys(nodeKey, label)
      .map((edgeLabel, edgeKey) => getEdge(edgeKey))
  }

  // hop
  const hopKey = (edgeKey, nodeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }

    const edge = getEdge(edgeKey)
    return edge.get('start') === nodeKey
      ? edge.get('end')
      : edge.get('start')
  }

  // hop
  const hop = (edgeKey, nodeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }

    const edge = getEdge(edgeKey)
    return edge.get('start') === nodeKey
      ? getNode(edge.get('end'))
      : getNode(edge.get('start'))
  }

  // startN
  const startN = (edgeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }
    const edge = getEdge(edgeKey)

    return getNode(edge.get('start'))
  }

  // endN
  const endN = (edgeKey) => {
    if(!hasEdge(edgeKey)){
      return undefined
    }
    const edge = getEdge(edgeKey)

    return getNode(edge.get('end'))
  }

  // merge
  function merge({nodes, edges}){

    const g1 = Object.keys(nodes).reduce(
      (acc, nodeKey) => {
        const node = nodes[nodeKey]
        return _mergeNode(acc, nodeKey, node['props'])
      },
      _graph
    )

    const g2 = Object.keys(edges).reduce(
      (acc, edgeKey) => {
        const edge = edges[edgeKey]

        return _mergeEdge(
          acc, edgeKey,
          edge['props'], edge['label'],
          edge['start'], edge['end']
        )
      },
      g1
    )

    return Graph(g2)

  }

  // return
  const graph = () => {
    return g
  }

  return {
    hasNode, getNode, getNodeProp, mergeNode,
    hasEdge, getEdge, getEdgeProp, mergeEdge,
    merge,
    inEKeys, outEKeys, inE, outE, hopKey, hop, startN, endN,
    graph
  }

}

export default Graph
