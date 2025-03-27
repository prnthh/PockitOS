import { useTexture } from '@react-three/drei'

// Helper function to create a range of numbers
const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const helpers =/* glsl */ `
  float sdfCircle(vec2 uv, float r, vec2 offset) {
    float x = uv.x - offset.x;
    float y = uv.y - offset.y;
    return length(vec2(x, y)) - r;
  }
`

const params =/* glsl */ `
  uniform vec3 uPlanePosition;
  uniform mat3 uPlaneRotation; // Added plane rotation uniform
  uniform float room_size;
  uniform float room_depth;
  uniform sampler2D cubemap_albedo;
  uniform float emission_strength;

  varying vec3 obj_vertex;
  varying vec3 obj_cam;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vBitangent;
`

const interiorCubeMap = {
  vertexShader:/* glsl */ `
    ${params}

    void main() {
      if (room_depth != 0.) {
        vec2 d = vec2(room_size, room_size) / 2.;
        vec3 delta = vec3(d.x, d.y, 0.);

        obj_vertex = position - delta;
        obj_cam = inverse(modelViewMatrix)[3].xyz - delta;
      }

      // Transform normal, tangent, and bitangent to world space
      vNormal = normalize(normalMatrix * normal);
      
      // Compute tangent and bitangent for a plane
      vec3 tangent = vec3(1.0, 0.0, 0.0); // Align with UV.x
      vec3 bitangent = vec3(0.0, 1.0, 0.0); // Align with UV.y
      vTangent = normalize(normalMatrix * tangent);
      vBitangent = normalize(normalMatrix * bitangent);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  fragmentShader:/* glsl */ `
    ${params}

    ${helpers}

    float remap_range(float value, float min_in, float max_in, float min_out, float max_out) {
      return (value - min_in) / (max_in - min_in) * (max_out - min_out) + min_out;
    }

    vec3 sample_cubemap(sampler2D cubemap, vec2 uv, vec3 face) {
      face = normalize(face);

      if (face.x == 1.) {
        uv.x = remap_range(uv.x, 0., 1., 0., 1./3.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.x == -1.) {
        uv.x = remap_range(uv.x, 0., 1., 0., 1./3.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }
      else if (face.y == 1.) {
        uv.x = remap_range(uv.x, 0., 1., 1./3., 2./3.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.y == -1.) {
        uv.x = remap_range(uv.x, 0., 1., 1./3., 2./3.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }
      else if (face.z == 1.) {
        uv.x = remap_range(uv.x, 0., 1., 2./3., 1.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.z == -1.) {
        uv.x = remap_range(uv.x, 0., 1., 2./3., 1.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }

      return texture(cubemap, uv).rgb;
    }

    void main() {
      vec3 color = vec3(0.);
      
      /* Cube Mapping */
      vec3 cm_face = vec3(0., 0., 1.);
      vec2 cm_uv = vUv;
      
      float depth = room_depth * 2.;
      vec3 cam2pix = obj_vertex - obj_cam;
      
      float is_floor = step(cam2pix.z, 0.);
      float ceil_y = ceil(obj_vertex.z / depth - is_floor) * depth;
      float ceil_t = (ceil_y - obj_cam.z) / cam2pix.z;
      
      float is_north = step(cam2pix.y, 0.);
      float wall_f_z = ceil(obj_vertex.y / room_size - is_north) * room_size;
      float wall_f_t = (wall_f_z - obj_cam.y) / cam2pix.y;
      
      float is_east = step(cam2pix.x, 0.);
      float wall_e_z = ceil(obj_vertex.x / room_size - is_east) * room_size;
      float wall_e_t = (wall_e_z - obj_cam.x) / cam2pix.x;
      
      vec2 tex_coord;
      float min_t = min(min(ceil_t, wall_e_t), wall_f_t);
      
      if (wall_e_t == min_t) {
        tex_coord = obj_cam.zy + wall_e_t * cam2pix.zy;
        cm_face = vec3((is_east == 0.) ? 1. : -1., 0., 0.);
      }
      else if (wall_f_t == min_t) {
        tex_coord = obj_cam.xz + wall_f_t * cam2pix.xz;
        cm_face = vec3(0., (is_north == 0.) ? -1. : 1., 0.);
      }
      else if (ceil_t == min_t) {
        tex_coord = obj_cam.xy + ceil_t * cam2pix.xy;
        cm_face = vec3(0., 0., (is_floor == 0.) ? 1. : -1.);
      }

      if (!(ceil_t == min_t)) {
        tex_coord.y /= room_depth;
      }

      cm_uv = (tex_coord * 0.5 + 1.);
      cm_uv.x = clamp(cm_uv.x, 0., 1.);
      cm_uv.y = clamp(cm_uv.y, 0., 1.);
      
      color = sample_cubemap(cubemap_albedo, cm_uv, cm_face);

      /* Parallax */
      vec2 parallaxUv = vUv - 0.5;

      // Compute view direction in world space
      vec3 viewDir = normalize(cameraPosition - uPlanePosition);

      // Transform view direction to the plane's local space using uPlaneRotation
      vec3 viewDirTS = uPlaneRotation * viewDir;

      // Normal in tangent space (facing forward in local space)
      vec3 normalTS = vec3(0.0, 0.0, 1.0);

      // Compute facing coefficient (clamp to avoid extremes)
      float facingCoefficient = max(dot(viewDirTS, normalTS), 1.0); // Avoid division by near-zero
      
      // Compute distance from camera to plane (in world space)
      float distanceToPlane = length(cameraPosition - uPlanePosition);
      
      // Scale parallax effect inversely with distance (closer = stronger effect)
      float distanceScale = 0.1 / distanceToPlane; // Adjust this factor as needed
      
      // Compute perspective offset with distance scaling
      vec3 perspective = viewDirTS / facingCoefficient;
      vec2 parallaxOffset = perspective.xy * facingCoefficient * distanceScale / 100.0; // Adjust this factor as needed

      // Depth distances for each circle layer
      float depthDist1 = 0.0; // Blue circle (outermost)
      float depthDist2 = 0.5; // Green circle (middle)
      float depthDist3 = 1.0; // Red circle (innermost)

      // Apply constrained offsets
      vec2 offset1 = depthDist1 * perspective.xy;
      vec2 offset2 = depthDist2 * perspective.xy;
      vec2 offset3 = depthDist3 * perspective.xy;

      // Compute SDF for each circle with offsets
      float shape1 = sdfCircle(parallaxUv, 0.1, offset1);  // Blue
      float shape2 = sdfCircle(parallaxUv, 0.14, offset2); // Green
      float shape3 = sdfCircle(parallaxUv, 0.18, offset3); // Red

      /* Blend colors */
      color = mix(vec3(1, 0, 0), color, step(0., shape3)); // Red
      color = mix(vec3(0, 1, 0), color, step(0., shape2)); // Green
      color = mix(vec3(0, 0, 1), color, step(0., shape1)); // Blue

      gl_FragColor = vec4(color, 1.0);
    }
  `
}

const Window = ({ size = [2, 2, 1], position = [0, 1, 5], rotation = [0, -Math.PI, 0] }: {
  size?: [number, number, number],
  position?: [number, number, number],
  rotation?: [number, number, number],
}) => {
  const cubemap_albedo = useTexture('/textures/cubemap-faces.png')

  // Compute the rotation matrix from Euler angles (X, Y, Z)
  const cosX = Math.cos(rotation[0]), sinX = Math.sin(rotation[0]);
  const cosY = Math.cos(rotation[1]), sinY = Math.sin(rotation[1]);
  const cosZ = Math.cos(rotation[2]), sinZ = Math.sin(rotation[2]);

  const rotationMatrix = [
    cosY * cosZ,
    sinX * sinY * cosZ - cosX * sinZ,
    cosX * sinY * cosZ + sinX * sinZ,
    cosY * sinZ,
    sinX * sinY * sinZ + cosX * cosZ,
    cosX * sinY * sinZ - sinX * cosZ,
    -sinY,
    sinX * cosY,
    cosX * cosY
  ];

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <shaderMaterial
        uniforms={{
          uPlanePosition: { value: position },
          uPlaneRotation: { value: rotationMatrix }, // Pass the rotation matrix
          room_size: { value: size[0] },
          cubemap_albedo: { value: cubemap_albedo },
          room_depth: { value: size[2] },
          emission_strength: { value: 1.0 }
        }}
        vertexShader={interiorCubeMap.vertexShader}
        fragmentShader={interiorCubeMap.fragmentShader}
      />
    </mesh>
  )
}

const WindowsInCircle = ({ count = 8, radius = 5 }: { count?: number, radius?: number }) => {
  return (
    <>
      {range(0, count).map((i) => {
        const angle = (i / count) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius

        return <Window key={i} position={[x, 1, z]} rotation={[0, -angle - Math.PI / 2, 0]} />
      })}
    </>
  )
}

export default WindowsInCircle