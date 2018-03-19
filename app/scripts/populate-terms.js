import * as db from './../db'
import { generateTermDates } from './../data-actions/term-dates'
import { createTerm } from './../db-actions/term-actions'

// Populates the database with automatically generated term dates

const terms = generateTermDates()

terms.forEach(term => {
  const termObject = { name: term.term, startDate: term.ranges[0], endDate: term.ranges[1] }
  createTerm(termObject)
})
