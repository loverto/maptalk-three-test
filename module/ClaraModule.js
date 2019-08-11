// window.THREE = {}
// import * as THREE from 'imports-loader?THREE\.LegacyJSONLoader=three/examples/js/loaders/deprecated/LegacyJSONLoader!three'

import {PointLight} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
class Drone {
    loadModel(renderer, scene, camera,p){
        var objectLoader = new GLTFLoader();
        objectLoader.load("data/Drone.gltf", function (gltf) {
            console.log("scene",scene)
            console.log("gltf",gltf)
            // wm.traverse(function (object) {
            //     scene.add(object)
            // })
            // debugger

            // 给无人机添加 点照光源，颜色为黄色
            const pointLight = new PointLight('yellow', 10, 5000);

            let scene1 = gltf.scene;
            // 设置位置
            scene1.position.copy(p)
            // 给无人机设置光源
            scene1.add(pointLight);
            // 把无人机的场景加入到maptalk 所初始化的场景中
            scene.add(scene1)
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
