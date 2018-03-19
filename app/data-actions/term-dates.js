import moment from 'moment'
import { formatLists } from './markdown'
import { getTerm, getTerms } from './../db-actions/term-actions'

let newStartDate
let newEndDate

/*
 * Shifts the provided date to the first Wednesday
 */
const shiftToWednesday = (termStartDate) => {
  while (termStartDate.format('dddd') !== 'Wednesday') {
    termStartDate.add(1, 'days')
  }
  return termStartDate
}

/*
 * Generates possible term start and end dates
 * for all terms. Once generated, the terms will
 * then be presented to admin user to confirm
 */
export const generateTermDates = () => {
  // Winter term ranges
  const firstWeekWinter = moment().week(1)
  let firstDayWinter = firstWeekWinter.add(2, 'days')
  let lastDayWinter = moment()
  while (firstDayWinter.format('dddd') !== 'Monday' && firstDayWinter.format('dddd') !== 'Wednesday') {
    firstDayWinter.add(1, 'days')
  }
  firstDayWinter = shiftToWednesday(firstDayWinter)
  lastDayWinter = firstDayWinter.clone().add(10, 'weeks')
  console.log('First day of winter term:', firstDayWinter)
  console.log('Last day of winter term:', lastDayWinter)

  // Spring term ranges
  const firstWeekSpring = moment().week(13)
  let firstDaySpring = firstWeekSpring
  let lastDaySpring = moment()
  while (firstDaySpring.format('dddd') !== 'Monday') {
    firstDaySpring.add(1, 'days')
  }
  firstDaySpring = shiftToWednesday(firstDaySpring)
  lastDaySpring = firstDaySpring.clone().add(10, 'weeks')
  console.log('First day of spring term:', firstDaySpring)
  console.log('Last day of winter term:', lastDaySpring)

  // Summer term ranges
  const firstWeekSummer = moment().week(24)
  let firstDaySummer = firstWeekSummer
  let lastDaySummer = moment()
  while (firstDaySummer.format('dddd') !== 'Thursday') {
    firstDaySummer.add(1, 'days')
  }
  firstDaySummer = shiftToWednesday(firstDaySummer)
  lastDaySummer = firstDaySummer.clone().add(10, 'weeks')
  console.log('First day of summer term:', firstDaySummer)
  console.log('Last day of summer term:', lastDaySummer)

  // Fall term ranges
  const firstWeekFall = moment().week(36)
  let firstDayFall = firstWeekFall
  let lastDayFall = moment()
  while ((firstDayFall.format('dddd') !== 'Monday' && firstDayFall.format('dddd') !== 'Wednesday') || firstDayFall.get('date') < 11) {
    firstDayFall.add(1, 'days')
  }
  firstDayFall = shiftToWednesday(firstDayFall)
  lastDayFall = firstDayFall.clone().add(10, 'weeks')
  console.log('First day of summer term:', firstDayFall)
  console.log('Last day of summer term:', lastDayFall)

  const terms = [
    { term: 'winter', ranges: [firstDayWinter, lastDayWinter] },
    { term: 'spring', ranges: [firstDaySpring, lastDaySpring] },
    { term: 'summer', ranges: [firstDaySummer, lastDaySummer] },
    { term: 'fall', ranges: [firstDayFall, firstDayFall] },
  ]

  return terms
}

/*
 * Grabs from database and creates a list that holds
 * the term name and the start/end dates
 */
export const termDates = () => {
  const terms = []
  return new Promise((resolve, reject) => {
    getTerms()
    .exec((err, res) => {
      if (err) return err
      res.forEach(term => {
        terms.push({ term: term.name, ranges: [term.startDate, term.endDate] })
      })
    })
  })
}

/*
 * Checks to see if the current date is in
 * one of the slated term ranges
 */
export const checkOnTerm = (terms) => {
  terms.forEach(currentTerm => {
    if (moment().range(currentTerm.ranges[0], currentTerm.ranges[1]).contains(moment())) {
      return { term: currentTerm.term, onTerm: true }
    }
  })
  return { term: null, onTerm: false }
}

/*
 * Calculates the days before the start of upcoming term
 */
export const daysBeforeStart = (terms) => {
  let minDays = 10000
  let upcomingTerm = null
  terms.forEach(term => {
    const daysDifference = Math.abs(moment().diff(term.ranges[0], 'days'))
    if (minDays > daysDifference) {
      minDays = daysDifference
      upcomingTerm = term.term
    }
  })
  return { daysBefore: minDays, upcomingTerm }
}

/*
 * Updates the local newStartDate variable
 */
export const updateStartDate = (date) => {
  newStartDate = date
}

/*
 * Updates the local newEndDate variable
 */
export const updateEndDate = (date) => {
  newEndDate = date
}

/*
 * Returns a list of the start and end dates of the
 * currently handled term. The dates are already
 * formatted
 */
export const getUpdatedDates = () => {
  return [newStartDate, newEndDate]
}

/*
 * Confirmation message that will be sent out to
 * admin user to begin updating term dates
 */
const confirmDatesMessage = {
  introMessage: '\nHey! I wanted to check to see if my start date for the upcoming term is correct!\n',
  introCurrentDates: 'I currently have the following dates:\n\n',
  dates: [],
  introCommands: '\nHere is a list of commands that should be used:\n\n',
  commands: [
    '*update_start MM-DD-YYYY* - updates the start date. i.e. 09-10-2018',
    '*update_end MM-DD-YYYY* - updates the end date',
    '*show* - shows the updated dates',
    '*abort* - ends confirmation and will be reminded tomorrow at 10AM',
    '*complete* - completes confirmation',
  ],
}

/*
 * Works with the confirmDatesMessage object to populate the
 * blank dates section. Grabs information from database
 */
export const getConfirmDatesMessage = (currentTerm) => {
  let message = ''
  let startDate = null
  let endDate = null
  return new Promise((resolve, reject) => {
    getTerm(currentTerm)
      .then(term => {
        startDate = moment(term.startDate)
        endDate = moment(term.endDate)
        for (const section in confirmDatesMessage) {
          if (section !== 'dates' && section !== 'commands') {
            message += confirmDatesMessage[section]
          } else {
            if (section === 'dates') {
              newStartDate = startDate
              newEndDate = endDate
              confirmDatesMessage[section] = [
                `Start date - ${startDate.format('dddd, MMMM Do YYYY')}`,
                `End date - ${endDate.format('dddd, MMMM Do YYYY')}`,
              ]
            }
            message += formatLists(confirmDatesMessage[section])
          }
        }
        resolve(message)
      })
  })
}
