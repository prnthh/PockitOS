import * as THREE from 'three'

// --- Types for LooseOctreeNode ---
class LooseOctreeNode {
  octree: LooseOctree;
  parent: LooseOctreeNode | null;
  center: THREE.Vector3;
  size: number;
  inner: THREE.Box3;
  outer: THREE.Box3;
  items: LooseOctreeItem[];
  count: number;
  children: LooseOctreeNode[];
  _helperItem?: any;

  constructor(
    octree: LooseOctree,
    parent: LooseOctreeNode | null,
    center: THREE.Vector3,
    size: number
  ) {
    this.octree = octree;
    this.parent = parent;
    this.center = center;
    this.size = size;
    this.inner = new THREE.Box3(
      new THREE.Vector3(center.x - size, center.y - size, center.z - size),
      new THREE.Vector3(center.x + size, center.y + size, center.z + size)
    );
    this.outer = new THREE.Box3(
      new THREE.Vector3(center.x - size * 2, center.y - size * 2, center.z - size * 2),
      new THREE.Vector3(center.x + size * 2, center.y + size * 2, center.z + size * 2)
    );
    this.items = [];
    this.count = 0;
    this.children = [];
    this.mountHelper();
  }

  insert(item: LooseOctreeItem): boolean {
    // the following rules (using MIN_RADIUS and bucket size) allows us to keep the tree balanced by occupancy, not by item size.
    // this prevents creating unnecessary deep nodes just to hold a single/few items.
    if (!this.canContain(item)) {
      return false
    }

    // if leaf and not too many items, just stash it here
    if (!this.children.length && this.items.length < BUCKET_SIZE) {
      this.items.push(item)
      item._node = this
      this.inc(1)
      return true
    }
    // otherwise, if we’re still allowed to split...
    if (item.sphere && this.size / 2 >= item.sphere.radius) {
      if (!this.children.length) this.subdivide()
      for (const child of this.children) {
        if (child.insert(item)) {
          return true
        }
      }
    }
    // fallback: keep it here
    this.items.push(item)
    item._node = this
    this.inc(1)
    return true

    // if (this.size / 2 < item.sphere.radius) {
    //   this.items.push(item)
    //   item._node = this
    //   this.inc(1)
    //   return true
    // }
    // if (!this.children.length) {
    //   this.subdivide()
    // }
    // for (const child of this.children) {
    //   if (child.insert(item)) {
    //     return true
    //   }
    // }
    // // this should never happen
    // console.error('octree insert fail')
    // // this.items.push(item)
    // // item._node = this
    // return false
  }

  remove(item: LooseOctreeItem): void {
    const idx = this.items.indexOf(item)
    this.items.splice(idx, 1)
    item._node = null
    this.dec(1)
  }

  inc(amount: number): void {
    let node: LooseOctreeNode | null = this
    while (node) {
      node.count += amount
      node = node.parent
    }
  }

  dec(amount: number): void {
    let node = this
    while (node) {
      node.count -= amount
      node = node.parent
    }
  }

  canContain(item: LooseOctreeItem): boolean {
    if (!item.sphere) return false;
    return this.size >= item.sphere.radius && this.inner.containsPoint(item.sphere.center)
  }

  checkCollapse(): void {
    // a node can collapse if it has children to collapse AND has no items in any descendants
    let match
    let node = this
    while (node) {
      if (node.count) break
      if (node.children.length) match = node
      node = node.parent
    }
    match?.collapse()
  }

  collapse(): void {
    for (const child of this.children) {
      child.collapse()
      child.destroy()
    }
    this.children = []
  }

  // subdivide() {
  //   if (this.children.length) return // Ensure we don't subdivide twice
  //   const halfSize = this.size / 2
  //   for (let x = 0; x < 2; x++) {
  //     for (let y = 0; y < 2; y++) {
  //       for (let z = 0; z < 2; z++) {
  //         const center = new THREE.Vector3(
  //           this.center.x + halfSize * (2 * x - 1),
  //           this.center.y + halfSize * (2 * y - 1),
  //           this.center.z + halfSize * (2 * z - 1)
  //         )
  //         const child = new LooseOctreeNode(this.octree, this, center, halfSize)
  //         this.children.push(child)
  //       }
  //     }
  //   }
  // }

