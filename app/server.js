import botkit from 'botkit'
import * as db from './db'
import User from './../models/user'

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
// for now we won't use this but feel free to look up slack webhooks
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
 * Adds the user that called the command
 */
controller.hears('add_user', ['direct_message', 'direct_message'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    const newUser = new User({
      id: res.user.id,
      username: res.user.name,
      firstName: res.user.profile.first_name,
      lastName: res.user.profile.last_name,
    })
    newUser.save((err, response) => {
      if (err) return err
      bot.reply(message, `Added ${res.user.name} to the database`)
    })
  })
})
