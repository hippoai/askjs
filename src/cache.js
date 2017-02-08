import { Map } from 'immutable'

const KEY_SEPARATOR = '::'

// renameKey
const renameKey = (key) => {
  const splitted = key.split(KEY_SEPARATOR)
  return splitted.length === 1
    ? {oldKey: splitted[0], newKey: splitted[0]}
    : {oldKey: splitted[0], newKey: splitted[1]}
}

// newCache
// a cache stores values along the way
const newCache = () => Map()

export {
  renameKey, newCache
}
