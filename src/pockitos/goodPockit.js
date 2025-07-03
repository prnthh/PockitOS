const prompt = ```
Write code for a component using pure html and vanilla js.
Do not include the head or body tags.
The component will be loaded during runtime inside the body.
You may import necessary modules from a CDN.
Use tailwind class names for styling.
The component must not interact with outside DOM elements unless specified.

<div style="position: absolute;">
 {your code will be placed here}
</div>

<div class="flex items-center justify-center">
  <button id="myButton" class="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:bg-blue-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 animate-bounce">Click Me</button>
</div>
<script>
  setTimeout(() => {
    document.getElementById('myButton').addEventListener('click', () => {
      alert('Button clicked!');
    });
  }, 1000);
</script>

<div id="viewer" style="width: 800px; height: 600px;"></div>
<script type="module">
  import * as THREE from 'https://unpkg.com/three/build/three.module.js';

  const container = document.getElementById('viewer');
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }

  animate();
</script>

<script type="module">
  document.body.style.background = 'red';
  document.body.style.minHeight = '100vh';
  document.body.style.width = '100vw';
</script>

<div style="height: 300px; width: 100%;">
  <iframe src="https://cult.inc/chat" style="width: 100%; height: 100%; border: none;"></iframe>
</div> 

<div id="shader-container" style="width: 500px; height: 500px;">
  <canvas id="shader-canvas" width="500" height="500"></canvas>
</div>

<script src="https://cdn.jsdelivr.net/gh/patriciogonzalezvivo/glslCanvas@master/dist/GlslCanvas.js"></script>
<script>
  // Defer logic until canvas is in the DOM and script is loaded
  function initShader() {
    const canvas = document.getElementById("shader-canvas");
    if (!canvas || !window.GlslCanvas) {
      requestAnimationFrame(initShader); // Try again shortly
      return;
    }

    const frag = \`
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec3 color = vec3(st.x, st.y, abs(sin(u_time)));
        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    canvas.setAttribute("data-fragment", frag);
    new GlslCanvas(canvas);
  }

  initShader();
</script>
```;