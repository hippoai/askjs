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

export const newEmptyGraph = () => Map({
  nodes: Map(),
  edges: Map()
})

export const Graph = (g) => {

  let _graph = g

  // hasNode
  const hasNode = (key) => _graph.hasIn(['nodes', key])

  // getNode
  const getNode = (key) => _graph.getIn(['nodes', key])

  // getNodeProp
  const getNodeProp = (key, prop) => _graph.getIn(['nodes', key, 'props', prop])

  // mergeNode
  function mergeNode(key, props){
    const g = hasNode(key)
      ? _graph.mergeIn(['nodes', key, 'props'], props)
      : _graph.setIn(['nodes', key], Node(key, props))
    return Graph(g)
  }

  // hasEdge
  const hasEdge = (key) => _graph.hasIn(['edges', key])

  // getEdge
  const getEdge = (key) => _graph.getIn(['edges', key])

  // getEdgeProp
  const getEdgeProp = (key, prop) => _graph
    .getIn(['edges', key, 'props', prop])

  // mergeEdge
  function mergeEdge(key, props, label, start, end){
    const g1 = hasEdge(key)
      ? _graph.mergeIn(['edges', key, 'props'], props)
      : _graph.setIn(['edges', key], Edge(key, label, start, end, props))

    const g2 = g1
      .setIn(['nodes', start, 'out', key], label)
      .setIn(['nodes', end, 'in', key], label)

    return Graph(g2)
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

  // return
  const graph = () => {
    return g
  }

  return {
    hasNode, getNode, getNodeProp, mergeNode,
    hasEdge, getEdge, getEdgeProp, mergeEdge,
    inEKeys, outEKeys, inE, outE, hopKey, hop, startN, endN,
    graph
  }

}
