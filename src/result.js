import { Map } from 'immutable'

// newResult finds the start nodes in the graph
// and stores them in a Map, indexing them by their nodeKey
const newResult = (graph, starts) => starts
  .filter((nodeKey) => graph.hasNode(nodeKey))
  .reduce(
    (acc, nodeKey) => graph.hasNode(nodeKey)
      ? acc.set(nodeKey, graph.getNode(nodeKey))
      : acc,
    Map()
  )

export {
  newResult
}
