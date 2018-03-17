import moment from 'moment'
import schedule from 'node-schedule'
import data from './../../mock_data/milestones'

export let onTerm = false

/*
 * Shifts the provided date to the first Wednesday
 */
const shiftToWednesday = (termStartDate) => {
  while (termStartDate.format('dddd') !== 'Wednesday') {
    termStartDate.add(1, 'days')
  }
  return termStartDate
}

// winter
const firstWeekWinter = moment().week(1)
let firstDayWinter = firstWeekWinter.add(3 - firstWeekWinter.get('date'), 'days')
let lastDayWinter = moment()
while (firstDayWinter.format('dddd') !== 'Monday' && firstDayWinter.format('dddd') !== 'Wednesday') {
  firstDayWinter.add(1, 'days')
}
firstDayWinter = shiftToWednesday(firstDayWinter)
lastDayWinter = firstDayWinter.add(10, 'weeks')
console.log(`First day of winter term: ${firstDayWinter}`)
console.log(`Last day of winter term: ${lastDayWinter}`)

// spring
const firstWeekSpring = moment().week(12)
let firstDaySpring = firstWeekSpring
let lastDaySpring = moment()
while (firstDaySpring.format('dddd') !== 'Monday') {
  firstDaySpring.add(1, 'days')
}
firstDaySpring = shiftToWednesday(firstDaySpring)
lastDaySpring = firstDaySpring.add(10, 'weeks')
console.log(`First day of spring term: ${firstDaySpring}`)
console.log(`Last day of winter term: ${lastDaySpring}`)

// summer
const firstWeekSummer = moment().week(24)
let firstDaySummer = firstWeekSummer
let lastDaySummer = moment()
while (firstDaySummer.format('dddd') !== 'Thursday') {
  firstDaySummer.add(1, 'days')
}
firstDaySummer = shiftToWednesday(firstDaySummer)
lastDaySummer = firstDaySummer.add(10, 'weeks')
console.log(`First day of summer term: ${firstDaySummer}`)
console.log(`Last day of summer term: ${lastDaySummer}`)

// fall
const firstWeekFall = moment().week(36)
let firstDayFall = firstWeekFall
let lastDayFall = moment()
while ((firstDayFall.format('dddd') !== 'Monday' && firstDayFall.format('dddd') !== 'Wednesday') || firstDayFall.get('date') < 11) {
  firstDayFall.add(1, 'days')
}
firstDayFall = shiftToWednesday(firstDayFall)
lastDayFall = firstDayFall.add(10, 'weeks')
console.log(`First day of summer term: ${firstDayFall}`)
console.log(`Last day of summer term: ${lastDayFall}`)

/*
 * Checks to see if the current date is in
 * one of the slated term ranges
 */
export const checkOnTerm = () => {
  const ranges = [
    [firstDayWinter, lastDayWinter],
    [firstDaySpring, lastDaySpring],
    [firstDaySummer, lastDaySummer],
    [firstDayFall, firstDayFall],
  ]
  ranges.forEach(currentRange => {
    if (moment().range(currentRange[0], currentRange[1]).contains(moment())) {
      return true
    }
  })
  return false
}

// Checks daily at 12AM to see if term start/end dates are correct
const updateTermBounds = schedule.scheduleJob({ hour: 0, minute: 0, second: 0 }, () => {
  console.log('Updating the expected term bounds are correct')

  // We are not in a term and we haven't confirmed correct term start/end dates
  /*
   * TODO: Check with admin to make sure that currently assigned
   * start/end dates are correct
   */
  onTerm = checkOnTerm()
})

/*
 * Takes a given header, makes it bold, all uppercase, and adds a
 * newline character at the ned of it.
 */
const formatHeader = (key) => {
  return `\n*${key.toUpperCase()}*:\n`
}

/*
 * Format items in a dictionary into a bullet list format where each
 * line is tabbed.
 */
const formatLists = (dict) => {
  let result = ''

  for (const item in dict) {
    result += `\t• ${dict[item]}\n`
  }
  return result
}

/*
* getMilestone() takes in the current week number and gets and formats the milestone for
* that week.
*/
export const getMilestone = (week) => {
  const rawMilestone = data[week] // pulls raw milestone
  let milestone = '@channel _It\'s milestone time!_\n\n'

  // adds weekly milestone title and week #
  milestone += `*Week ${rawMilestone.milestone}:* ${rawMilestone.title}\n`

  // formats each section of the milestone in markdown format
  for (const section in rawMilestone) {
    if (section !== 'milestone' && section !== 'title') {
      milestone += formatHeader(section)
      if (typeof rawMilestone[section] === typeof new Object()) {
        milestone += formatLists(rawMilestone[section])
      } else {
        milestone += (`${rawMilestone[section]}\n`)
      }
    }
  }

  // tacks on the 'But wait, there's more!' statement
  milestone += '\nBut wait, there\'s more! Check out https://build.dali.dartmouth.edu for the full list of tasks.'

  return milestone
}
