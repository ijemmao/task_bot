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
var milestone = '_It\'s milestone time!_\n\n' + ('*' + Object.keys(data.milestones.one)[0] + ':* ') + data.milestones.one.Overview + '\n';

milestone += ('\n*' + Object.keys(data.milestones.one)[1].toUpperCase() + '*:' + '\n');
for (var item in data.milestones.one.Everyone) {
  milestone += ('\t• ' + data.milestones.one.Everyone[item] + '\n');
}

milestone += ('\n*' + Object.keys(data.milestones.one)[2].toUpperCase() + '*:' + '\n');
for (item in data.milestones.one.PM) {
  milestone += ('\t• ' + data.milestones.one.PM[item] + '\n');
}

milestone += ('\n*' + Object.keys(data.milestones.one)[3].toUpperCase() + '*:' + '\n');
for (item in data.milestones.one.Deliverables) {
  milestone += ('\t• ' +data.milestones.one.Deliverables[item] + '\n');
}

milestone += ('\n*' + data.milestones.one.More + "*");

// schedule milestone message for Wednesday after the Lab meeting
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 3;
rule.hour = 20;
rule.minute = 15;
rule.second = 0;

// post milestones message in each channel in channels list 
var milestones = schedule.scheduleJob(rule, function(){
  for (var i = 0; i < channels.length; i++) {
    slackbot.say( {
      text: milestone,
      channel: channels[i]
    });
  }
});