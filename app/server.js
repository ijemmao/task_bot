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

const productivityScore = (channelInfo) => {
  const dayInSeconds = 86400
  const numMessages = channelInfo.length
  let responseScore = 0
  if (numMessages > 8) {
    channelInfo.forEach((message, index) => {
      if (index > 0) {
        const messageTimeDifference = channelInfo[index] - channelInfo[index - 1]
        if (messageTimeDifference <= dayInSeconds) {
          responseScore += 3
        } else {
          responseScore -= 1
        }
      }
    })
  } else {
    responseScore = -100000
  }
  return numMessages + responseScore
}

/*
 * Sorts channels based on assigned productivity score
 * Transforms original channels list to hold associated score
 */
const sortProductiveChannels = (channels) => {
  const scoredChannels = channels.map(channel => {
    return { channel, score: productivityScore(channel) }
  })
  scoredChannels.sort((a, b) => {
    return productivityScore(b) - productivityScore(a)
  })
  return scoredChannels
}

/*
 * Based on given threshold, returns a list of channels
 * that need a poke to drive up productivity
 */
const pokeChannels = (channels, threshold) => {
  const scoredChannels = sortProductiveChannels(channels)
  const firstChannel = scoredChannels[0]
  const pokeChannels = scoredChannels.filter(channel => channel.score < (firstChannel.score * threshold).toFixed(2))
  return pokeChannels
}

/*
 * Listens for command that will provide channel activity in the past week
 * With provided data, this function will decide whether or not this channel
 * is active
 */
controller.hears('channels_activity', ['direct_message'], (bot, message) => {

  // Unix timestamp of last week
  const lastWeekUnix = moment().subtract(1, 'weeks').endOf('isoWeek').unix()

  bot.api.channels.list({}, (err, res) => {
    if (err) return err
    const memberChannels = res.channels.filter(item => item.is_member)

    let channelMessages = {}

    const tasks = memberChannels.map(channel => {
      return new Promise((resolve, reject) => {
        bot.api.channels.history({ channel: channel.id, oldest: lastWeekUnix }, (err1, res1) => {
          if (err1) reject(err1)
          resolve(res1.messages)
        })
      })
      .catch(e => {
        console.log(e)
      })
    })

    Promise.all(tasks).then(values => {
      channelMessages = values
      console.log(pokeChannels(values, 0.5))
    })
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
