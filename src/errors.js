import {
  ERR_NODE_NOT_FOUND, ERR_KEY_NOT_FOUND, ERR_EXTREMITY_NOT_FOUND
} from './constants'

const Err = (code, props) => {
  return {
    code, props
  }
}

const errNodeNotFound = (nodeKey) => Err(
  ERR_NODE_NOT_FOUND,
  { nodeKey }
)

const errNodePropNotFound = (nodeKey, propKey) => Err(
  ERR_KEY_NOT_FOUND,
  { nodeKey, propKey }
)

const errExtremityNotFound = (edgeKey, startNodeKey) => Err(
  ERR_EXTREMITY_NOT_FOUND,
  { edgeKey, startNodeKey }
)

export {
  Err,
  errNodeNotFound, errNodePropNotFound, errExtremityNotFound
}
