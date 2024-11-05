import { Schema, model } from "npm:mongoose"

export const UserSchema = new Schema({
  fullName: {
    type: String,
    required: [true, "Name is required"]
  },
  userName: {
    type: String,
    required: [true, "User name is required"],
    unique: [true, "Username can not be duplicated"],
    minLength: [4, "Username must be longer than 4 characters"]
  },
  email: {
    type: String,
    required: [true, "Email must be provided"],
    unique: [true, "This email is already been taken"],
  },
  avatarURL: {
    type: String,
  },
  pid: {
    type: String
  }
})

export const UserModel = model("User", UserSchema, "users")
