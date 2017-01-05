import { Map, fromJS } from 'immutable'
import { Graph } from './graph'

const KEY_SEPARATOR = '::'

const newPath(starts) = {
  let o = {}
  for(let start of starts){
    o[start] = []
  }
  return fromJS(o)
}

// renameKey
const renameKey = (key) => {
  const splitted = key.split(KEY_SEPARATOR)
  return splitted.length == 1
    ? {oldKey: splitted[0], newKey: splitted[0]}
    : {oldKey: splitted[0], newKey: splitted[1]}
}

const Step = (nodeKey, edgeKey) => {
  return {
    nodeKey, edgeKey
  }
}

const Trv = ({g, path = [], starts = []}) => {

  let _graph = Graph(g)
  let _result = fromJS({})
  let _cache = fromJS({})
  let _path = (path.length > 0) ? path : newPath(starts)
  let _trvs = fromJS({})
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

  // isVeryDeep
  const isVeryDeep = () => {
    if(!_isDeep){
      return false
    }

    if(_trvs.size == 0){
      return false
    }

    return _trvs.first().isDeep()
  }

  // _addError
  const _addError = (err) => {
    _errors.push(err)
  }

  // shallowSave
  const shallowSave = (... keys){
    if(_isDeep){
      _trvs = _trvs.map((nestedTrv) => nestedTrv.shallowSave(keys...))
      return this
    }

    _result.forEach((node, nodeKey) => {
      for(let key of keys){
        const {oldKey, newKey} = renameKey(key)
        const value = _graph.getNodeProp(nodeKey, oldKey)
        if(value !== undefined){
          _cache = _cache.setIn([nodeKey, newKey], value)
        }else{
          _addError(`Key ${oldKey} not found for node ${nodeKey}`)
        }
      }
    })
    return this
  }

  // deepSave
  const deepSave = (name) => {
    if(!_isDeep){
      return this
    }

    if(isVeryDeep()){
      _trvs = _trvs.map((nestedTrv) => nestedTrv.deepSave(name))
      return this
    }

    _trvs.forEach((nestedTrv, nodeKey) => {
      _cache = _cache.setIn([nodeKey, name], nestedTrv.cache())
    })

    return this
  }

  // deepen
  const deepen = () => {
    if(_isDeep){
      _trvs = _trvs.map((nestedTrv) => nestedTrv.deepen())
      return this
    }

    const trvs = {}
    _result.forEach((node) => {
      const nodeKey = node.get('key')
      trvs[nodeKey] = Trv({g: _graph, path: _path, [nodeKey]})
    })

    _trvs = fromJS(trvs)
    _isDeep = true

    return this
  }

  // flatten
  const flatten = () => {
    if(!_isDeep){
      return this
    }

    if(isVeryDeep()){
      _trvs = _trvs.map((nestedTrv) => nestedTrv.flatten())
      return this
    }

    _errors = []
    _trvs.forEach((nestedTrv) => {
      nestedTrv.errors().forEach((err) => {
        _errors.push(err)
      })
    })

    _trvs = fromJS({})
    _isDeep = false

    return this
  }

  // public api
  return {
    size, result, cache
  }

}
