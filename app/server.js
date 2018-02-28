import botkit from 'botkit'
import schedule from 'node-schedule';

var j = schedule.scheduleJob('42 * * * *', function(){
  console.log('The answer to life, the universe, and everything!');
});

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false, 

});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.TASK_BOT_TOKEN,
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

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 3;
rule.hour = 17;
rule.minute = 0;
 
var milestones = schedule.scheduleJob(rule, function(){
  slackbot.say( {
      text: 'It\'s milestone time!',
      channel: 'C9G073P2N'
    }
  );
});

// example hello response
controller.hears(['date'], ['direct_message'], (bot, message) => {
  bot.reply(message, "The date today is " + day + " " + time);
});
