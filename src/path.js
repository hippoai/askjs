import { fromJS } from 'immutable'

// newPath
// for every node in the result we store how we got there if needed
// indexed by the node key
const newPath = (starts) => {
  let o = {}
  for(let start of starts){
    o[start] = []
  }
  return fromJS(o)
}

// Step
// this is what we store in the path, a previous node key, and an edge key
const Step = (nodeKey, edgeKey) => {
  return {
    nodeKey, edgeKey
  }
}


export {
  newPath, Step
}
