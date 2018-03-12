// ---------------------- milestones ---------------------- //

/*
* getMilestone() takes in the current week number and gets and formats the milestone for
* that week.
*/
const getMilestone = (week) => {
  const rawMilestone = data[week] // pulls raw milestone
  let milestone = '@channel _It\'s milestone time!_\n\n'

  // adds weekly milestone title and week #
  milestone += `*Week ${rawMilestone.milestone}:* ${rawMilestone.title}\n`

  // formats each section of the milestone in markdown format
  for (const section in rawMilestone) {
    if (section != 'milestone' && section != 'title') {
      milestone += markdown.formatHeader(section)
      if (typeof rawMilestone[section] === typeof new Object()) {
        milestone += markdown.formatLists(rawMilestone[section])
      } else {
        milestone += (`${rawMilestone[section]}\n`)
      }
    }
  }

  // tacks on the 'But wait, there's more!' statement
  milestone += '\nBut wait, there\'s more! Check out https://build.dali.dartmouth.edu for the full list of tasks.'

  return milestone
}

const channels = ['C9G17060H', 'C9G073P2N']   // dummy channel list

// start and end dates for term and week count
const startDate = moment('03/28/2018', 'MM/DD/YYYY')
const endDate = moment('05/30/2018', 'MM/DD/YYYY')
let currentWeek = 0

// schedule milestone message for Wednesday after the Lab meeting at 8pm
const rule = new schedule.RecurrenceRule()
rule.dayOfWeek = 3
rule.hour = 20
rule.minute = 0
rule.second = 0

// if the current date is within the start and end date range
// if (moment().range(startDate, endDate) && currentWeek <= 8) {
//   // post milestones message in each channel in channels list if it's the corresponding time
//   schedule.scheduleJob(r => {
//     channels.forEach(channel => {
//       slackbot.say({
//         text: getMilestone(currentWeek),
//         channel,
//       })
//       currentWeek += 1
//     })
//   })
// }
