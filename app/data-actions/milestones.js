import moment from 'moment'
import schedule from 'node-schedule'
import data from './../../mock_data/milestones'

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
