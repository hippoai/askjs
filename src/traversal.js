import { fromJS, Map } from 'immutable'

import { renameKey, newCache } from './cache'
import { newPath, Step } from './path'
import { newResult } from './result'
import { Err, errNodeNotFound, errNodePropNotFound, errExtremityNotFound } from './errors'

// Trv
// traverse a graph
const Trv = ({g, path = [], starts = []}) => {

  let _graph = g
  let _result = newResult(_graph, starts)
  let _cache = newCache()
  let _path = (path.length > 0) ? path : newPath(starts)
  let _trvs = {}
  let _isDeep = false
  let _errors = []

  // isDeep
  const isDeep = () => _isDeep

  // size
  const size = () => _result.size

  // result
  const result = () => _result

  // cache
  const cache = () => _cache

  // graph
  const graph = () => _graph

  // traversals
  const trvs = () => _trvs

  // errors
  const errors = () => _errors

  // isVeryDeep
  // returns true if it is deep and one of the traversal in _trvs is as well
  const isVeryDeep = () => {
    if(!_isDeep){
      return false
    }

    if(Object.keys(_trvs).length === 0){
      return false
    }

    for(let trvKey in _trvs){
      return _trvs[trvKey].isDeep()
    }

    return false
  }

  // _addError
  const _addError = (err) => {
    _errors.push(err)
  }

  // shallowSave
  function shallowSave(...keys) {

    // if deep, apply to traversal children
    if(_isDeep){
      for(let trvKey in _trvs){
        _trvs[trvKey] = _trvs[trvKey].shallowSave(...keys)
      }
      return this
    }

    // Otherwise, for every node in the result, save the keys
    _result.forEach((node, nodeKey) => {

      // If the cache has not yet been set for this nodeKey
      if(!_cache.has(nodeKey)){
        _cache.set(nodeKey, Map())
      }

      // Now save every key we can find among keys
      keys.forEach((key) => {
        const {oldKey, newKey} = renameKey(key)
        const value = _graph.getNodeProp(nodeKey, oldKey)
        if(value !== undefined){
          _cache = _cache.setIn([nodeKey, newKey], value)
        }else{
          _addError(errNodePropNotFound(nodeKey, oldKey))
        }
      })
    })

    return this
  }

  // shallowSaveF will save based on a function of the property key
  function shallowSaveF(f) {

    // Deep calls
    // if deep, apply to traversal children
    if(_isDeep){
      for(let trvKey in _trvs){
        _trvs[trvKey] = _trvs[trvKey].shallowSaveF(f)
      }
      return this
    }

    // Otherwise, loop over every node in the result
    _result.forEach((node, nodeKey) => {

      // If the cache has not yet been set for this nodeKey
      if(!_cache.has(nodeKey)){
        _cache.set(nodeKey, Map())
      }

      const nodeProps = _graph.getNodeProps(nodeKey)
      if(nodeProps === undefined){
        return
      }

      nodeProps.forEach((value, key) => {
        const { keep, newKey } = f(key)
        if(keep){
          _cache.setIn([nodeKey, newKey], value)
        }
      })

    })

    return this
  }

  // deepSave
  // will save the children's shallowly saved data at the parent level
  // it is applied on level N-1 (where N is total depth)
  // if simplify is true and there is only one nestedTrv, we'll pop it's cache
  function deepSave(name, simplify) {

    // It has to be deep to be used
    if(!_isDeep){
      return this
    }

    // One level higher if N > 2
    if(isVeryDeep()){
      for(let trvKey of _trvs){
        _trvs[trvKey] = _trvs[trvKey].deepSave(name)
      }
      return this
    }


    // Actual deepSave function, when we are at the right level
    Object.keys(_trvs).forEach((nodeKey) => {
      const nestedTrv = _trvs[nodeKey]

      // Create the cache entry for this node
      if(!_cache.has(nodeKey)){
        _cache.set(nodeKey, Map())
      }

      _cache = _cache.setIn([nodeKey, name],
        (simplify && nestedTrv.size() === 1)
        ? nestedTrv.cache().first()
        : nestedTrv.cache()
      )
    })

    return this
  }

  // deepen
  // each node becomes its own query
  function deepen() {

    // If N > 1 then deepen next level
    if(_isDeep){
      for(let trvKey in _trvs){
        _trvs[trvKey].deepen()
      }
      return this
    }

    const trvs = {}
    _result.forEach((node) => {
      const nodeKey = node.get('key')
      trvs[nodeKey] = Trv({g: _graph, path: _path, starts: [nodeKey]})
    })

    _trvs = trvs
    _isDeep = true


    return this
  }

  // flatten
  // after we have saved or filtered information
  // go back to previous level
  function flatten() {
    if(!_isDeep){
      return this
    }

    if(isVeryDeep()){
      for(let trvKey in _trvs){
        _trvs[trvKey].flatten()
      }
      return this
    }

    Object.keys(_trvs).forEach((nodeKey) => {
      const nestedTrv = _trvs[nodeKey]
      nestedTrv.errors().forEach((err) => {
        _addError(err)
      })
    })

    _trvs = {}
    _isDeep = false

    return this
  }

  // shallowFilter
  function shallowFilter(predicate){

    // Only filter the last step
    if (_isDeep){
      for(let trvKey in _trvs){
        _trvs[trvKey] = _trvs[trvKey].shallowFilter(predicate)
      }
      return this
    }

    // Keep only the results whose node properties are accepted by the predicate
    _result = _result
      .filter((node, nodeKey) => predicate(node, _path.get(nodeKey)))
    return this

  }

  // deepFilter
  function deepFilter(keepQuery){

    // Depth needs to be > 1
    if(!_isDeep){
      return this
    }

    // Only filter on N-1 level
    if(isVeryDeep()){
      for(let trvKey in _trvs){
        _trvs[trvKey].deepFilter(keepQuery)
      }
      return this
    }

    // Find the nodes who don't pass keepQuery
    let nodesToDiscard = []
    Object.keys(_trvs).forEach((nodeKey) => {
      const nestedTrv = _trvs[nodeKey]
      if(!keepQuery(nestedTrv, _path.get(nodeKey))){
        nodesToDiscard.push(nodeKey)
      }
    })


    // Remove these nodes from the traversal
    nodesToDiscard.forEach((nodeKey) => {
      _result = _result.delete(nodeKey)
      delete _trvs[nodeKey]
    })
    return this
  }

  // hop
  function hop(getIncomingNodes, label, rememberPath){

    // hop on the outermost layer
    if(_isDeep){
      for(let trvKey in _trvs){
        _trvs[trvKey] = _trvs[trvKey].hop(getIncomingNodes, label, rememberPath)
      }
      return this
    }

    let newResult = Map()
    let newPath = Map()

    _result.forEach((aNode, aNodeKey) => {

      // this returns a map of edge key > label
      const edges = getIncomingNodes
        ? _graph.inEKeys(aNodeKey, label)
        : _graph.outEKeys(aNodeKey, label)

      edges.forEach((edgeLabel, edgeKey) => {
        const bNode = _graph.hop(edgeKey, aNodeKey)
        if(bNode === undefined){
          _addError(errExtremityNotFound(edgeKey, aNodeKey))
          return
        }

        const bNodeKey = bNode.get('key')
        newResult = newResult.set(bNodeKey, bNode)
        newPath = newPath.set(
          bNodeKey,
          rememberPath
            ? _path.get(aNodeKey).concat([Step(aNodeKey, edgeKey)])
            : _path.get(aNodeKey)
        )
      })

    })

    _result = newResult
    _path = newPath

    return this
  }

  // inV
  function inV(label, rememberPath){
    hop(true, label, rememberPath)
    return this
  }

  // outV
  function outV(label, rememberPath){
    hop(false, label, rememberPath)
    return this
  }

  function logCache(other){
    if(other){
      console.log(other)
    }
    console.log(_cache.toJS())
    return this
  }

  function logResult(other){
    if(other){
      console.log(other)
    }
    console.log(_buildResultLog(this).toJS())

    return this
  }

  const _buildResultLog = (trv) => {
    if(!trv.isDeep()) {
      return trv.result().reduce(
        (acc, v, nodeKey) => acc.set(nodeKey, ""),
        Map()
      )
    }

    const _thisTrvs = trv.trvs()

    return Object.keys(_thisTrvs).reduce(
      (acc, nodeKey) => acc.set(nodeKey, _buildResultLog(_thisTrvs[nodeKey])),
      Map()
    )
  }

  // public api
  return {
    isDeep, size, result, cache, graph, trvs, errors, isVeryDeep,
    shallowSave, shallowSaveF, deepSave, deepen, flatten,
    shallowFilter, deepFilter, hop, inV, outV,
    logCache, logResult
  }

}

export default Trv
