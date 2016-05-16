# Make your own Slack Bot integration

We'll be building a Slack bot that will send new users a welcome message. It will be a simple Node.js + Express.js app and run on [Heroku](https://www.heroku.com/). We'll be using the command line extensively!

1. ### Setup
  1. #### Slack
     1. we'll add a bot to our Slack team
     1. start by going to your Slack desktop app (you should install this!) and to the Slack team you want to add the bot to
     1. click on the team name in the top-left and then click "Apps & Integrations"
     1. search for "bot" and click the top result, "Bots"
     1. click "Add Configuration" to set up the bot
     1. take note of the "API Token" at the end of the setup
  1. #### Github
    1. make a repo on [Github](http://github.com/)
  1. #### Heroku
    1. head over to [Heroku](https://www.heroku.com/) and make an account
    1. once you're at the dashboard, make a new app
    1. in the "Deploy" tab you can set the deployment method to **Github** and connect to the repo you made
    1. head over to "Settings" and add a Config Variable `SLACK_BOT_TOKEN` with value equal to the API token of the bot (step 1)
  1. #### Node.js and Node Package Manager (npm)
    1. go ahead and follow this [guide](http://shapeshed.com/setting-up-nodejs-and-npm-on-mac-osx/)  to set up Node.js and npm on Mac OSX
    1. setup your `package.json` file, which specifies many settings for your Node app– it might look something like this
    ```
    {
      "name": "CentrifugalHooksBot",
      "version": "0.0.0",
      "description": "CentrifugalHooks Slack bot",
      "main": "web.js",
      "scripts": {
      },
      "repository": {
        "type": "git",
        "url": "git@heroku.com:centrifugal-hooks-bot.git "
      },
      "author": "Pat Xu",
      "license": "ISC",
      "dependencies": {
      }
    }
    ```
    1. the guide will have you set install express, go ahead and do that!
      - tip: when you install via `npm`, use the `--save` flag to automatically add the module to your `package.json` dependencies
    1.
