import request from 'supertest'
import { app } from '../src'
import { prismaMock } from './jest.setup'

describe('User API', () => {
  describe('POST /users', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app).post('/users').send({ email: '' })

      expect(response.status).toBe(400)
      expect(response.text).toEqual('Email et mot de passe sont requis.')
    })

    it('should create a new user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response.status).toBe(201)
      expect(response.text).toEqual('Utilisateur créé avec succès.')
    })

    it('should return 400 if email is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response.status).toBe(400)
      expect(response.text).toEqual('Cet email est déjà utilisé.')
    })

    it('should return 500 if there is a server error during user creation', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })

  describe('POST /users/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ email: '' })

      expect(response.status).toBe(400)
      expect(response.text).toEqual('Email et mot de passe sont requis.')
    })

    it('should return a token for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'truePassword' })

      expect(response.status).toBe(201)
      expect(response.body.token).toEqual('mockedToken')
    })

    it('should return 400 for incorrect password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' })

      expect(response.status).toBe(400)
      expect(response.text).toEqual('Mot de passe incorrect.')
    })

    it('should return 404 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })

      expect(response.status).toBe(404)
      expect(response.text).toEqual('Utilisateur non trouvé.')
    })

    it('should return 500 if there is a server error during login', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })

  describe('GET /users', () => {
    it('should return all users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, email: 'test@example.com', password: 'hashedPassword' },
      ])
      const response = await request(app).get('/users')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        { id: 1, email: 'test@example.com', password: 'hashedPassword' },
      ])
    })

    it('should return 204 if no users are found', async () => {
      prismaMock.user.findMany.mockResolvedValue([])
      const response = await request(app).get('/users')

      expect(response.status).toBe(204)
      expect(response.body).toEqual({})
    })

    it('should return 500 if there is a database error', async () => {
      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'))
      const response = await request(app).get('/users')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })
      const response = await request(app).get('/users/1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })
    })

    it('should return 404 if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      const response = await request(app).get('/users/1')

      expect(response.status).toBe(404)
      expect(response.body).toEqual("Pas d'utilisateur avec cet ID")
    })

    it('should return 500 if there is a database error', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'))
      const response = await request(app).get('/users/1')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })

  describe('PATCH /users/:id', () => {
    it('should return 200 if the user is successfully updated', async () => {
      const existingUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      }
      prismaMock.user.findUnique.mockResolvedValue(existingUser)

      const updatedUser = { email: 'new@example.com', password: 'newPassword' }
      prismaMock.user.update.mockResolvedValue({ id: 1, ...updatedUser })

      const response = await request(app).patch('/users/1').send(updatedUser)

      expect(response.status).toBe(200)
      expect(response.body).toEqual('Utilisateur modifié')
    })

    it('should return 404 if the user is not found', async () => {
      const updatedUser = { email: 'new@example.com', password: 'newPassword' }
      prismaMock.user.update.mockResolvedValue({ id: 1, ...updatedUser })

      const response = await request(app).patch('/users/1').send(updatedUser)

      expect(response.status).toBe(404)
      expect(response.body).toEqual("Pas d'utilisateur avec cet ID")
    })

    it('should return 400 if email is already used by another user', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }
      const anotherUserWithSameEmail = {
        id: 2,
        email: 'newemail@example.com',
        password: 'newpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser) // Trouver l'utilisateur actuel
      prismaMock.user.findUnique.mockResolvedValueOnce(anotherUserWithSameEmail) // Vérifier l'email existe déjà

      const response = await request(app)
        .patch('/users/1')
        .send({ email: 'newemail@example.com', password: 'newpassword' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual('Cet email est déjà utilisé.')
    })

    it('should return 400 if email is missing', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser)

      const response = await request(app)
        .patch('/users/1')
        .send({ password: 'newpassword' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual('Email et mot de passe sont requis.')
    })

    it('should return 400 if password is missing', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser)

      const response = await request(app)
        .patch('/users/1')
        .send({ email: 'newemail@example.com' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual('Email et mot de passe sont requis.')
    })

    it('should return 500 if there is a database error', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser)

      prismaMock.user.update.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .patch('/users/1')
        .send({ email: 'newemail@example.com', password: 'newpassword' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })

  describe('DELETE /users/:id', () => {
    it('should return 200 if user is deleted', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser)
      prismaMock.user.delete.mockResolvedValueOnce(existingUser)

      const response = await request(app).delete('/users/1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual('Utilisateur supprimé')
    })

    it('should return 404 if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)

      const response = await request(app).delete('/users/6')

      expect(response.status).toBe(404)
      expect(response.body).toEqual("Pas d'utilisateur avec cet ID")
    })

    it('should return 500 if database error occurs', async () => {
      const existingUser = {
        id: 1,
        email: 'currentemail@example.com',
        password: 'currentpassword',
      }

      prismaMock.user.findUnique.mockResolvedValueOnce(existingUser)

      prismaMock.user.delete.mockRejectedValue(new Error('Database error'))

      const response = await request(app).delete('/users/1')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'Database error' })
    })
  })
})
