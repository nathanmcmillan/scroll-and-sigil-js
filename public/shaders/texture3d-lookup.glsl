#version 300 es
uniform mat4 u_mvp;
uniform mat4 u_view;
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec2 v_texture;
out vec3 v_position;
void main() {
  vec4 position = vec4(in_position, 1.0);
  v_texture = in_texture;
  v_position = (u_view * position).xyz;
  gl_Position = u_mvp * position;
}
===========================================================
#version 300 es
precision mediump float;
uniform sampler2D u_texture;
uniform sampler2D u_lookup;
const vec3 fog_color = vec3(0.0, 0.0, 0.0);
const float near = 50.0;
const float far = 100.0;
in vec2 v_texture;
in vec3 v_position;
layout (location = 0) out vec4 color;
void main() {
  float index = texture(u_texture, v_texture).r;
  if (index == 1.0) {
    discard;
  }
  vec3 pixel = vec3(index / 32.0, index / 32.0, index / 32.0);
  // vec3 pixel = texture(u_lookup, vec2(index + (0.5 / 32.0), 0.0)).rgb;
  color = vec4(pixel, 1.0);
}
