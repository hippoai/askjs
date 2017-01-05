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

export const Graph = ({nodes = Map(), edges = Map()}) => {

  let _nodes = nodes
  let _edges = edges

  // hasNode
  const hasNode = (key) => _nodes.has(key)

  // getNode
  const getNode = (key) => _nodes.get(key)

  // getNodeProp
  const getNodeProp = (key, prop) => _nodes.getIn([key, 'props', prop])

  // mergeNode
  function mergeNode(key, props){
    _nodes = _nodes.has(key)
      ? _nodes.mergeIn([key, 'props'], props)
      : _nodes.set(key, Node(key, props))
    return this
  }

  // hasEdge
  const hasEdge = (key) => _edges.has(key)

  // getEdge
  const getEdge = (key) => _edges.get(key)

  // getEdgeProp
  const getEdgeProp = (key, prop) => _edges.getIn([key, 'props', prop])

  // mergeEdge
  function mergeEdge(key, props, label, start, end){
    _edges = _edges.has(key)
      ? _edges.mergeIn([key, 'props'], props)
      : _edges.set(key, Edge(key, label, start, end, props))

    _nodes = _nodes
      .setIn([start, 'out', key], label)
      .setIn([end, 'in', key], label)

    return this
  }

  // return
  const graph = () => {
    return {
      nodes: _nodes,
      edges: _edges
    }
  }

  return {
    hasNode, getNode, getNodeProp, mergeNode,
    hasEdge, getEdge, getEdgeProp, mergeEdge,
    graph
  }

}
