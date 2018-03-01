import botkit from 'botkit';
import schedule from 'node-schedule';
import data from '../mock_data/milestones';
import * as markdown from "./markdown.js";

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
var milestone = '_It\'s milestone time!_\n\n' // create milestone message.
              + markdown.formatHeader(Object.keys(data.milestones.one)[0]) 
              + data.milestones.one.Overview + '\n'
              + markdown.formatHeader(Object.keys(data.milestones.one)[1]) 
              + '\n' + markdown.formatLists(data.milestones.one.Everyone) 
              + markdown.formatHeader(Object.keys(data.milestones.one)[2])
              + markdown.formatLists(data.milestones.one.PM)
              + markdown.formatHeader(Object.keys(data.milestones.one)[3])
              + markdown.formatLists(data.milestones.one.Deliverables)
              + ('\n*' + data.milestones.one.More + "*");

// schedule milestone message for Wednesday after the Lab meeting
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 3;
rule.hour = 21;
rule.minute = 46;
rule.second = 30;

// post milestones message in each channel in channels list 
var milestones = schedule.scheduleJob(rule, function(){
  for (var i = 0; i < channels.length; i++) {
    slackbot.say( {
      text: milestone,
      channel: channels[i]
    });
  }
});