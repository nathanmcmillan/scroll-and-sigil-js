import {normalize, cross} from '/src/math/vector.js'

const temp = new Float32Array(16)
const copy = new Float32Array(16)
const dest = new Float32Array(16)

export function identity(matrix) {
  matrix[0] = 1.0
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = 1.0
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = 0.0
  matrix[9] = 0.0
  matrix[10] = 1.0
  matrix[11] = 0.0

  matrix[12] = 0.0
  matrix[13] = 0.0
  matrix[14] = 0.0
  matrix[15] = 1.0
}

export function orthographic(matrix, left, right, bottom, top, near, far) {
  matrix[0] = 2.0 / (right - left)
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = 2.0 / (top - bottom)
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = 0.0
  matrix[9] = 0.0
  matrix[10] = -2.0 / (far - near)
  matrix[11] = 0.0

  matrix[12] = -(right + left) / (right - left)
  matrix[13] = -(top + bottom) / (top - bottom)
  matrix[14] = -(far + near) / (far - near)
  matrix[15] = 1.0
}

function frustum(matrix, left, right, bottom, top, near, far) {
  matrix[0] = (2.0 * near) / (right - left)
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = (2.0 * near) / (top - bottom)
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = (right + left) / (right - left)
  matrix[9] = (top + bottom) / (top - bottom)
  matrix[10] = -(far + near) / (far - near)
  matrix[11] = -1.0

  matrix[12] = 0.0
  matrix[13] = 0.0
  matrix[14] = -(2.0 * far * near) / (far - near)
  matrix[15] = 0.0
}

export function perspective(matrix, fov, near, far, aspect) {
  let top = near * Math.tan((fov * Math.PI) / 360.0)
  let bottom = -top
  let left = bottom * aspect
  let right = top * aspect

  frustum(matrix, left, right, bottom, top, near, far)
}

export function translate(matrix, x, y, z) {
  matrix[12] = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12]
  matrix[13] = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13]
  matrix[14] = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14]
  matrix[15] = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15]
}

export function translateFromView(matrix, view, x, y, z) {
  matrix[0] = view[0]
  matrix[1] = view[1]
  matrix[2] = view[2]
  matrix[3] = view[3]
  matrix[4] = view[4]
  matrix[5] = view[5]
  matrix[6] = view[6]
  matrix[7] = view[7]
  matrix[8] = view[8]
  matrix[9] = view[9]
  matrix[10] = view[10]
  matrix[11] = view[11]
  matrix[12] = x * view[0] + y * view[4] + z * view[8] + view[12]
  matrix[13] = x * view[1] + y * view[5] + z * view[9] + view[13]
  matrix[14] = x * view[2] + y * view[6] + z * view[10] + view[14]
  matrix[15] = x * view[3] + y * view[7] + z * view[11] + view[15]
}

export function multiply(matrix, a, b) {
  matrix[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3]
  matrix[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3]
  matrix[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3]
  matrix[3] = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3]

  matrix[4] = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7]
  matrix[5] = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7]
  matrix[6] = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7]
  matrix[7] = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7]

  matrix[8] = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11]
  matrix[9] = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11]
  matrix[10] = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11]
  matrix[11] = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11]

  matrix[12] = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15]
  matrix[13] = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15]
  matrix[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15]
  matrix[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
}

