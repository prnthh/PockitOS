const prompt = ```
Write code for a component using pure html and vanilla js.
Do not include the head or body tags.
The component will be loaded during runtime inside the body.
You may import necessary modules from a CDN.
The component must not interact with outside DOM elements unless specified.

<div style="position: absolute;">
 {your code will be placed here}
</div>
```;

const threeJS = ```
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
  ```;

  const webAmp = `
<div id="app" style="height: 0px; width: 350px;"></div>
<script type="module">
  import Webamp from "https://unpkg.com/webamp@^2";
  const webamp = new Webamp({
    initialTracks: [
      {
        metaData: {
          artist: "DJ Mike Llama",
          title: "Llama Whippin' Intro",
        },
        url: "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3",
        duration: 5.322286,
      },
      {
        metaData: {
          artist: "Some Artist",
          title: "Title of Second Track",
        },
        url: "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3",
        duration: 5.322286,
      },
    ],
  });
  webamp.renderWhenReady(document.getElementById("app"));
</script>
`;

const background = `
<script type="module">
  document.body.style.background = 'red';
  document.body.style.minHeight = '100vh';
  document.body.style.width = '100vw';
</script>
`;

const iframe = `
<div style="height: 300px; width: 100%;">
  <iframe src="https://cult.inc/chat" style="width: 100%; height: 100%; border: none;"></iframe>
</div> 
`;
