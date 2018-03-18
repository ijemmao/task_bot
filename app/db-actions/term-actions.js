import fetch from 'node-fetch'
import Term from './../models/term'

export function createTerm(data) {
  const termData = { id: data.id, name: data.name, startDate: data.startDate, endDate: data.endDate }
  const newTerm = new Term(termData)
  newTerm.save((err, res) => {
    if (err) return err
    console.log(`POST new term ${termData.name}`)
  })
}
