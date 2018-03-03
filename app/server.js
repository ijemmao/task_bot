import botkit from 'botkit'
import schedule from 'node-schedule'
import data from '../mock_data/milestones' 
import moment from 'moment'
import * as markdown from './markdown.js' 

// botkit controller
const controller = botkit.slackbot({
  debug: false, 
}) 

let channelMessages = []

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
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
controller.on(['ambient', 'direct_message'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (err) return err
    if (!channelMessages[message.channel]) {
      channelMessages[message.channel] = {}
    }
    if (res) {
      if (!channelMessages[message.channel][res.user.id]) {
        channelMessages[message.channel][res.user.id] = []
      }
      channelMessages[message.channel][res.user.id].push(message.ts)
    }
  })
})

/*
 * Listens for database printout
 */
controller.hears(['show'], ['direct_message'], (bot, message) => {
  console.log(channelMessages)
})

/************************* milestones *************************/

var channels = ['C9G17060H', 'C9G073P2N']   // dummy channel list

// start and end dates for term and week count
var startDate = moment('03/28/2018', 'MM/DD/YYYY')
var endDate = moment('05/30/2018', 'MM/DD/YYYY')
var currentWeek = 0

// schedule milestone message for Wednesday after the Lab meeting at 8pm
var rule = new schedule.RecurrenceRule() 
rule.dayOfWeek = 3
rule.hour = 20
rule.minute = 0
rule.second = 0 

// if the current date is within the start and end date range
if (moment().isSameOrAfter(startDate) && moment().isSameOrBefore(endDate) && currentWeek <= 8) {
  
  // post milestones message in each channel in channels list if it's the corresponding time
  var milestones = schedule.scheduleJob(rule, function(){
    for (var i = 0; i < channels.length;  i++) {
      slackbot.say( {
        text: getMilestone(currentWeek),
        channel: channels[i]
      }) 
    }
    currentWeek++
  }) 
}

/*
* getMilestone() takes in the current week number and gets and formats the milestone for
* that week.
*/
function getMilestone(week) {
  var raw_milestone = data[week] // pulls raw milestone
  var milestone = '@channel _It\'s milestone time!_\n\n' 

  // adds weekly milestone title and week #
  milestone += '*Week ' + raw_milestone['milestone'] + ':* ' + (raw_milestone['title'] + '\n')

  // formats each section of the milestone in markdown format
  for (var section in raw_milestone) {
    if (section != 'milestone' && section != 'title') {
      milestone += markdown.formatHeader(section) 
      if (typeof raw_milestone[section] === typeof new Object()) {
        milestone += markdown.formatLists(raw_milestone[section]) 
      } else {
        milestone += (raw_milestone[section] + '\n')
      }
    }
  }

  // tacks on the 'But wait, there's more!' statement
  milestone += "\nBut wait, there's more! Check out https://build.dali.dartmouth.edu for the full list of tasks." 

  return milestone
}
