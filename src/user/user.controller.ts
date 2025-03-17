import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../client'
import { User } from '@prisma/client'
export const createUser = async (
  req: Request<{}, {}, Pick<User, 'email' | 'password'>>,
  res: Response,
) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      res.status(400).send('Email et mot de passe sont requis.')
      return
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(400).send('Cet email est déjà utilisé.')
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    res.status(201).send('Utilisateur créé avec succès.')
  } catch (error: any) {
    res.status(500).send({ error: error.message })
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).send('Email et mot de passe sont requis.')
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).send('Utilisateur non trouvé.')
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      res.status(400).send('Mot de passe incorrect.')
      return
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: email,
      },
      process.env.JWT_SECRET as jwt.Secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      } as jwt.SignOptions,
    )

    res.status(201).send({ token })
  } catch (error: any) {
    res.status(500).send({ error: error.message })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany()
    if (users.length === 0) {
      res.status(204).send('pas de users trouvés')
    } else {
      res.status(200).json(users)
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.userId) },
    })
    if (!user) {
      res.status(404).json("Pas d'utilisateur avec cet ID")
    } else {
      res.status(200).json(user)
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.userId) },
    })
    const existingEmail = await prisma.user.findUnique({
      where: { email: req.body.email },
    })
    if (!user) {
      res.status(404).json("Pas d'utilisateur avec cet ID")
    } else if (existingEmail && existingEmail.id !== user.id) {
      res.status(400).json('Cet email est déjà utilisé.')
    } else if (!req.body.email || !req.body.password) {
      res.status(400).json('Email et mot de passe sont requis.')
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      await prisma.user.update({
        where: { id: Number(req.params.userId) },
        data: {
          email: req.body.email,
          password: hashedPassword,
        },
      })
      res.status(200).json('Utilisateur modifié')
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.userId) },
    })
    if (!user) {
      res.status(404).json("Pas d'utilisateur avec cet ID")
    } else {
      await prisma.user.delete({ where: { id: Number(req.params.userId) } })
      res.status(200).json('Utilisateur supprimé')
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
