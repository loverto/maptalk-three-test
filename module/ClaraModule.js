// window.THREE = {}
// import * as THREE from 'imports-loader?THREE\.LegacyJSONLoader=three/examples/js/loaders/deprecated/LegacyJSONLoader!three'

import {PointLight, PointLightHelper, Vector3} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
class Drone {
    // 随机路线
    float32BufferAttribute
    // 无人机场景
    droneSence
    // 移动的点的位置
    lanes = []
    loadModel(renderer, scene, camera,float32BufferAttribute){
        var self = this;
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

            self.float32BufferAttribute = float32BufferAttribute;
            self.initLanes();
            let p = new Vector3().fromBufferAttribute(float32BufferAttribute,1);

            let scene1 = self.droneSence = gltf.scene;
            console.log(p)
            // p.x = p.x
            p.y = p.y + 100
            p.z = p.z - 10
            // 设置位置
            scene1.position.copy(p)
            //scene1.rotateOnAxis(p.x,Math.PI/4)
            scene1.rotateX(Math.PI/2)
            // 给无人机设置光源
            scene1.add(pointLight);
            var sphereSize = 10;
            var pointLightHelper = new PointLightHelper( pointLight, sphereSize );
            scene1.add(pointLightHelper);
            // 把无人机的场景加入到maptalk 所初始化的场景中
            scene.add(scene1)
            renderer.render(scene,camera)

            //renderer.autoClear = false;
            // scene.add(wm.children[1])
            // wm.translateZ(275);
            // wm.translateX(150);
            // wm.translateY(55);55

        });
    }

    /**
     * 初始化运动轨迹
     */
    initLanes(){
        for (let i = 0 ; i< 10; i++){
            const vec = new Vector3().fromBufferAttribute(this.float32BufferAttribute, 1);
            // if (this.lanes.length>1){
            //     vec.y = this.lanes[this.lanes.length-1].y-3
            // }
            vec.y = vec.y +(20*i);
            vec.z = vec.z - 10;
            this.lanes.push(vec);
        }
        console.log(this.lanes);
    }

    update(){
        // 开始运动轨迹
        for (let i = 0 ;i < this.lanes.length;i++){
            let lane = this.lanes[i];
            // lane.y = lane.y + 100
            // lane.z = lane.z - 10
            this.droneSence.position.copy(lane);
            console.log(this.droneSence.position)
        }
        // 再飞回来
        for (let i = this.lanes.length -1 ;i > 0 ;i--){
            let lane = this.lanes[i];
            // lane.y = lane.y + 100
            // lane.z = lane.z - 10
            this.droneSence.position.copy(lane);
        }
        // if (this.lanes.length >0){
        //     // 位置重置为起点
        //     let lane1 = this.lanes[0];
        //     lane1.y = lane1.y + 100
        //     lane1.z = lane1.z - 10
        //     this.droneSence.position.copy(lane1)
        //     console.log(this.droneSence.position)
        // }

    }

}

export default Drone
