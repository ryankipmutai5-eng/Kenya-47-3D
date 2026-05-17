import * as THREE from 'three';

export const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vEyeVector = -vec3(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const atmosphereFragmentShader = `
varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}
`;