  subdivide(): void {
    if (this.children.length) return // only once

    // 1) carve eight children exactly as you do now…
    const half = this.size / 2
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          const c = new THREE.Vector3(this.center.x + x * half, this.center.y + y * half, this.center.z + z * half)
          this.children.push(new LooseOctreeNode(this.octree, this, c, half))
        }
      }
    }

    // 2) pull all the items you’d previously stored here…
    const oldItems = this.items
    this.items = []
    // decrement counts for the items we’re about to reassign
    this.dec(oldItems.length)

    // 3) try to shove each one into a child
    for (const item of oldItems) {
      let wentDown = false
      for (const child of this.children) {
        if (child.insert(item)) {
          wentDown = true
          break
        }
      }
      // 4) if it still doesn’t fit any child, put it back here
      if (!wentDown) {
        this.items.push(item)
        item._node = this
        this.inc(1)
      }
    }
  }

  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): THREE.Intersection[] {
    if (!raycaster.ray.intersectsBox(this.outer)) {
      return intersects
    }
    for (const item of this.items) {
      if (raycaster.ray.intersectsSphere(item.sphere)) {
        _mesh.geometry = item.geometry
        _mesh.material = item.material
        _mesh.matrixWorld = item.matrix
        _mesh.raycast(raycaster, _intersects)
        for (let i = 0, l = _intersects.length; i < l; i++) {
          const intersect = _intersects[i]
          intersect.getEntity = item.getEntity
          intersect.node = item.node
          intersects.push(intersect)
        }
        _intersects.length = 0
      }
    }
    for (const child of this.children) {
      child.raycast(raycaster, intersects)
    }
    return intersects
  }

  // spherecast(sphere, intersects) {
  //   if (!sphere.intersectsBox(this.outer)) {
  //     return intersects
  //   }
  //   for (const item of this.items) {
  //     if (sphere.intersectsSphere(item.sphere)) {
  //       // just sphere-to-sphere is good enough for now
  //       const centerToCenterDistance = sphere.center.distanceTo(
  //         item.sphere.center
  //       )
  //       const overlapDistance =
  //         item.sphere.radius + sphere.radius - centerToCenterDistance
  //       const distance = Math.max(0, overlapDistance)
  //       const intersect = {
  //         distance: distance,
  //         point: null,
  //         object: null,
  //         getEntity: item.getEntity,
  //       }
  //       intersects.push(intersect)
  //       // _mesh.geometry = item.geometry
  //       // _mesh.material = item.material
  //       // _mesh.matrixWorld = item.matrix
  //       // _mesh.raycast(raycaster, _intersects)
  //       // for (let i = 0, l = _intersects.length; i < l; i++) {
  //       //   const intersect = _intersects[i]
  //       //   intersect.getEntity = item.getEntity
  //       //   intersects.push(intersect)
  //       // }
  //       // _intersects.length = 0
  //     }
  //   }
  //   for (const child of this.children) {
  //     child.spherecast(sphere, intersects)
  //   }
  //   return intersects
  // }

  // prune() {
  //   let empty = true
  //   for (const child of this.children) {
  //     const canPrune = !child.items.length && child.prune()
  //     if (!canPrune) {
  //       empty = false
  //     }
  //   }
  //   if (empty) {
  //     for (const child of this.children) {
  //       this.octree.helper?.remove(child)
  //     }
  //     this.children.length = 0
  //     this.octree.pruneCount++
  //   }
  //   return empty
  // }

  getDepth(): number {
    if (this.children.length === 0) {
      return 1
    }
    return 1 + Math.max(...this.children.map(child => child.getDepth()))
  }

  getCount(): number {
    let count = 1
    for (const child of this.children) {
      count += child.getCount()
    }
    return count
  }

  mountHelper(): void {
    this.octree.helper?.insert(this)
  }

  unmountHelper(): void {
    this.octree.helper?.remove(this)
  }

  destroy(): void {
    this.unmountHelper()
  }
}

