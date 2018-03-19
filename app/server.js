import botkit from 'botkit'
import schedule from 'node-schedule'
import moment from 'moment'
import * as db from './db'
import { formatLists } from './data-actions/markdown'
import { createUser, getDALIUsers } from './db-actions/user-actions'
import { pokeChannels, getPokeChannels } from './data-actions/channel-productivity'
import {
  checkOnTerm,
  daysBeforeStart,
  getConfirmDatesMessage,
  termDates,
  updateStartDate,
  updateEndDate,
  getUpdatedDates,
} from './data-actions/term-dates'
import { updateTerm, getTerm } from './db-actions/term-actions'
import { getMilestone } from './data-actions/milestones'

let currentWeek = 0
let currentTerm = null
let onTerm = false
let confirmedDates = false
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
      // getConfirmDatesMessage(currentTerm)
      getConfirmDatesMessage('spring')
        .then(message => {
          bot.say({ channel: directChannelId, text: message }, () => { })
        })
    })
  })
})

// --------------- confirming start dates ----------------- //

controller.hears(/(update_start)\b/, ['direct_message'], (bot, message) => {
  if (updatingDates) {
    const parsedDate = moment(message.text.split(' ')[1], 'MM-DD-YYYY')
    if (!parsedDate.isValid()) {
      bot.reply(message, 'Entered an invalid date')
    } else {
      updateStartDate(parsedDate)
      const updatedStartDate = getUpdatedDates()[0].format('dddd, MMMM Do YYYY')
      bot.reply(message, `Updated start date: ${updatedStartDate}`)
    }
  }
})

controller.hears(/(update_end)\b/, ['direct_message'], (bot, message) => {
  if (updatingDates) {
    const parsedDate = moment(message.text.split(' ')[1], 'MM-DD-YYYY')
    if (!parsedDate.isValid()) {
      bot.reply(message, 'Entered an invalid date')
    } else {
      updateEndDate(parsedDate)
      const updatedEndDate = getUpdatedDates()[1].format('dddd, MMMM Do YYYY')
      bot.reply(message, `Updated end date: ${updatedEndDate}`)
    }
  }
})

controller.hears(/(show)\b/, ['direct_message'], (bot, message) => {
  if (updatingDates) {
    const updatedStart = getUpdatedDates()[0]
    const updatedEnd = getUpdatedDates()[1]
    const currentDates = [
      `Current start date: ${updatedStart.format('dddd, MMMM Do YYYY')}`,
      `Current end date: ${updatedEnd.format('dddd, MMMM Do YYYY')}`,
    ]
    bot.reply(message, formatLists(currentDates))
  }
})

controller.hears(/(abort)\b/, ['direct_message'], (bot, message) => {
  if (updatingDates) {
    updatingDates = false
    bot.reply(message, 'Alright, I will check back in with you tomorrow at 10AM')
    const tomorrowAtTen = moment().add(1, 'days').hour(10).toDate()
    const confirmDatesTomorrow = schedule.scheduleJob(tomorrowAtTen, () => {
      controller.trigger('send_term_start_confirmation', [bot])
    })
  }
})

controller.hears(/(complete)\b/, ['direct_message'], (bot, message) => {
  if (updatingDates) {
    updatingDates = false
    confirmedDates = true
    console.log(getUpdatedDates()[0], getUpdatedDates()[1])
    updateTerm({ name: currentTerm, startDate: getUpdatedDates()[0].toDate(), endDate: getUpdatedDates()[1].toDate() })
    .then(res => {
      bot.reply(message, 'Sweet! Thanks for updating the dates!\n\nUse *update_term_dates* to update the upcoming term start and end')
    })
  }
})

controller.hears(/(update_term_dates)\b/, ['direct_message'], (bot, message) => {
  if (!updatingDates) {
    controller.trigger('send_term_start_confirmation', [bot])
  }
})

// ---------------------- add users ----------------------- //

/*
 * Adds all users into the database
 */
controller.hears(/(add_all_users)\b/, ['direct_message'], (bot, message) => {
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
controller.hears(/(get_dali_users)\b/, ['direct_message'], (bot, message) => {
  getDALIUsers()
  .then(res => { return res.json() })
  .then(json => {
    bot.reply(message, 'Grabbed all users from DALI-API')
  })
})

/*
 * Adds a specified user
 */
controller.hears(/(add_user)\b/, ['direct_message'], (bot, message) => {
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
    getTerm(currentTerm)
    .then(currentTerm => {
      currentWeek = moment().diff(currentTerm.startDate, 'weeks')
      if (onTerm) controller.trigger('send_milestones', [slackbotRTM, currentWeek])
    })
  }
})

// Checks daily at 12AM to see if term start/end dates are correct
const updateTermInfo = schedule.scheduleJob({ hour: 0, minute: 0, second: 0 }, () => {
  console.log('Updating the expected term bounds are correct')

  // We are not in a term and we haven't confirmed correct term start/end dates
  const termResults = checkOnTerm()
  currentTerm = termResults.term
  onTerm = termResults.onTerm
})

console.log('Sending confirmation message to user')
controller.trigger('send_term_start_confirmation', [slackbotRTM])

// Checks daily at 10AM to see whether the bot should update the start dates for the term
const updateTermStart = schedule.scheduleJob({ hour: 10, minute: 0, second: 0 }, () => {
  console.log('Updating the term start date')

  if (!confirmedDates) {
    // Checks to see if it is less than four days before the next term
    const pulledTerms = termDates()
    const daysBefore = daysBeforeStart(pulledTerms).daysBefore
    currentTerm = daysBeforeStart(pulledTerms).upcomingTerm
    if (daysBefore < 4) {
      updatingDates = true
      confirmedDates = false
      // Start the conversation to confirm start dates
    } else {
      console.log(`Days before the upcoming term start: ${daysBefore}`)
    }
  }
})
