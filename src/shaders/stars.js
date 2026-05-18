export const starsVertexShader = `
attribute float size;
varying vec3 vColor;

void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const starsFragmentShader = `
varying vec3 vColor;
uniform float uOpacity;

void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    
    float strength = 1.0 - (r * 2.0);
    gl_FragColor = vec4(vColor, strength * uOpacity);
}
`;
