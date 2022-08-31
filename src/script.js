import * as THREE from 'three';
import { DragControls } from 'three/examples/js/controls/DragControls';

// Defining tolerance to allow error margin.
let tolerance = 1e-3;

// Function to evaluate distance between two points.
function distance(vertex1, vertex2) {
  return Math.sqrt(
    (vertex1[0] - vertex2[0]) ** 2 + (vertex1[1] - vertex2[1]) ** 2
  );
}

// Function to evaluate whether two lines, each one defined by a pair of points, are parrallel or not.
function isParallel(line1, line2) {
  // If both are vertical.
  if (
    Math.abs(line1[0][0] - line1[1][0]) < tolerance &&
    Math.abs(line2[0][0] - line2[1][0]) < tolerance
  ) {
    return true;
  }
  // If neither is vertical.
  else if (line1[0][0] != line1[1][0] && line2[0][0] != line2[1][0]) {
    // Difference on alpha is negligeble.
    if (
      Math.abs(
        (line1[1][1] - line1[0][1]) / (line1[1][0] - line1[0][0]) -
          (line2[1][1] - line2[0][1]) / (line2[1][0] - line2[0][0])
      ) < tolerance
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Function to evaluate intersection point of two given lines defined by a pair of points.
function intersectionPoint(line1, line2) {
  // If they are parrallel, no intersection point.
  if (isParallel(line1, line2)) {
    return null;
  } else {
    // If line1 is vertical.
    if (Math.abs(line1[0][0] - line1[1][0]) < tolerance) {
      return [
        line1[0][0],
        line2[0][1] +
          ((line2[1][1] - line2[0][1]) / (line2[1][0] - line2[0][0])) *
            (line1[0][0] - line2[0][0])
      ];
    }
    // If line2 is vertical.
    else if (Math.abs(line2[0][0] - line2[1][0]) < tolerance) {
      return [
        line2[0][0],
        line1[0][1] +
          ((line1[1][1] - line1[0][1]) / (line1[1][0] - line1[0][0])) *
            (line2[0][0] - line1[0][0])
      ];
    } else {
      let a1, a2, b1, b2;
      a1 = (line1[1][1] - line1[0][1]) / (line1[1][0] - line1[0][0]);
      b1 = line1[0][1] - line1[0][0] * a1;
      a2 = (line2[1][1] - line2[0][1]) / (line2[1][0] - line2[0][0]);
      b2 = line2[0][1] - line2[0][0] * a2;
      return [-(b2 - b1) / (a2 - a1), (a2 * b1 - a1 * b2) / (a2 - a1)];
    }
  }
}

// Function to evaluate whether a point is in a given polygon or not, using the ray test.
function pointInPolygon(point, polygon) {
  let total_intersections = 0;
  // Iterating over all edges of the polygon, which are defined by one vertice and its consecutive.
  for (const [index, vertex] of polygon.entries()) {
    const next_vertex = polygon[(index + 1) % polygon.length];
    // If edge is horizontal, the ray cannot touch unless the point has the same y, in which case it doesnt matter to count them.
    // If it is in the edge, it is in the polygon.
    if (Math.abs(vertex[1] - next_vertex[1]) < tolerance) {
      if (
        Math.abs(point[1] - vertex[1]) < tolerance &&
        (point[0] - vertex[0] < tolerance ||
          point[0] - next_vertex[0] < tolerance)
      ) {
        return true;
      }
    } else {
      // Intersection point of line defined by the edge must be greater than the x coordinate of the point to intersect.
      if (
        (point[1] - vertex[1] < tolerance &&
          next_vertex[1] - point[1] < tolerance) ||
        (vertex[1] - point[1] < tolerance &&
          point[1] - next_vertex[1] < tolerance)
      ) {
        let aux =
          point[0] -
          (vertex[0] +
            ((next_vertex[0] - vertex[0]) / (next_vertex[1] - vertex[1])) *
              (point[1] - vertex[1]));
        // If the difference is negligeble, the point is considered to be a vertex, thus inside.
        if (Math.abs(aux) < tolerance) {
          return true;
        } else if (aux < 0) {
          total_intersections++;
        }
      }
    }
  }
  // Must intersect an odd number of times.
  return total_intersections % 2;
}

// Function to evaluate the intersection of two not self intersecting polygons using Weiler-Atherton algorithm.
function weilerAtherton(polygon1, polygon2) {
  // Polygon1: subject polygon. Polygon2: clip polygon.

  // Intersections of edges of polygon1 with polygon2, each position i of intersections1 contains all
  // the intersection points that edge i makes with all the other edges from polygon2.
  let intersections1 = [];
  // Intersections of edges of polygon2 with polygon1.
  let intersections2 = [];

  // Wheter they are empty or not.
  let inter1_empty = true;
  let inter2_empty = true;

  // Final polygon.
  let polygon = [];

  // Iterating over all edges to find all intersection points.
  for (const [index1, vertex1] of polygon1.entries()) {
    const next_vertex1 = polygon1[(index1 + 1) % polygon1.length];

    intersections1.push([]);

    for (const [index2, vertex2] of polygon2.entries()) {
      const next_vertex2 = polygon2[(index2 + 1) % polygon2.length];
      if (index1 == 0) {
        intersections2.push([]);
      }
      // Intersection point of line defined by edge 1 and edge 2.
      let point = intersectionPoint(
        [vertex1, next_vertex1],
        [vertex2, next_vertex2]
      );
      // The edges may be parrallel.
      if (point != null) {
        // Evaluaiting whether the point is in both edge 1 and edge2.
        if (
          (vertex1[0] - point[0] < tolerance &&
            point[0] - next_vertex1[0] < tolerance) ||
          (point[0] - vertex1[0] < tolerance &&
            next_vertex1[0] - point[0] < tolerance)
        ) {
          if (
            (vertex1[1] - point[1] < tolerance &&
              point[1] - next_vertex1[1] < tolerance) ||
            (point[1] - vertex1[1] < tolerance &&
              next_vertex1[1] - point[1] < tolerance)
          ) {
            if (
              (vertex2[0] - point[0] < tolerance &&
                point[0] - next_vertex2[0] < tolerance) ||
              (point[0] - vertex2[0] < tolerance &&
                next_vertex2[0] - point[0] < tolerance)
            ) {
              if (
                (vertex2[1] - point[1] < tolerance &&
                  point[1] - next_vertex2[1] < tolerance) ||
                (point[1] - vertex2[1] < tolerance &&
                  next_vertex2[1] - point[1] < tolerance)
              ) {
                // If the point isn't already a point of the polygon, then it is an intersection point.
                if (
                  distance(point, vertex1) > tolerance &&
                  distance(point, next_vertex1) > tolerance
                ) {
                  intersections1[index1].push(point);
                  inter1_empty = false;
                }
                if (
                  distance(point, vertex2) > tolerance &&
                  distance(point, next_vertex2) > tolerance
                ) {
                  intersections2[index2].push(point);
                  inter2_empty = false;
                }
              }
            }
          }
        }
      }
    }

    // Sort intersection points based on the distance from the origin vertex.
    intersections1[index1].sort(function (a, b) {
      return distance(a, vertex1) - distance(b, vertex1);
    });
  }
  for (const [index2, vertex2] of polygon2.entries()) {
    intersections2[index2].sort(function (a, b) {
      return distance(a, vertex2) - distance(b, vertex2);
    });
  }

  // Clearing intersections found, because there may have repeated intersection points.
  for (let index1 = 0; index1 < intersections1.length; index1++) {
    let index3 = 0;
    while (index3 + 1 < intersections1[index1].length) {
      if (
        distance(
          intersections1[index1][index3 + 1],
          intersections1[index1][index3]
        ) < tolerance
      ) {
        intersections1[index1].splice(index3 + 1, 1);
      } else {
        index3++;
      }
    }
    while (
      intersections1[index1].length > 1 &&
      distance(
        intersections1[index1][0],
        intersections1[index1][intersections1[index1].length - 1]
      ) < tolerance
    ) {
      intersections1[index1].pop();
    }
  }

  for (let index2 = 0; index2 < intersections2.length; index2++) {
    let index3 = 0;
    while (index3 + 1 < intersections2[index2].length) {
      if (
        distance(
          intersections2[index2][index3 + 1],
          intersections2[index2][index3]
        ) < tolerance
      ) {
        intersections2[index2].splice(index3 + 1, 1);
      } else {
        index3++;
      }
    }
    while (
      intersections2[index2].length > 1 &&
      distance(
        intersections2[index2][0],
        intersections2[index2][intersections2[index2].length - 1]
      ) < tolerance
    ) {
      intersections2[index2].pop();
    }
  }

  // If both polygons have no intersections with each other, then either one is inside another, or they have null intersection.
  if (inter1_empty && inter2_empty) {
    let p1 = true,
      p2 = true,
      brk = false;
    // If there is a point of polygon1 outside polygon2, then polygon 1 is not inside polygon2.
    for (let index = 0; index < polygon1.length && !brk; index++) {
      if (!pointInPolygon(polygon1[index], polygon2)) {
        p1 = false;
        brk = true;
      }
    }
    // Analogous.
    brk = false;
    for (let index = 0; index < polygon2.length && !brk; index++) {
      if (!pointInPolygon(polygon2[index], polygon1)) {
        p2 = false;
        brk = true;
      }
    }
    if (p1) {
      polygon = polygon1;
    } else if (p2) {
      polygon = polygon2;
    }
    // If neither, the intersection polygon stays empty.
  }
  // Now the main part of the algorithm begins.
  else {
    // Iterators over polygon or intersections.
    let index1, index2;
    // Bool variable that is true when the current path is over the edges of polygon1, and false when it is over the edges of polygon2.
    let pol1;
    // Finding a start point to the polygon, trying first a point of polygon1 inside of polygon2.
    let brk = false;
    for (index1 = 0; index1 < polygon1.length && !brk; index1++) {
      if (pointInPolygon(polygon1[index1], polygon2)) {
        // First point of the construction.
        polygon.push(polygon1[index1]);
        // Since it is an inner point, we are still over the edges of polygon1.
        pol1 = true;
        brk = true;
      }
    }
    // If there are no points of polygon1 inside polygon2, then search the first intersection of an edge of polygon1 with and edge of polygon2.
    if (!brk) {
      brk = false;
      for (index1 = 0; index1 < intersections1.length && !brk; index1++) {
        if (intersections1[index1].length > 0) {
          // First point of the construction.
          polygon.push(intersections1[index1][0]);
          // Since it is an intersection point, the next one will be over an edge of polygon2.
          pol1 = false;
          brk = true;
        }
      }
    }
    // Bool variable to always allow first iteration of the following loop.
    let start = true;

    // While not coming back to first point in a cycle.
    while (
      start ||
      distance(polygon[0], polygon[polygon.length - 1]) > tolerance
    ) {
      start = false;
      // If over polygon1...
      if (pol1) {
        // Evaluating wheter the last point is a point of polygon1.
        brk = false;
        for (index1 = 0; index1 < polygon1.length && !brk; index1++) {
          if (
            distance(polygon[polygon.length - 1], polygon1[index1]) < tolerance
          ) {
            brk = true;
          }
        }
        // If it is, then...
        if (brk) {
          index1--;
          // If the edge doesn't have other intersections, go to next point of polygon1.
          if (intersections1[index1].length == 0) {
            // Since the a vertex is not counted as an intersection, The next point may be outside, in which case we need to start to go over polygon2.
            if (
              pointInPolygon(polygon1[(index1 + 1) % polygon1.length], polygon2)
            ) {
              polygon.push(polygon1[(index1 + 1) % polygon1.length]);
            } else {
              pol1 = false;
            }
          }
          // If the edge still has intersections, go to one of them and switch to polygon2.
          else {
            polygon.push(intersections1[index1][0]);
            pol1 = false;
          }
        }
        // If not a point of polygon1, then it is an intersection point
        else {
          // Finding the edge that makes this intersecting point
          brk = false;
          let index3;
          for (index1 = 0; index1 < intersections1.length && !brk; index1++) {
            for (
              index3 = 0;
              index3 < intersections1[index1].length && !brk;
              index3++
            ) {
              if (
                distance(
                  polygon[polygon.length - 1],
                  intersections1[index1][index3]
                ) < tolerance
              ) {
                brk = true;
              }
            }
          }
          index1--;
          index3--;
          // Trying to get next intersecting point of the edge, if ther isn't, then the next vertex of polygon1 is inside the polygon and we must take them.
          if (index3 == intersections1[index1].length - 1) {
            polygon.push(polygon1[(index1 + 1) % polygon1.length]);
          } else {
            polygon.push(intersections1[index1][index3 + 1]);
            // Switching.
            pol1 = false;
          }
        }
      } else {
        // Analogous
        brk = false;
        for (index2 = 0; index2 < polygon2.length && !brk; index2++) {
          if (
            distance(polygon[polygon.length - 1], polygon2[index2]) < tolerance
          ) {
            brk = true;
          }
        }
        if (brk) {
          index2--;
          if (intersections2[index2].length == 0) {
            polygon.push(polygon2[(index2 + 1) % polygon2.length]);
          } else {
            polygon.push(intersections2[index2][0]);
            pol1 = true;
          }
        } else {
          brk = false;
          let index3;
          for (index2 = 0; index2 < intersections2.length && !brk; index2++) {
            for (
              index3 = 0;
              index3 < intersections2[index2].length && !brk;
              index3++
            ) {
              if (
                distance(
                  polygon[polygon.length - 1],
                  intersections2[index2][index3]
                ) < tolerance
              ) {
                brk = true;
              }
            }
          }
          index2--;
          index3--;
          if (index3 == intersections2[index2].length - 1) {
            polygon.push(polygon2[(index2 + 1) % polygon2.length]);
          } else {
            polygon.push(intersections2[index2][index3 + 1]);
            pol1 = true;
          }
        }
      }
    }
    // Last iteration of loop made the first point repeated on the last
    polygon.pop();
  }
  return polygon;
}

// Function to calculate area of any polygon, by using signed areas of the triangles formed by edges and origin
function area(polygon) {
  let area = 0;
  for (const [index, vertex] of polygon.entries()) {
    let next_vertex = polygon[(index + 1) % polygon.length];
    area += -vertex[1] * next_vertex[0] + vertex[0] * next_vertex[1];
  }
  area = Math.abs(area) / 2;
  return area;
}

// DRAW FUNCS

const drawShape = (points, color) => {
  const shape = new THREE.Shape();

  shape.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  const object = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(
    object,
    new THREE.MeshPhongMaterial({ color: color, transparent: true })
  );
  return mesh;
};

const drawEmptyShape = (points) => {
  const shape = new THREE.Shape();

  shape.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  const object = new THREE.ShapeGeometry(shape);
  const linesGeometry = new THREE.EdgesGeometry(object);
  const mesh = new THREE.LineSegments(
    linesGeometry,
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );
  return mesh;
};

const factor = 100;
const factorDy = 0.9;
const factorDyTangram = 1.4;

const rotate = (points) => {
  for (let i = 0; i < points.length; i++) {
    const x = (points[i][0] * 1.0) / factor;
    const y = (points[i][1] * 1.0) / factor - factorDy;
    points[i][0] = x * Math.cos(2 * Math.PI) - y * Math.sin(2 * Math.PI);
    points[i][1] = x * Math.sin(Math.PI) + y * Math.cos(Math.PI);
  }

  return points;
};

const rotateTangram = (points) => {
  for (let i = 0; i < points.length; i++) {
    const x = (points[i][0] * 1.0) / factor - 2;
    const y = (points[i][1] * 1.0) / factor - factorDyTangram;
    points[i][0] = x * Math.cos(2 * Math.PI) - y * Math.sin(2 * Math.PI);
    points[i][1] = x * Math.sin(Math.PI) + y * Math.cos(Math.PI);
  }
  return points;
};

// MESHES

var houseMesh = drawShape(
  rotate([
    [231.16634, 0.1322915],
    [231.16634, 47.424488],
    [231.16634 - 46.99609, 47.424488 + 46.9961],
    [184.17024999999998 + 20.6468, 94.420588 + 0.0367],
    [204.81705 + 0.41651, 94.45728799999999 + 66.127232],
    [205.23355999999998 - 0.83974, 160.58452 + 0.83508],
    [204.39381999999998 + 135.62014, 161.4196 - 0.57565],
    [340.01396 - 1.91616, 160.84395 - 1.86503],
    [338.0978 + 0.55965, 158.97892000000002 - 64.475122],
    [338.65745 + 25.74676, 94.50379800000002],
    [364.40421 - 66.42386, 94.50379800000002 - 66.841395],
    [297.98035 - 19.466, 27.662403000000012 + 19.466],
    [297.98035 - 19.466, 0.1322915],
    [231.16634, 0.1322915]
  ]),
  "#FFFFFF"
);
var p1 = drawShape(
  rotateTangram([
    [46.958107, 73.831854],
    [113.79989, 140.67364],
    [46.958107, 207.09729]
  ]),
  "#ff0000"
);
var p2 = drawShape(
  rotateTangram([
    [179.80541, 73.674771],
    [46.958107, 74.249991],
    [113.79989, 140.67364]
  ]),
  "#aa0000"
);

var p3 = drawShape(
  rotateTangram([
    [146.53452, 106.94566],
    [146.53452, 106.94566 + 66.88075],
    [146.53452 - 33.15276, 106.94566 + 66.88075 - 33.15277]
  ]),
  "#ff00ff"
);

var p4 = drawShape(
  rotateTangram([
    [179.80541, 73.674771],
    [179.80541, 73.674771 + 66.998869],
    [179.80541 - 33.27089, 73.674771 + 66.998869 + 33.15277],
    [179.80541 - 33.27089, 73.674771 + 66.998869 + 33.15277 - 66.88075]
  ]),
  "#008080"
);

var p5 = drawShape(
  rotateTangram([
    [79.823261, 173.65692],
    [79.823261 + 33.440379, 173.65692 + 33.440379],
    [79.823261 + 33.440379 + 33.27088, 173.65692 + 33.440379 - 33.68902],
    [
      79.823261 + 33.440379 + 33.27088 - 33.2313,
      173.65692 + 33.440379 - 33.68902 - 33.23131
    ]
  ]),
  "#ffff00"
);

var p6 = drawShape(
  rotateTangram([
    [46.958107, 206.52207],
    [46.958107 + 32.865154, 206.52207 - 32.86515],
    [46.958107 + 32.865154 + 33.440369, 206.52207 - 32.86515 + 33.44037]
  ]),
  "#800080"
);

var p7 = drawShape(
  rotateTangram([
    [113.26364, 207.09729],
    [113.26364 + 66.54177, 207.09729 - 66.42365],
    [113.26364 + 66.54177 + 0.41813, 207.09729 - 66.42365 + 66.42365]
  ]),
  "#808000"
);

// SCENE

const raycaster = new THREE.Raycaster();

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(1));
scene.add(houseMesh);

const tangramObjs = [];
tangramObjs.push(p1);
tangramObjs.push(p2);
tangramObjs.push(p3);
tangramObjs.push(p4);
tangramObjs.push(p5);
tangramObjs.push(p6);
tangramObjs.push(p7);
tangramObjs.forEach((c) => scene.add(c));

// LIGHT

const light = new THREE.PointLight();
light.position.set(10, 10, 10);
scene.add(light);

// CAMERA

var frustumHeight = 6;
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.OrthographicCamera(
  (-frustumHeight * aspect) / 2,
  (frustumHeight * aspect) / 2,
  frustumHeight / 2,
  -frustumHeight / 2,
  0.1,
  100
);
camera.position.x = 1;
camera.position.y = 0;
camera.position.z = 1;

// RENDERER

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CONTROLS

const controls = new DragControls(tangramObjs, camera, renderer.domElement);
const pointer = new THREE.Vector2();

// EVENTS

window.addEventListener("resize", onWindowResize, false);
window.addEventListener("wheel", onMouseWheel);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("mouseup", onHandleDrop);

// EVENT FUNCS
function onHandleDrop() {
  const tangramPos = [];
  for (let obj of tangramObjs) {
    let gp = obj.geometry.attributes.position;
    let wPos = [];
    for (let i = 0; i < gp.count; i++) {
      let p = new THREE.Vector3().fromBufferAttribute(gp, i); // set p from `position`
      obj.localToWorld(p);
      wPos.push([p.x, p.y]);
    }
    tangramPos.push(wPos);
  }

  let gp = houseMesh.geometry.attributes.position;
  let houseMeshPos = [];
  for (let i = 0; i < gp.count; i++) {
    let p = new THREE.Vector3().fromBufferAttribute(gp, i); // set p from `position`
    houseMesh.localToWorld(p);
    houseMeshPos.push([p.x, p.y]);
  }

  let totalArea = 0;
  let intersectionArea = 0;

  for (let pol of tangramPos) {
    totalArea += area(pol);
    intersectionArea += area(weilerAtherton(pol, houseMeshPos));
    for (let pol2 of tangramPos) {
      intersectionArea -= area(weilerAtherton(pol, pol2)) / 2;
    }
  }

  if (intersectionArea / (totalArea < 0.1 ? 1000 : totalArea) > 0.9) {
    console.log("Win");
  }
}

function onWindowResize() {
  const newAspect = window.innerWidth / window.innerHeight;

  camera.left = (frustumHeight * newAspect) / -2;
  camera.right = (frustumHeight * newAspect) / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function onPointerMove(event) {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseWheel(event) {
  const intersects = raycaster.intersectObjects(tangramObjs, true);
  if (intersects.length > 0) {
    const currObj = intersects[0].object;
    rotateObject(currObj, event.deltaY);
  } else {
    camera.zoom -= 0.001 * event.deltaY;
    camera.updateProjectionMatrix();
  }
}

// ROTATION FUNCS

function rotateObject(obj, value) {
  const center = getCenterPoint(obj);
  const zAxis = new THREE.Vector3(0, 0, 1);
  rotateAboutPoint(obj, center, zAxis, (0.002 * value) / (2 * Math.PI), true);
}

function getCenterPoint(mesh) {
  var middle = new THREE.Vector3();
  var geometry = mesh.geometry;

  geometry.computeBoundingBox();

  middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
  middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
  middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

  mesh.localToWorld(middle);
  return middle;
}

function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
  if (pointIsWorld) {
    obj.parent.localToWorld(obj.position);
  }

  obj.position.sub(point);
  obj.position.applyAxisAngle(axis, theta);
  obj.position.add(point);

  if (pointIsWorld) {
    obj.parent.worldToLocal(obj.position);
  }
  obj.rotateOnAxis(axis, theta);
}

// BASE FUNCS

function render() {
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

animate();