import botkit from 'botkit'
import schedule from 'node-schedule'
import data from '../mock_data/milestones' 
import moment from 'moment'
import * as markdown from './markdown.js' 
import * as db from './db'
import User from './../models/user'
import { createUser } from './../db-actions/user-actions'

let channelMessages = []

// botkit controller
const controller = botkit.slackbot({
  debug: false,
})

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.TASK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) {
    throw new Error(err)
  }
})

// prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) {
      throw new Error(err)
    }
  })
})

/*
 * Listens for any comment from any channel
 * Uses data structure that keeps track of each channel
 * it's respective members, and their comments
 */
controller.on(['ambient', 'direct_message', 'file_share'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (err) return err
    if (!channelMessages[message.channel]) {
      channelMessages[message.channel] = {}
    }
    if (res) {
      if (!channelMessages[message.channel][res.user.id]) {
        channelMessages[message.channel][res.user.id] = []
      }
      channelMessages[message.channel][res.user.id].push({ timestamp: message.ts, type: message.type })
    }
  })
})

/*
 * Adds all users into the database
 */
controller.hears('add_all_users', ['ambient', 'direct_message'], (bot, message) => {
  bot.api.users.list({}, (err, res) => {
    if (err) return err
    res.members.forEach(member => {
      // only takes users that have a first and last name
      if (member.profile.first_name && member.profile.last_name) {
        createUser(member)
      }
    })
  })
})

/*
 * Adds a specified user
 */
controller.hears('add_user', ['direct_message'], (bot, message) => {
  const newUser = message.text.split(/[ <>@]/).filter(item => item.length > 0)[0]
  bot.api.users.info({ user: newUser }, (err, res) => {
    createUser(res.user)
    console.log('success')
  })
})

controller.hears(['show'], ['direct_message'], (bot, message) => {
  console.log(channelMessages)
})

/************************* milestones *************************/

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

controller.hears('add_user', ['direct_message'], (bot, message) => {
  bot.reply(message, 'alright')
  const newUser = new User({ id: '0000', name: 'ijemmao', channels: [] })
  newUser.save((err, res) => {
    if (err) return err
    console.log('completed database insertion')
  })
})
