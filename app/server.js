import botkit from 'botkit'

console.log('starting bot')

let channelMessages = {}

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


// listens for any comment made by user
// messages stored in dictionary that holds:
//    1. user id
//    2. message timestamp
controller.on('direct_message', (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (err) return err
    if (!channelMessages[res.user.id]) {
      channelMessages[res.user.id] = { messageTimes: [] }
    }
    if (res) {
      channelMessages[res.user.id].messageTimes.push(message.ts)
    }
    bot.reply('Logged your message')
  })
})
