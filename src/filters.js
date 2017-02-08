const hasResult = (trv, path) => {
  return trv.size() > 0
}

const isInValues = (key, ...values) => {
  return (node, path) => {
    const value = node.get(key)
    return isIn(value, ...values)
  }
}

const isIn = (value, ...values) => {
  for(let v of values){
    if(v === value){
      return true
    }
  }
  return false
}

export {
  hasResult, isInValues
}
