import botkit from 'botkit'
import schedule from 'node-schedule';
import data from '../mock_data/milestones'

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
var milestone = 'It\'s milestone time!\n' + data.milestones.one.overview + '\n';

for (var item in data.milestones.one.everyone) {
  milestone += (data.milestones.one.everyone[item] + '\n');
}

for (item in data.milestones.one.pm) {
  milestone += (data.milestones.one.pm[item] + '\n');
}

for (item in data.milestones.one.deliverables) {
  milestone += (data.milestones.one.deliverables[item] + '\n');
}

// schedule milestone message for Wednesday after the Lab meeting
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 3;
rule.hour = 19;
rule.minute = 40;
rule.second = 59;

// post milestones message in each channel in channels list 
var milestones = schedule.scheduleJob(rule, function(){
  for (var i = 0; i < channels.length; i++) {
    slackbot.say( {
      text: milestone,
      channel: channels[i]
    });
  }
});