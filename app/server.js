import botkit from 'botkit'
import schedule from 'node-schedule'
import moment from 'moment'
import * as db from './db'
import { formatLists } from './data-actions/markdown'
import { createUser, getDALIUsers } from './db-actions/user-actions'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import { checkOnTerm, getTermStartDate, daysBeforeStart, getConfirmDatesMessage, generateTermDates, updateStartDate, updateEndDate, getUpdatedDates } from './data-actions/term-dates'
import { getMilestone } from './data-actions/milestones'

let currentWeek = 0
let currentTerm = null
let onTerm = false
let confirmedDate = false
let updatingDates = getConfirmDatesMessage

// botkit controller
const controller = botkit.slackbot({
  debug: false,
})

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.TASK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
})

const slackbotRTM = slackbot.startRTM((err, bot) => {
  // start the real time message client
  if (err) throw new Error(err)
})

console.log('Task Bot is up and running!')

// prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbotRTM, () => {
    if (err) {
      throw new Error(err)
    }
  })
})

// ------------------ send informational blurbs ----------------- //
/*
 * Listens for command that will provide channel activity in the past week
 * With provided data, this function will decide whether or not this channel
 * is active
 */
controller.on('poke_channels_activity', (bot) => {

  // Unix timestamp of last week
  const lastWeekUnix = moment().subtract(1, 'weeks').endOf('isoWeek').unix()
  

  bot.api.channels.list({}, (err, res) => {
    if (err) return err
    console.log(res)
    const memberChannels = res.channels.filter(item => item.is_member)

    let channelMessages = {}

    const tasks = memberChannels.map(channel => {
      return new Promise((resolve, reject) => {
        bot.api.channels.history({ channel: channel.id, oldest: lastWeekUnix }, (err1, res1) => {
          if (err1) reject(err1)
          resolve({ id: channel.id, messages: res1.messages })
        })
      })
      .catch(e => {
        console.log(e)
      })
    })

    Promise.all(tasks).then(values => {
      channelMessages = values
      const channelsToPoke = getPokeChannels(values, 0.3)
      pokeChannels(bot, channelsToPoke)
    })
  })
})

/*
 * Listens for command that will send out milestone to each channel
 * that is being tracked by the task bot
 */
controller.on('send_milestones', (bot, week) => {
  bot.api.channels.list({}, (err, res) => {
    if (err) return err
    const memberChannels = res.channels.filter(item => item.is_member)

    memberChannels.forEach(channel => {
      const currentMilestone = getMilestone(week)
      bot.api.postMessage({ channel: channel.id, text: currentMilestone }, (err, res) => {})
    })
  })
})

// ----------------- send confirmation updates ---------------- //

/*
 * Starts conversation with admin user to update the start dates
 */
controller.on('send_term_start_confirmation', (bot) => {
  bot.api.users.list({}, (err, res) => {
    let adminUser = null
    res.members.forEach(user => {
      if (user.real_name === 'Ijemma Onwuzulike') {
        adminUser = user
      }
    })
    bot.api.im.open({ user: adminUser.id }, (err1, res1) => {
      const directChannelId = res1.channel.id
      updatingDates = true
      getConfirmDatesMessage()
      .then(message => {
        bot.say({ channel: directChannelId, text: message }, () => { })
      })
    })
  })
})

// --------------- confirming start dates ----------------- //

controller.hears('update_start', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    updateStartDate(moment(message.text.split(' ')[1], 'MM-DD-YYYY'))
    bot.reply(message, `Updated start date: ${getUpdatedDates()[0]}`)
  }
})

controller.hears('update_end', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    updateEndDate(moment(message.text.split(' ')[1], 'MM-DD-YYYY'))
    bot.reply(message, `Updated end date: ${getUpdatedDates()[1]}`)
  }
})

controller.hears('show', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    getTermStartDate('spring').then(date => {
      const updatedStart = getUpdatedDates()[0]
      const updatedEnd = getUpdatedDates()[1]
      const currentDates = [
        `Current start date: ${updatedStart}`,
        `Current end date: ${updatedEnd}`,
      ]
      bot.reply(message, formatLists(currentDates))
    })
  }
})

controller.hears('abort', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    bot.reply(message, 'Alright, I will check back in with you tomorrow at 10AM')
    const tomorrowAtTen = moment().add(1, 'days').hour(10).toDate()
    const confirmDatesTomorrow = schedule.scheduleJob(tomorrowAtTen, () => {
      controller.trigger('send_term_start_confirmation', [slackbotRTM])
    })
  }
})

controller.hears('complete', ['direct_message'], (bot, message) => {
  if (updatingDates) {
    bot.reply(message, 'Sweet! Thanks for updating the dates!\n\nUse update_term_dates to update the upcoming term start and end')
  }
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

// ------------------- automated tasks ------------------- //

// Slacks out channel productivity every Saturday at 10AM
const channelActivityReminder = schedule.scheduleJob({ hour: 10, minute: 0, second: 0, dayOfWeek: 6 }, () => {
  console.log('Reminding all channels that there are milestones to complete')
  console.log('Poking channels that need better activity')
  if (onTerm) controller.trigger('poke_channels_activity', [slackbotRTM])
})

// Slacks out channels current milestones every Tuesday at 10AM
const milestoneReminder = schedule.scheduleJob({ hour: 10, minute: 0, second: 0, dayOfWeek: 2 }, () => {
  console.log('Sending out milestone reminder')
  console.log('Sending milestones if currently on a term')
  if (onTerm) {
    getTermStartDate(currentTerm)
    .then(currentTerm => {
      currentWeek = moment().diff(currentTerm, 'weeks')
      if (onTerm) controller.trigger('send_milestones', [slackbotRTM, currentWeek])
    }) 
  }
  // // reset the week counter
  // if (currentWeek === 10) currentWeek = 0
})

// Checks daily at 12AM to see if term start/end dates are correct
const updateTermInfo = schedule.scheduleJob({ hour: 0, minute: 0, second: 0 }, () => {
  console.log('Updating the expected term bounds are correct')

  // We are not in a term and we haven't confirmed correct term start/end dates
  /*
   * TODO: Check with admin to make sure that currently assigned
   * start/end dates are correct
   */
  const termResults = checkOnTerm()
  currentTerm = termResults.term
  onTerm = termResults.onTerm
})

controller.hears('meme', ['direct_message'], (bot, message) => {
  getTermStartDate('spring')
  .then(startDate => {
    console.log('Current start date: ', startDate)
  })
})

console.log('Sending confirmation message to user')
controller.trigger('send_term_start_confirmation', [slackbotRTM])

// Checks daily at 10AM to see whether the bot should update the start dates for the term
const updateTermStart = schedule.scheduleJob({ hour: 10, minute: 0, second: 0 }, () => {
  console.log('Updating the term start date')

  if (!confirmedDate) {
    const generatedTerms = generateTermDates()
    const termStartDates = []
    for (const term in generatedTerms) {
      termStartDates.push(generatedTerms[term].ranges[0])
    }
    if (daysBeforeStart(termStartDates) < 4) {
      // Start the conversation to confirm start dates
    } else {
      console.log(daysBeforeStart(termStartDates))
    }
  }
})
