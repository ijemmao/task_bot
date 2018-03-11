# DALI Task Bot 🐝
A slack bot focused on increasing lab activity by engaging in general activity in all slack channels.

## Setup 🚀

### Environment Key
 
TASK_BOT_TOKEN - Slack API key used to authenticate the slack bot

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
There are a list of commands that the task bot will recognize by **direct mentions** - you must insert `@task_bot` before calling any command

### Add Users

`add_user <@slack_id>` - POST

Adds the specified slack user into the local database

##### Example

`@task_bot add_user @ijemmao`

Adds the slack user `@ijemmao` to the local database

`add_all_users` - POST

Adds all users in the slack team

## Authors 📝
* Ijemma Onwuzulike '19
* Sofia Stanescu-Bellu '20
