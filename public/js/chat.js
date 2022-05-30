const socket = io()

const $form = document.querySelector('#message-form')
const $formInput = $form.querySelector('#message')
const $formButton = $form.querySelector('button')
const $locationBtn = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector(
  '#location-message-template',
).innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
})

const autoscroll = () => {
  // New message element
  const $newMsg = $messages.lastElementChild
  // console.log($newMsg)

  // Height of the new message
  const newMsgStyles = getComputedStyle($newMsg)
  const newMsgMargin = parseInt(newMsgStyles.marginBottom)
  const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

  // Visible Height
  const visibleHeight = $messages.offsetHeight

  // Height of message container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMsgHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  // console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username === 'Admin' ? null : message.username,
    message: message.text,
    float:
      message.username === username.toLowerCase() ? 'message__float-right' : '',
    groupInfo: message.username === 'Admin' ? 'message__group-info' : '',
    createdAt:
      message.username === 'Admin'
        ? null
        : moment(message.createdAt).format('H:mm'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('H:mm'),
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })
  document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', (e) => {
  e.preventDefault()
  $formButton.setAttribute('disabled', 'disabled')
  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    $formButton.removeAttribute('disabled')
    $formInput.value = ''
    $formInput.focus()
    if (error) {
      return console.error(error)
    }
    console.log('Delivered!')
  })
})

$locationBtn.addEventListener('click', () => {
  $locationBtn.setAttribute('disabled', 'disabled')

  if (!navigator.geolocation) {
    return alert('Your Browser does not support GeoLocation!')
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      (feedback) => {
        $locationBtn.removeAttribute('disabled')
        console.log(feedback)
      },
    )
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
// https://files.mead.io/o0uy1e8k
