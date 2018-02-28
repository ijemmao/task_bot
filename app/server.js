import botkit from 'botkit'
import schedule from 'node-schedule';

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false, 
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) {
    throw new Error(err);
  }
});

// prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) {
      throw new Error(err);
    }
  });
});

/************************* milestones *************************/

var channels = ['C9G17060H', 'C9G073P2N'];  // dummy channel list

// schedule milestone message for Wednesday after the Lab meeting
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 3;
rule.hour = 18;
rule.minute = 23;
rule.second = 10;
 
var milestones = schedule.scheduleJob(rule, function(){
  for (var i = 0; i < channels.length; i++) {
    slackbot.say( {
      text: 'It\'s milestone time!',
      channel: channels[i]
    });
  }
});