// --- LooseOctree ---
const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _m1 = new THREE.Matrix4()
const _intersects: THREE.Intersection[] = []
const _mesh = new THREE.Mesh()

const MIN_RADIUS = 0.5
const BUCKET_SIZE = 16

// https://anteru.net/blog/2008/loose-octrees/

export interface LooseOctreeItem {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrix: THREE.Matrix4;
  sphere?: THREE.Sphere;
  _node?: LooseOctreeNode | null;
  getEntity?: () => any;
  node?: any;
}

export interface LooseOctreeOptions {
  scene: THREE.Scene;
  center: THREE.Vector3;
  size: number;
}

export class LooseOctree {
  scene: THREE.Scene;
  root: LooseOctreeNode;
  helper: any;

  constructor({ scene, center, size }: LooseOctreeOptions) {
    this.scene = scene;
    this.root = new LooseOctreeNode(this, null, center, size);
    this.helper = null;
  }

  insert(item: LooseOctreeItem): boolean {
    if (!item.sphere) item.sphere = new THREE.Sphere()
    if (!item.geometry.boundingSphere) item.geometry.computeBoundingSphere()
    item.sphere.copy(item.geometry.boundingSphere).applyMatrix4(item.matrix)
    if (item.sphere.radius < MIN_RADIUS) item.sphere.radius = MIN_RADIUS // prevent huge subdivisions
    let added = this.root.insert(item)
    if (!added) {
      while (!this.root.canContain(item)) {
        this.expand()
      }
      added = this.root.insert(item)
    }
    return added
  }

  move(item: LooseOctreeItem): void {
    if (!item._node) {
      // console.error('octree item move called but there is no _node')
      return
    }
    // update bounding sphere
    item.sphere.copy(item.geometry.boundingSphere!).applyMatrix4(item.matrix)
    // if it still fits inside its current node that's cool
    if (item._node.canContain(item)) {
      return
    }
    // if it doesn't fit, re-insert it into its new node
    const prevNode = item._node
    this.remove(item)
    const added = this.insert(item)
    if (!added) {
      console.error('octree item moved but was not re-added. did it move outside octree bounds?')
    }
    // check if we can collapse the previous node
    prevNode.checkCollapse()
  }

  remove(item: LooseOctreeItem): void {
    item._node?.remove(item)
  }

  expand() {
    // console.log('expand')
    // when we expand we do it twice so that it expands in both directions.
    // first goes positive, second goes back negative
    let prevRoot
    let size
    let center

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x + prevRoot.size,
      prevRoot.center.y + prevRoot.size,
      prevRoot.center.z + prevRoot.size
    )
    const first = new LooseOctreeNode(this, null, center, size)
    first.subdivide()
    first.children[0].destroy()
    first.children[0] = prevRoot
    prevRoot.parent = first
    this.root = first
    this.root.count = prevRoot.count

    prevRoot = this.root
    size = prevRoot.size * 2
    center = new THREE.Vector3(
      prevRoot.center.x - prevRoot.size,
      prevRoot.center.y - prevRoot.size,
      prevRoot.center.z - prevRoot.size
    )
    const second = new LooseOctreeNode(this, null, center, size)
    second.subdivide()
    second.children[7].destroy()
    second.children[7] = prevRoot
    prevRoot.parent = second
    this.root = second
    this.root.count = prevRoot.count
  }

  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[] = []): THREE.Intersection[] {
    this.root.raycast(raycaster, intersects)
    intersects.sort(sortAscending)
    // console.log('octree.raycast', intersects)
    return intersects
  }

  // spherecast(sphere, intersects = []) {
  //   // console.time('spherecast')
  //   this.root.spherecast(sphere, intersects)
  //   intersects.sort(sortAscending)
  //   // console.timeEnd('spherecast')
  //   // console.log('octree.spherecast', intersects)
  //   return intersects
  // }

  // prune() {
  //   console.time('prune')
  //   this.pruneCount = 0
  //   this.root.prune()
  //   console.timeEnd('prune')
  //   console.log('pruned:', this.pruneCount)
  // }

  toggleHelper(enabled?: boolean): void {
    enabled = isBoolean(enabled) ? enabled : !this.helper
    if (enabled && !this.helper) {
      this.helper = createHelper(this)
      this.helper.init()
    }
    if (!enabled && this.helper) {
      this.helper.destroy()
      this.helper = null
    }
  }

  getDepth() {
    return this.root.getDepth()
  }

  getCount() {
    return this.root.getCount()
  }
}

