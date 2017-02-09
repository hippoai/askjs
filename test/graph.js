import { Graph } from 'imgraphjs'
import should from 'should'
import { Trv, hasResult } from '../src'
import fs from 'fs'

const Pretty = (obj) => JSON.stringify(obj, null, 2)

const newGraph = JSON.parse(
  fs.readFileSync('./data/data1.json')
)

// load the graph
const g = Graph().merge(newGraph)

// worksForOnePlus
const worksForOnePlus = (t, path) => {
  const r = t
    .result()
    .filter((node, nodeKey) => node.getIn(['props', 'name']) === 'OnePlus')

  return r.size > 0

}

const traversal = Trv({
  g, starts: ["company.OnePlus"]
})

const r = traversal
  .inV('WORKS_IN', false)
  .deepen()
  .inV('IS_FATHER_OF', false)
  .deepFilter(hasResult)
  .deepen()
  .outV('WORKS_IN', false)
  .deepFilter(worksForOnePlus)
  .flatten()
  .deepFilter(hasResult)
  .shallowSave('name::fatherName')
  .shallowSave('inexistantField')
  .deepSave('father', true)
  .flatten()
  .shallowSave('name')



describe('Big traversal', () => {

  const _cache = r.cache()

  console.log(_cache.toJS())

  it('should find three nodes', () => {
    should(_cache.size).equal(3)
  })

  it('should find clara\'s father', () => {
    should(_cache.getIn(['person.clara', 'father', 'fatherName'])).equal('Tim')
  })

})
