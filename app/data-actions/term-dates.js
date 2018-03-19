import moment from 'moment'
import { formatLists } from './markdown'
import { getTerm } from './../db-actions/term-actions'

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
export const daysBeforeStart = (termStartDates) => {
  const startDates = termStartDates
  let minDays = 10000
  startDates.forEach(startDate => {
    minDays = Math.min(minDays, Math.abs(moment().diff(startDate, 'days')))
  })
  console.log(`Days before the next term starts: ${minDays}`)
  return minDays
}

export const updateStartDate = (date) => {
  newStartDate = date
}

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
 * Returns the start date of a specified term
 * @param term - String representation of term
 */
export const getTermStartDate = (term) => {
  return new Promise((resolve, reject) => {
    getTerm(term)
      .exec((err, res) => {
        if (err) reject(err)
        console.log(res.startDate)
        resolve(res.startDate)
      })
  })
}

let confirmDatesMessage = {
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

export const getConfirmDatesMessage = (currentTerm) => {
  let message = ''
  let startDate = null
  let endDate = null
  return new Promise((resolve, reject) => {
    getTermStartDate(currentTerm)
      .then(resStart => {
        console.log(resStart)
        startDate = moment(resStart)
        endDate = moment(resStart).clone().add(10, 'weeks')
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
