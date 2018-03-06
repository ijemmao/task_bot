import botkit from 'botkit'
import schedule from 'node-schedule'
import data from '../mock_data/milestones'
import moment from 'moment'
import * as markdown from './markdown.js'
import * as db from './db'
import { createUser, getDALIUsers } from './db-actions/user-actions'

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

console.log('Task Bot is up and running!')

// prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) {
      throw new Error(err)
    }
  })
})

// ------------------ channel information ----------------- //

/*
 * Listens for command that will provide channel history
 * This will give list of messages
 */
controller.hears('channel_info', ['direct_mention'], (bot, message) => {
  bot.api.channels.history({ channel: message.channel }, (err, res) => {
    if (err) return err
    const messageCount = res.messages.length
    let channelFreq = {}
    res.messages.forEach(resMessage => {
      if (!channelFreq[resMessage.user]) {
        channelFreq[resMessage.user] = { messageCount, history: [] }
        console.log(resMessage.ts)
        channelFreq[resMessage.user].history.push({ ts: resMessage.ts, text: resMessage.text })
      }
    })
    console.log(channelFreq)
  })
})

// ---------------------- listening ----------------------- //

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

// ---------------------- add users ----------------------- //

/*
 * Adds all users into the database
 */
controller.hears('add_all_users', ['direct_message'], (bot, message) => {
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
 * Grabs all users from DALI-API
 */
controller.hears('get_dali_users', ['direct_message'], (bot, message) => {
  getDALIUsers()
  .then(res => { return res.json() })
  .then(json => {
    bot.reply(message, 'Grabbed all users from DALI-API')
  })
})

/*
 * Adds a specified user
 */
controller.hears('add_user', ['direct_message'], (bot, message) => {
  const newUser = message.text.split(/[ <>@]/).filter(item => item.length > 0)[1]
  bot.api.users.info({ user: newUser }, (err, res) => {
    createUser(res.user)
    console.log('success')
  })
})

// ---------------------- debugging ----------------------- //

controller.hears(['show'], ['direct_message'], (bot, message) => {
  console.log(channelMessages)
})
