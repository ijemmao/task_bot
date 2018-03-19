import Term from './../models/term'

export function createTerm(data) {
  const termData = { name: data.name, startDate: data.startDate, endDate: data.endDate }
  const newTerm = new Term(termData)
  newTerm.save((err, res) => {
    if (err) return err
    console.log(`POST new term ${termData.name}`)
  })
}

export function updateTerm(data) {
  return new Promise((resolve, reject) => {
    Term.update(
      { name: data.name },
      { $set: { startDate: data.startDate, endDate: data.endDate } }
    )
      .exec((err, res) => {
        if (err) reject(err)
        resolve(`Successfully updated the term ${data.name}`)
      })
  })
}

export function getTerm(termName) {
  return Term.findOne({ name: termName })
}

export function getTerm() {
  return Term.find({})
}
