const InputKeyboard = {}
const InputMouse = [false, false]
const InputPos = [0, 0]
const InputMovement = [0, 0]

class Input {
  static KeyDown(key) {
    return InputKeyboard[key]
  }
  static KeyPress(key) {
    let val = InputKeyboard[key]
    InputKeyboard[key] = false
    return val
  }
  static Off(key) {
    InputKeyboard[key] = false
  }
  static IsClick(id) {
    return InputMouse[id]
  }
  static MovementY() {
    return InputMovement[1]
  }
  static Moved() {
    InputMovement[0] = 0
    InputMovement[1] = 0
  }
  static Clicked(id) {
    InputMouse[id] = false
  }
  static SetKeyUp(event) {
    InputKeyboard[event.key] = false
  }
  static SetKeyDown(event) {
    InputKeyboard[event.key] = true
  }
  static SetMouseUp(event) {
    if (event.button === 0) {
      InputMouse[0] = false
    } else if (event.button === 2) {
      InputMouse[1] = false
    }
  }
  static SetMouseDown(event) {
    if (event.button === 0) {
      InputMouse[0] = true
    } else if (event.button === 2) {
      InputMouse[1] = true
    }
  }
  static SetMouseMove(event) {
    InputPos[0] = event.clientX
    InputPos[1] = event.clientY
  }
}
