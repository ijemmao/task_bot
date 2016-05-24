# Make your own Slack Bot integration

We'll be building a Slack bot that will send new users a welcome message. It will be a simple [Node.js](https://nodejs.org/en/) + [Express.js](http://expressjs.com/) app and run on [Heroku](https://www.heroku.com/). Don't worry if you haven't used these technologies before– all will be explained.

### Slack Bot Basics
Bot users are similar to human users in that they have names, profile pictures, exist as part of the team, can post messages, invited to channels, and more. The main difference is that bots are controlled programmatically via a a user token that accesses one of Slack's APIs. We'll be building a custom bot that welcomes new users that join the team.

### Setup
Some of the technologies we'll be using are Slack, Github, Heroku, and Node.js. You're already familiar with Slack and Github, but Heroku and Node might be new. Node is runtime environment used for developing server-side web applications and Heroku is a [Platform-as-a-Servce](https://en.wikipedia.org/wiki/Platform_as_a_service) which will run our node application.
  - #### Slack
    1. from the Slack desktop app, click on the team name in the top-left and then go to "Apps & Integrations"
    1. search for "bot" and click the top result, "Bots"
    1. click "Add Configuration" and fill in the details for the bot
    1. take note of the API Token, we'll us it later
  - #### Github
    1. make a repo on [Github](http://github.com/)
  - #### Heroku
    1. head over to [Heroku](https://www.heroku.com/) and login/sign up
    1. make a new app and name it something reasonable
    1. in the "Deploy" tab you can set the deployment method to **Github** and connect to the repo you made
    1. head over to "Settings" and add a Config Variable `SLACK_BOT_TOKEN` with value equal to the API token of the Slack bot
  - #### Node.js and Node Package Manager (npm)
    1. go ahead and follow this [guide](http://shapeshed.com/setting-up-nodejs-and-npm-on-mac-osx/)  to set up Node.js and npm (for OSX)
    1. setup your `package.json` file, which specifies settings for your Node app– it should look close to this
    ```
    {
      "name": "WelcomeBot",
      "version": "0.0.0",
      "description": "Team Slack welcome bot",
      "main": "web.js",
      "scripts": {},
      "repository": {
        "type": "git",
        "url": "git@heroku.com:welcome-bot.git "
      },
      "author": "Your Name",
      "license": "ISC",
      "dependencies": {
      }
    }
    ```
    1. the `url` is based on your Heroku app name and can be found under "Settings"
    1. note that there are no dependencies yet– the guide will have you set install express, go ahead and do that
      - tip: when you use `npm`, include the `--save` flag to automatically add the package to dependencies in `package.json`

### Using the Node Slack SDK
Our bot will connect to Slack's [Real Time Messaging API](https://api.slack.com/rtm) and open a WebSocket connection with Slack. The [Node Slack SDK](https://github.com/slackhq/node-slack-sdk) provides us with a convenient wrapper around Slack's RTM API.
- install the package with `npm install @slack/client --save`



You can read the official documentation on Slack users [here](https://api.slack.com/bot-users).
