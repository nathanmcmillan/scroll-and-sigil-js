MatrixTemp = new Array(16)
MatrixCopied = new Array(16)

class Matrix {
  static Print(matrix) {
    let out = '['
    for (let i = 0; i < 15; i++) {
      out += matrix[i] + ', '
    }
    out += matrix[15] + ']'
    console.log(out)
  }
  static Identity(matrix) {
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
  static Orthographic(matrix, left, right, bottom, top, near, far) {
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
  static Perspective(matrix, fov, near, far, aspect) {
    let top = near * Math.tan((fov * Math.PI) / 360.0)
    let bottom = -top
    let left = bottom * aspect
    let right = top * aspect

    Matrix.Frustum(matrix, left, right, bottom, top, near, far)
  }
  static Frustum(matrix, left, right, bottom, top, near, far) {
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
  static Translate(matrix, x, y, z) {
    matrix[12] = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12]
    matrix[13] = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13]
    matrix[14] = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14]
    matrix[15] = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15]
  }
  static TranslateFromView(matrix, view, x, y, z) {
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
  static RotateX(matrix, r) {
    let cos = Math.cos(r)
    let sin = Math.sin(r)

    MatrixTemp[0] = 1.0
    MatrixTemp[1] = 0.0
    MatrixTemp[2] = 0.0
    MatrixTemp[3] = 0.0

    MatrixTemp[4] = 0.0
    MatrixTemp[5] = cos
    MatrixTemp[6] = sin
    MatrixTemp[7] = 0.0

    MatrixTemp[8] = 0.0
    MatrixTemp[9] = -sin
    MatrixTemp[10] = cos
    MatrixTemp[11] = 0.0

    MatrixTemp[12] = 0.0
    MatrixTemp[13] = 0.0
    MatrixTemp[14] = 0.0
    MatrixTemp[15] = 1.0

    for (let i = 0; i < 16; i++) MatrixCopied[i] = matrix[i]

    Matrix.Multiply(matrix, MatrixCopied, MatrixTemp)
  }
  static RotateY(matrix, r) {
    let cos = Math.cos(r)
    let sin = Math.sin(r)

    MatrixTemp[0] = cos
    MatrixTemp[1] = 0.0
    MatrixTemp[2] = -sin
    MatrixTemp[3] = 0.0

    MatrixTemp[4] = 0.0
    MatrixTemp[5] = 1.0
    MatrixTemp[6] = 0.0
    MatrixTemp[7] = 0.0

    MatrixTemp[8] = sin
    MatrixTemp[9] = 0.0
    MatrixTemp[10] = cos
    MatrixTemp[11] = 0.0

    MatrixTemp[12] = 0.0
    MatrixTemp[13] = 0.0
    MatrixTemp[14] = 0.0
    MatrixTemp[15] = 1.0

    for (let i = 0; i < 16; i++) MatrixCopied[i] = matrix[i]

    Matrix.Multiply(matrix, MatrixCopied, MatrixTemp)
  }
  static RotateZ(matrix, r) {
    let cos = Math.cos(r)
    let sin = Math.sin(r)

    MatrixTemp[0] = cos
    MatrixTemp[1] = sin
    MatrixTemp[2] = 0.0
    MatrixTemp[3] = 0.0

    MatrixTemp[4] = -sin
    MatrixTemp[5] = cos
    MatrixTemp[6] = 0.0
    MatrixTemp[7] = 0.0

    MatrixTemp[8] = 0.0
    MatrixTemp[9] = 0.0
    MatrixTemp[10] = 1.0
    MatrixTemp[11] = 0.0

    MatrixTemp[12] = 0.0
    MatrixTemp[13] = 0.0
    MatrixTemp[14] = 0.0
    MatrixTemp[15] = 1.0

    for (let i = 0; i < 16; i++) MatrixCopied[i] = matrix[i]

    Matrix.Multiply(matrix, MatrixCopied, MatrixTemp)
  }
  static Multiply(matrix, b, c) {
    matrix[0] = b[0] * c[0] + b[4] * c[1] + b[8] * c[2] + b[12] * c[3]
    matrix[1] = b[1] * c[0] + b[5] * c[1] + b[9] * c[2] + b[13] * c[3]
    matrix[2] = b[2] * c[0] + b[6] * c[1] + b[10] * c[2] + b[14] * c[3]
    matrix[3] = b[3] * c[0] + b[7] * c[1] + b[11] * c[2] + b[15] * c[3]

    matrix[4] = b[0] * c[4] + b[4] * c[5] + b[8] * c[6] + b[12] * c[7]
    matrix[5] = b[1] * c[4] + b[5] * c[5] + b[9] * c[6] + b[13] * c[7]
    matrix[6] = b[2] * c[4] + b[6] * c[5] + b[10] * c[6] + b[14] * c[7]
    matrix[7] = b[3] * c[4] + b[7] * c[5] + b[11] * c[6] + b[15] * c[7]

    matrix[8] = b[0] * c[8] + b[4] * c[9] + b[8] * c[10] + b[12] * c[11]
    matrix[9] = b[1] * c[8] + b[5] * c[9] + b[9] * c[10] + b[13] * c[11]
    matrix[10] = b[2] * c[8] + b[6] * c[9] + b[10] * c[10] + b[14] * c[11]
    matrix[11] = b[3] * c[8] + b[7] * c[9] + b[11] * c[10] + b[15] * c[11]

    matrix[12] = b[0] * c[12] + b[4] * c[13] + b[8] * c[14] + b[12] * c[15]
    matrix[13] = b[1] * c[12] + b[5] * c[13] + b[9] * c[14] + b[13] * c[15]
    matrix[14] = b[2] * c[12] + b[6] * c[13] + b[10] * c[14] + b[14] * c[15]
    matrix[15] = b[3] * c[12] + b[7] * c[13] + b[11] * c[14] + b[15] * c[15]
  }
  static Inverse(matrix, b) {
    for (let i = 0; i < 4; i++) {
      MatrixCopied[i + 0] = b[i * 4 + 0]
      MatrixCopied[i + 4] = b[i * 4 + 1]
      MatrixCopied[i + 8] = b[i * 4 + 2]
      MatrixCopied[i + 12] = b[i * 4 + 3]
    }

    MatrixTemp[0] = MatrixCopied[10] * MatrixCopied[15]
    MatrixTemp[1] = MatrixCopied[11] * MatrixCopied[14]
    MatrixTemp[2] = MatrixCopied[9] * MatrixCopied[15]
    MatrixTemp[3] = MatrixCopied[11] * MatrixCopied[13]
    MatrixTemp[4] = MatrixCopied[9] * MatrixCopied[14]
    MatrixTemp[5] = MatrixCopied[10] * MatrixCopied[13]
    MatrixTemp[6] = MatrixCopied[8] * MatrixCopied[15]
    MatrixTemp[7] = MatrixCopied[11] * MatrixCopied[12]
    MatrixTemp[8] = MatrixCopied[8] * MatrixCopied[14]
    MatrixTemp[9] = MatrixCopied[10] * MatrixCopied[12]
    MatrixTemp[10] = MatrixCopied[8] * MatrixCopied[13]
    MatrixTemp[11] = MatrixCopied[9] * MatrixCopied[12]

    matrix[0] = MatrixTemp[0] * MatrixCopied[5] + MatrixTemp[3] * MatrixCopied[6] + MatrixTemp[4] * MatrixCopied[7]
    matrix[0] -= MatrixTemp[1] * MatrixCopied[5] + MatrixTemp[2] * MatrixCopied[6] + MatrixTemp[5] * MatrixCopied[7]
    matrix[1] = MatrixTemp[1] * MatrixCopied[4] + MatrixTemp[6] * MatrixCopied[6] + MatrixTemp[9] * MatrixCopied[7]
    matrix[1] -= MatrixTemp[0] * MatrixCopied[4] + MatrixTemp[7] * MatrixCopied[6] + MatrixTemp[8] * MatrixCopied[7]
    matrix[2] = MatrixTemp[2] * MatrixCopied[4] + MatrixTemp[7] * MatrixCopied[5] + MatrixTemp[10] * MatrixCopied[7]
    matrix[2] -= MatrixTemp[3] * MatrixCopied[4] + MatrixTemp[6] * MatrixCopied[5] + MatrixTemp[11] * MatrixCopied[7]
    matrix[3] = MatrixTemp[5] * MatrixCopied[4] + MatrixTemp[8] * MatrixCopied[5] + MatrixTemp[11] * MatrixCopied[6]
    matrix[3] -= MatrixTemp[4] * MatrixCopied[4] + MatrixTemp[9] * MatrixCopied[5] + MatrixTemp[10] * MatrixCopied[6]
    matrix[4] = MatrixTemp[1] * MatrixCopied[1] + MatrixTemp[2] * MatrixCopied[2] + MatrixTemp[5] * MatrixCopied[3]
    matrix[4] -= MatrixTemp[0] * MatrixCopied[1] + MatrixTemp[3] * MatrixCopied[2] + MatrixTemp[4] * MatrixCopied[3]
    matrix[5] = MatrixTemp[0] * MatrixCopied[0] + MatrixTemp[7] * MatrixCopied[2] + MatrixTemp[8] * MatrixCopied[3]
    matrix[5] -= MatrixTemp[1] * MatrixCopied[0] + MatrixTemp[6] * MatrixCopied[2] + MatrixTemp[9] * MatrixCopied[3]
    matrix[6] = MatrixTemp[3] * MatrixCopied[0] + MatrixTemp[6] * MatrixCopied[1] + MatrixTemp[11] * MatrixCopied[3]
    matrix[6] -= MatrixTemp[2] * MatrixCopied[0] + MatrixTemp[7] * MatrixCopied[1] + MatrixTemp[10] * MatrixCopied[3]
    matrix[7] = MatrixTemp[4] * MatrixCopied[0] + MatrixTemp[9] * MatrixCopied[1] + MatrixTemp[10] * MatrixCopied[2]
    matrix[7] -= MatrixTemp[5] * MatrixCopied[0] + MatrixTemp[8] * MatrixCopied[1] + MatrixTemp[11] * MatrixCopied[2]

    MatrixTemp[0] = MatrixCopied[2] * MatrixCopied[7]
    MatrixTemp[1] = MatrixCopied[3] * MatrixCopied[6]
    MatrixTemp[2] = MatrixCopied[1] * MatrixCopied[7]
    MatrixTemp[3] = MatrixCopied[3] * MatrixCopied[5]
    MatrixTemp[4] = MatrixCopied[1] * MatrixCopied[6]
    MatrixTemp[5] = MatrixCopied[2] * MatrixCopied[5]
    MatrixTemp[6] = MatrixCopied[0] * MatrixCopied[7]
    MatrixTemp[7] = MatrixCopied[3] * MatrixCopied[4]
    MatrixTemp[8] = MatrixCopied[0] * MatrixCopied[6]
    MatrixTemp[9] = MatrixCopied[2] * MatrixCopied[4]
    MatrixTemp[10] = MatrixCopied[0] * MatrixCopied[5]
    MatrixTemp[11] = MatrixCopied[1] * MatrixCopied[4]

    matrix[8] = MatrixTemp[0] * MatrixCopied[13] + MatrixTemp[3] * MatrixCopied[14] + MatrixTemp[4] * MatrixCopied[15]
    matrix[8] -= MatrixTemp[1] * MatrixCopied[13] + MatrixTemp[2] * MatrixCopied[14] + MatrixTemp[5] * MatrixCopied[15]
    matrix[9] = MatrixTemp[1] * MatrixCopied[12] + MatrixTemp[6] * MatrixCopied[14] + MatrixTemp[9] * MatrixCopied[15]
    matrix[9] -= MatrixTemp[0] * MatrixCopied[12] + MatrixTemp[7] * MatrixCopied[14] + MatrixTemp[8] * MatrixCopied[15]
    matrix[10] = MatrixTemp[2] * MatrixCopied[12] + MatrixTemp[7] * MatrixCopied[13] + MatrixTemp[10] * MatrixCopied[15]
    matrix[10] -= MatrixTemp[3] * MatrixCopied[12] + MatrixTemp[6] * MatrixCopied[13] + MatrixTemp[11] * MatrixCopied[15]
    matrix[11] = MatrixTemp[5] * MatrixCopied[12] + MatrixTemp[8] * MatrixCopied[13] + MatrixTemp[11] * MatrixCopied[14]
    matrix[11] -= MatrixTemp[4] * MatrixCopied[12] + MatrixTemp[9] * MatrixCopied[13] + MatrixTemp[10] * MatrixCopied[14]
    matrix[12] = MatrixTemp[2] * MatrixCopied[10] + MatrixTemp[5] * MatrixCopied[11] + MatrixTemp[1] * MatrixCopied[9]
    matrix[12] -= MatrixTemp[4] * MatrixCopied[11] + MatrixTemp[0] * MatrixCopied[9] + MatrixTemp[3] * MatrixCopied[10]
    matrix[13] = MatrixTemp[8] * MatrixCopied[11] + MatrixTemp[0] * MatrixCopied[8] + MatrixTemp[7] * MatrixCopied[10]
    matrix[13] -= MatrixTemp[6] * MatrixCopied[10] + MatrixTemp[9] * MatrixCopied[11] + MatrixTemp[1] * MatrixCopied[8]
    matrix[14] = MatrixTemp[6] * MatrixCopied[9] + MatrixTemp[11] * MatrixCopied[11] + MatrixTemp[3] * MatrixCopied[8]
    matrix[14] -= MatrixTemp[10] * MatrixCopied[11] + MatrixTemp[2] * MatrixCopied[8] + MatrixTemp[7] * MatrixCopied[9]
    matrix[15] = MatrixTemp[10] * MatrixCopied[10] + MatrixTemp[4] * MatrixCopied[8] + MatrixTemp[9] * MatrixCopied[9]
    matrix[15] -= MatrixTemp[8] * MatrixCopied[9] + MatrixTemp[11] * MatrixCopied[10] + MatrixTemp[5] * MatrixCopied[8]

    let det = 1.0 / (MatrixCopied[0] * matrix[0] + MatrixCopied[1] * matrix[1] + MatrixCopied[2] * matrix[2] + MatrixCopied[3] * matrix[3])

    for (let i = 0; i < 16; i++) matrix[i] *= det
  }
}
