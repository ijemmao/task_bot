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

### **Add Users**

`add_user <@slack_id>` - POST

Adds the specified slack user into the local database

##### Example

`add_user @ijemmao`

Adds the slack user `@ijemmao` to the local database

`add_all_users` - POST

Adds all users in the slack team

### **Get Users**

`get_all_users` - GET

Gets all the users in the local Slack database

`get_dali_users` - GET

Gets all the users from the DALI API

### **Channel Activity**

`poke_channels_activity` - POST

Pokes all the channels with low channel activity in the past week. The message is sent out every Saturday at 10AM.


**Note**: There are two sources that this bot is interacting with:
* Local Slack Database - Included in this repo, there is a local database that holds Slack related user information
* DALI API - A private API created by [@johnlev](https://github.com/johnlev) that stores updated DALI member information

## Authors 📝
* Ijemma Onwuzulike '19
* Sofia Stanescu-Bellu '20
