import { Router } from 'express'
import {
  createUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from './user.controller'

export const userRouter = Router()

userRouter.post('/users', createUser)
userRouter.post('/users/login', loginUser)
userRouter.get('/users', getUsers)
userRouter.get('/users/:id', getUser)
userRouter.patch('/users/:id', updateUser)
userRouter.delete('/users/:id', deleteUser)
