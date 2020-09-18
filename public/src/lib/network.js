class Net {
  static async Request(url) {
    return fetch(location.origin + '/' + url)
      .then((data) => {
        return data.text()
      })
      .catch((err) => console.error(err))
  }
  static async RequestBinary(url) {
    return fetch(location.origin + '/' + url)
      .then((data) => {
        return data.arrayBuffer()
      })
      .catch((err) => console.error(err))
  }
  static async Send(url, data) {
    return fetch(location.origin + '/' + url, {
      method: 'POST',
      body: data,
    })
      .then((data) => {
        return data.text()
      })
      .catch((err) => console.error(err))
  }
  static async Socket(url) {
    url = location.host + '/' + url
    return new Promise(function (resolve, reject) {
      let socket
      if (location.protocol === 'https:') {
        socket = new WebSocket('wss://' + url)
      } else {
        socket = new WebSocket('ws://' + url)
      }
      socket.onopen = function () {
        resolve(socket)
      }
      socket.onerror = function (err) {
        reject(err)
      }
    })
  }
}
