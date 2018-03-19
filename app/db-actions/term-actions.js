import Term from './../models/term'

/*
 * Creates a new Term model in the database.
 * Used for populating database with initial
 * information.
 */
export function createTerm(data) {
  const termData = { name: data.name, startDate: data.startDate, endDate: data.endDate }
  const newTerm = new Term(termData)
  newTerm.save((err, res) => {
    if (err) return err
    console.log(`POST new term ${termData.name}`)
  })
}

/*
 * Updates the specified Term. The correct
 * Term is found with the name property.
 */
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

/*
 * Gets a Term object from the database using
 * the Term's name property.
 */
export function getTerm(termName) {
  return Term.findOne({ name: termName })
}

/*
 * Gets all the Term objects currently existing
 * in the local database.
 */
export function getTerms() {
  return Term.find({})
}