export function rotateX(matrix, sine, cosine) {
  temp[0] = 1.0
  temp[1] = 0.0
  temp[2] = 0.0
  temp[3] = 0.0

  temp[4] = 0.0
  temp[5] = cosine
  temp[6] = sine
  temp[7] = 0.0

  temp[8] = 0.0
  temp[9] = -sine
  temp[10] = cosine
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function rotateY(matrix, sine, cosine) {
  temp[0] = cosine
  temp[1] = 0.0
  temp[2] = -sine
  temp[3] = 0.0

  temp[4] = 0.0
  temp[5] = 1.0
  temp[6] = 0.0
  temp[7] = 0.0

  temp[8] = sine
  temp[9] = 0.0
  temp[10] = cosine
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function rotateZ(matrix, sine, cosine) {
  temp[0] = cosine
  temp[1] = sine
  temp[2] = 0.0
  temp[3] = 0.0

  temp[4] = -sine
  temp[5] = cosine
  temp[6] = 0.0
  temp[7] = 0.0

  temp[8] = 0.0
  temp[9] = 0.0
  temp[10] = 1.0
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function setTranslation(matrix, x, y, z) {
  matrix[12] = x
  matrix[13] = y
  matrix[14] = z
}

export function matrixInverse(matrix, from) {
  let src = new Float32Array(16)

  src[0] = from[0]
  src[4] = from[1]
  src[8] = from[2]
  src[12] = from[3]

  src[1] = from[4]
  src[5] = from[5]
  src[9] = from[6]
  src[13] = from[7]

  src[2] = from[8]
  src[6] = from[9]
  src[10] = from[10]
  src[14] = from[11]

  src[3] = from[12]
  src[7] = from[13]
  src[11] = from[14]
  src[15] = from[15]

  let tmp = new Float32Array(16)

  tmp[0] = src[10] * src[15]
  tmp[1] = src[11] * src[14]
  tmp[2] = src[9] * src[15]
  tmp[3] = src[11] * src[13]
  tmp[4] = src[9] * src[14]
  tmp[5] = src[10] * src[13]
  tmp[6] = src[8] * src[15]
  tmp[7] = src[11] * src[12]
  tmp[8] = src[8] * src[14]
  tmp[9] = src[10] * src[12]
  tmp[10] = src[8] * src[13]
  tmp[11] = src[9] * src[12]

  let dst = new Float32Array(16)

  dst[0] = tmp[0] * src[5] + tmp[3] * src[6] + tmp[4] * src[7]
  dst[0] -= tmp[1] * src[5] + tmp[2] * src[6] + tmp[5] * src[7]
  dst[1] = tmp[1] * src[4] + tmp[6] * src[6] + tmp[9] * src[7]
  dst[1] -= tmp[0] * src[4] + tmp[7] * src[6] + tmp[8] * src[7]
  dst[2] = tmp[2] * src[4] + tmp[7] * src[5] + tmp[10] * src[7]
  dst[2] -= tmp[3] * src[4] + tmp[6] * src[5] + tmp[11] * src[7]
  dst[3] = tmp[5] * src[4] + tmp[8] * src[5] + tmp[11] * src[6]
  dst[3] -= tmp[4] * src[4] + tmp[9] * src[5] + tmp[10] * src[6]
  dst[4] = tmp[1] * src[1] + tmp[2] * src[2] + tmp[5] * src[3]
  dst[4] -= tmp[0] * src[1] + tmp[3] * src[2] + tmp[4] * src[3]
  dst[5] = tmp[0] * src[0] + tmp[7] * src[2] + tmp[8] * src[3]
  dst[5] -= tmp[1] * src[0] + tmp[6] * src[2] + tmp[9] * src[3]
  dst[6] = tmp[3] * src[0] + tmp[6] * src[1] + tmp[11] * src[3]
  dst[6] -= tmp[2] * src[0] + tmp[7] * src[1] + tmp[10] * src[3]
  dst[7] = tmp[4] * src[0] + tmp[9] * src[1] + tmp[10] * src[2]
  dst[7] -= tmp[5] * src[0] + tmp[8] * src[1] + tmp[11] * src[2]

  tmp[0] = src[2] * src[7]
  tmp[1] = src[3] * src[6]
  tmp[2] = src[1] * src[7]
  tmp[3] = src[3] * src[5]
  tmp[4] = src[1] * src[6]
  tmp[5] = src[2] * src[5]
  tmp[6] = src[0] * src[7]
  tmp[7] = src[3] * src[4]
  tmp[8] = src[0] * src[6]
  tmp[9] = src[2] * src[4]
  tmp[10] = src[0] * src[5]
  tmp[11] = src[1] * src[4]

  dst[8] = tmp[0] * src[13] + tmp[3] * src[14] + tmp[4] * src[15]
  dst[8] -= tmp[1] * src[13] + tmp[2] * src[14] + tmp[5] * src[15]
  dst[9] = tmp[1] * src[12] + tmp[6] * src[14] + tmp[9] * src[15]
  dst[9] -= tmp[0] * src[12] + tmp[7] * src[14] + tmp[8] * src[15]
  dst[10] = tmp[2] * src[12] + tmp[7] * src[13] + tmp[10] * src[15]
  dst[10] -= tmp[3] * src[12] + tmp[6] * src[13] + tmp[11] * src[15]
  dst[11] = tmp[5] * src[12] + tmp[8] * src[13] + tmp[11] * src[14]
  dst[11] -= tmp[4] * src[12] + tmp[9] * src[13] + tmp[10] * src[14]
  dst[12] = tmp[2] * src[10] + tmp[5] * src[11] + tmp[1] * src[9]
  dst[12] -= tmp[4] * src[11] + tmp[0] * src[9] + tmp[3] * src[10]
  dst[13] = tmp[8] * src[11] + tmp[0] * src[8] + tmp[7] * src[10]
  dst[13] -= tmp[6] * src[10] + tmp[9] * src[11] + tmp[1] * src[8]
  dst[14] = tmp[6] * src[9] + tmp[11] * src[11] + tmp[3] * src[8]
  dst[14] -= tmp[10] * src[11] + tmp[2] * src[8] + tmp[7] * src[9]
  dst[15] = tmp[10] * src[10] + tmp[4] * src[8] + tmp[9] * src[9]
  dst[15] -= tmp[8] * src[9] + tmp[11] * src[10] + tmp[5] * src[8]

  let det = 1.0 / (src[0] * dst[0] + src[1] * dst[1] + src[2] * dst[2] + src[3] * dst[3])

  for (let i = 0; i < 16; i++) matrix[i] = dst[i] * det
}

export function transpose(matrix, from) {
  matrix[0] = from[0]
  matrix[4] = from[1]
  matrix[8] = from[2]
  matrix[12] = from[3]

  matrix[1] = from[4]
  matrix[5] = from[5]
  matrix[9] = from[6]
  matrix[13] = from[7]

  matrix[2] = from[8]
  matrix[6] = from[9]
  matrix[10] = from[10]
  matrix[14] = from[11]

  matrix[3] = from[12]
  matrix[7] = from[13]
  matrix[11] = from[14]
  matrix[15] = from[15]
}

export function multiplyVector3(out, matrix, vec) {
  out[0] = vec[0] * matrix[0] + vec[1] * matrix[4] + vec[2] * matrix[8] + matrix[12]
  out[1] = vec[0] * matrix[1] + vec[1] * matrix[5] + vec[2] * matrix[9] + matrix[13]
  out[2] = vec[0] * matrix[2] + vec[1] * matrix[6] + vec[2] * matrix[10] + matrix[14]
}

export function multiplyVector4(out, matrix, vec) {
  out[0] = vec[0] * matrix[0] + vec[1] * matrix[4] + vec[2] * matrix[8] + vec[3] * matrix[12]
  out[1] = vec[0] * matrix[1] + vec[1] * matrix[5] + vec[2] * matrix[9] + vec[3] * matrix[13]
  out[2] = vec[0] * matrix[2] + vec[1] * matrix[6] + vec[2] * matrix[10] + vec[3] * matrix[14]
  out[3] = vec[0] * matrix[3] + vec[1] * matrix[7] + vec[2] * matrix[11] + vec[3] * matrix[15]
}

export function lookAt(matrix, eye, center) {
  let forward = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]]
  normalize(forward)

  let any = [0.0, 1.0, 0.0]

  let side = []
  cross(side, forward, any)

  let up = []
  cross(up, side, forward)

  matrix[0] = side[0]
  matrix[4] = side[1]
  matrix[8] = side[2]
  matrix[12] = 0.0

  matrix[1] = up[0]
  matrix[5] = up[1]
  matrix[9] = up[2]
  matrix[13] = 0.0

  matrix[2] = -forward[0]
  matrix[6] = -forward[1]
  matrix[10] = -forward[2]
  matrix[14] = 0.0

  matrix[3] = 0.0
  matrix[7] = 0.0
  matrix[11] = 0.0
  matrix[15] = 1.0
}
