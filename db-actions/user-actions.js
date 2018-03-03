import mongoose from 'mongoose'
import User from './../models/user'

export function createUser(data) {
  let newUser = new User(data)
  newUser.save((err, res) => {
    if (err) return err
  })
}
