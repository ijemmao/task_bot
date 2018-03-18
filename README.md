# DALI Task Bot 🐝
A slack bot focused on increasing lab activity by engaging in general activity in all slack channels.

## Setup 🚀

### Environment Keys
 
TASK_BOT_TOKEN - Slack API key used to authenticate the slack bot

TASK_BOT_AUTH - Google Sign in API key to authenticate self

### Start the Project
`git clone` the repository and then run the following commands:

```bash
cd task_bot
npm install
npm run dev
```

You should see the following message telling you have started the project successfully:

```bash
Task Bot is up and running!
```

## Commands 💪🏾
There are a list of commands that the task bot will recognize by **direct messages** - you must be in DM channel for the bot to respond

### **Update Channels List**

`update_channels` - POST

Starts the conversation that will allow a selected user to update the channels that should be tracked.

### **Channel Activity**

`poke_channels_activity` - POST

Pokes all the channels with low channel activity in the past week. The message is sent out every Saturday at 10AM.


**Note**: There are two sources that this bot is interacting with:
* Local Slack Database - Included in this repo, there is a local database that holds Slack related user information
* DALI API - A private API created by [@johnlev](https://github.com/johnlev) that stores updated DALI member information

## Authors 📝
* Ijemma Onwuzulike '19
* Sofia Stanescu-Bellu '20
