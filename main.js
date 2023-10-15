import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { Character } from './src/character';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import { CreateEnvironmnet } from './src/environmnet';
import { degToRad } from 'three/src/math/MathUtils';
// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.rotateX(degToRad(90));
const renderer = new THREE.WebGLRenderer();
let started = false;
scene.fog = new THREE.Fog(0xa0a0a0, 10, 20);
//Loader Manager
const manager = new THREE.LoadingManager();

//loaders
const fbxLoader = new FBXLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);
const rgbeLoader = new RGBELoader(manager); //Loader used to load our hdr

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;

// Lights
const ambientLigth = new THREE.AmbientLight('white', 0.5)
scene.add(ambientLigth)

const directionalLight = new THREE.DirectionalLight('white', 1);
directionalLight.position.set(0, 4, 0);
scene.add(directionalLight);

const light = new THREE.PointLight('white', 100, 100);
light.castShadow = true;
light.position.set(3, 10, 3);
scene.add(light);


// Cannon settings
const world = new CANNON.World();
const cannonDebugger = new CannonDebugger(scene, world, {})
world.gravity.set(0, -20, 0);
const groundBody = new CANNON.Body({
    mass: 0,
    material: new CANNON.Material()

});
const groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
groundBody.material.friction = 0;
const quat = new CANNON.Quaternion();
quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
groundBody.quaternion = quat;
world.addBody(groundBody);
let character = null;
//new Character(scene, world, camera, renderer, manager);
//Load HDRI
rgbeLoader.load('other/sky.hdr', texture => {

    //Get ready our hdri
    const generator = new THREE.PMREMGenerator(renderer)
    const envMap = generator.fromEquirectangular(texture).texture;

    scene.background = envMap
    texture.dispose()
    generator.dispose()
})

fbxLoader.load('models/environment.fbx',
    async (object) => {
        CreateEnvironmnet(object, textureLoader, scene, world)
    },
    (error) => {
        console.log(error)
    }
)

let lastTime;
function animate(time) {
    requestAnimationFrame(animate);
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    if (started) {

        world.step(1 / 60);
        //cannonDebugger.update()
        character?.update(deltaTime);

        renderer.render(scene, camera);
    }
}

animate(0);

function init() {
    started = true;
    document.querySelector('.bg').style.display = 'none';
}
manager.onProgress = function (item, loaded, total) {
    const progress = (loaded / total) * 100;
    const bar = document.querySelector('.loading-percentage')
    bar.style.width = `${progress}%`;
    console.log("Loading progress: " + progress);
    if (progress === 100) {
        console.log("Ready: " + progress);
        init();
    }
};

document.querySelector('#btn-public-room').addEventListener('click', joinPublicRoom)
function joinPublicRoom() {
    document.querySelector('.main').classList.add('hide')
    character = new Character(scene, world, camera, renderer, manager);
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    character?.resize();

}