import path from 'path'
import http from 'http'
import express from 'express'
import Filter from 'bad-words'
import { Server } from 'socket.io'
import { generateMessage, generateLocationMessage } from './utils/messages.js'
import { addUser, getUser, getUsersInRoom, removeUser } from './utils/users.js'
const app = express()

const server = http.createServer(app)
const io = new Server(server)

const __dirname = path.resolve()

const publicPath = path.join(__dirname, '/public')
const port = process.env.PORT || 3000

app.use(express.static(publicPath))

io.on('connection', (socket) => {
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage('Admin', `${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    })

    callback()
    // socket.emit. io.emit, socket.broadcast.emit
    // io.to.emit, socket.broadcast.to.emit
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }

    const user = getUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage(user.username, message))
      callback()
    }
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)

    if (user) {
      io.to(user.room).emit(
        'locationMessage',
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${coords.lat},${coords.long}`,
        ),
      )
      callback('Location sent')
    }
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left`),
      )
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
})

server.listen(port, () => {
  console.log(`server started at port ${port}`)
})
