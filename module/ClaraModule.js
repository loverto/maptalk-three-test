// window.THREE = {}
// import * as THREE from 'imports-loader?THREE\.LegacyJSONLoader=three/examples/js/loaders/deprecated/LegacyJSONLoader!three'

import {PointLight} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
class Drone {
    loadModel(renderer, scene, camera){
        var objectLoader = new GLTFLoader();
        objectLoader.load("data/Drone.gltf", function (gltf) {
            console.log("scene",scene)
            console.log("gltf",gltf)
            // wm.traverse(function (object) {
            //     scene.add(object)
            // })
            // debugger

            const pointLight = new PointLight('yellow', 10, 5000);

            gltf.scene.add(pointLight);
            scene.add(gltf.scene)
            //renderer.render(wm,camera)

            //renderer.autoClear = false;
            // scene.add(wm.children[1])
            // wm.translateZ(275);
            // wm.translateX(150);
            // wm.translateY(55);55

        });
    }

}

export default Drone