function sortAscending(a: THREE.Intersection, b: THREE.Intersection) {
  return a.distance - b.distance
}

// function getRandomHexColor() {
//   // Generate a random integer between 0 and 0xFFFFFF (16777215 in decimal)
//   const randomInt = Math.floor(Math.random() * 16777216);
//   // Convert the integer to a hexadecimal string and pad with leading zeros if necessary
//   const hexColor = randomInt.toString(16).padStart(6, '0');
//   // Prefix with '#' to form a valid hex color code
//   return '#' + hexColor;
// }

function createHelper(octree: LooseOctree) {
  const boxes = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(boxes);
  // Use InstancedBufferGeometry directly
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.copy(edges as any); // TypeScript workaround
  const iMatrix = new THREE.InstancedBufferAttribute(new Float32Array(1000000 * 16), 16);
  iMatrix.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('iMatrix', iMatrix);
  const offset = new THREE.InstancedBufferAttribute(new Float32Array(100000 * 3), 3);
  geometry.setAttribute('offset', offset);
  const scale = new THREE.InstancedBufferAttribute(new Float32Array(100000 * 3), 3);
  geometry.setAttribute('scale', scale);
  geometry.instanceCount = 0;
  const material = new THREE.LineBasicMaterial({ color: 'red' });
  (material as any).onBeforeCompile = (shader: any) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `\nattribute mat4 iMatrix;\n#include <common>`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `\n#include <begin_vertex>\ntransformed = (iMatrix * vec4(position, 1.0)).xyz;`
    );
  };
  const mesh = new THREE.LineSegments(geometry, material);
  mesh.frustumCulled = false;
  const items: any[] = [];
  function insert(node: LooseOctreeNode) {
    const idx = mesh.geometry.instanceCount
    mesh.geometry.instanceCount++
    const position = _v1.copy(node.center)
    const quaternion = _q1.set(0, 0, 0, 1)
    const scale = _v2.setScalar(node.size * 2)
    const matrix = new THREE.Matrix4().compose(position, quaternion, scale)
    iMatrix.set(matrix.elements, idx * 16)
    iMatrix.needsUpdate = true
    node._helperItem = { idx, matrix }
    items.push(node._helperItem)
    // console.log('add', items.length)
  }
  function remove(node: LooseOctreeNode) {
    const item = node._helperItem
    const last = items[items.length - 1]
    const isOnly = items.length === 1
    const isLast = item === last
    if (isOnly) {
      items.length = 0
      mesh.geometry.instanceCount = 0
    } else if (isLast) {
      items.pop()
      mesh.geometry.instanceCount--
    } else {
      if (!last) {
        console.log(
          'wtf',
          item,
          items.indexOf(item),
          last,
          items.length,
          // items[items.length - 1]
          mesh.geometry.instanceCount,
          items
        )
        throw new Error('wtf')
      }
      iMatrix.set(last.matrix.elements, item.idx * 16)
      last.idx = item.idx
      items[item.idx] = last
      items.pop()
      mesh.geometry.instanceCount--
    }
    iMatrix.needsUpdate = true
  }
  function traverse(node: LooseOctreeNode, callback: (node: LooseOctreeNode) => void) {
    callback(node);
    for (const child of node.children) {
      traverse(child, callback);
    }
  }
  function destroy() {
    octree.scene.remove(mesh);
  }
  function init() {
    traverse(octree.root, node => {
      node.mountHelper();
    });
  }
  octree.scene.add(mesh);
  return {
    init,
    insert,
    remove,
    destroy,
  };
}