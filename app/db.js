import mongoose from 'mongoose'

const database = 'mongodb://127.0.0.1/task_bot'
mongoose.connect(database, (err, res) => {
  if (err) {
    console.log('There was an error connecting the database')
  }
})
module.exports = mongoose.connection
