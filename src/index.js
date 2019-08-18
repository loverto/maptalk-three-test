import * as THREE from 'three';
import {
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Mesh,
    MeshPhongMaterial,
    Uint32BufferAttribute
} from 'three';
import * as maptalks from 'maptalks';
import {ThreeLayer} from 'maptalks.three';
import * as axios from "axios";
import {extrudeGeoJSON} from 'geometry-extrude';
import * as randomColor from 'randomColor';
import OrderLineUtil from "../module/OrderLineUtil";
import Drone from "../module/ClaraModule";
import {flattenEach} from "@turf/meta";
import {getCoords} from "@turf/invariant";
import {cleanCoords} from "@turf/turf";

const map = new maptalks.Map('map', {
    // center : [116.1822762440612, 39.926143877394885],
    // center : [121.48505486216655, 31.258584413770077],
    center : [116.29079055786133, 39.86473846435547],
    zoom   :  15,
    pitch : 70,
    bearing : 180,
    centerCross : true,
    doubleClickZoom : false,
    baseLayer : new maptalks.TileLayer('tile',{
        urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        // urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a','b','c','d'],
        attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
    })
});

axios.get('data/bjbuild.geojson')
    .then(function (response) {
        var buildings = response.data
// features to draw
        var features = buildings.features;
        // buildings.forEach(function (b) {
        //     features = features.concat(b.features);
        // });
// the ThreeLayer to draw buildings
        var threeLayer = new ThreeLayer('t', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });
        threeLayer.prepareToDraw = function (gl, scene, camera) {
            var renderer = gl
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
            var me = this;
            // '#ffffff'
            var light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, 50, 10).normalize();
            light.castShadow = true;
            scene.add(light);

            //Set up shadow properties for the light
            light.shadow.mapSize.width = 512;  // default
            light.shadow.mapSize.height = 512; // default
            light.shadow.camera.near = 0.5;    // default
            light.shadow.camera.far = 500;     // default

            features.forEach(function (g) {
                var heightPerLevel = 10;
                var levels = g.properties.Floor || 1;
                var color = getColor(levels);
                var m = new THREE.MeshPhongMaterial({color: color, opacity : 0.7});
                m.side = DoubleSide
                //change to back side with THREE <= v0.94
                // m.side = THREE.BackSide;
                var mesh = me.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), levels * heightPerLevel, m, levels * heightPerLevel);
                mesh.castShadow = true; //default is false
                mesh.receiveShadow = false; //default
                if (Array.isArray(mesh)) {
                    scene.add.apply(scene, mesh);
                } else {
                    scene.add(mesh);
                }
            });
        };
        threeLayer.addTo(map);
//select buildings by mouse click
        var raycaster = new THREE.Raycaster();
        document.addEventListener('click', function (event) {
            event.preventDefault();
            var mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            var objects = [];
            threeLayer.getScene().children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    objects.push(child);
                }
            })
            raycaster.setFromCamera(mouse, threeLayer.getCamera());
            var intersects = raycaster.intersectObjects(objects);
            if (intersects.length > 0) {
                console.log('Mesh : ' + intersects[0].object.uuid);
            }
        }, false);
        function getColor(level) {
            if (level < 2) {
                return 0x2685a7;
            } else if (level >= 2 && level <= 5) {
                return 0xff5733;
            } else {
                return 0xff2e00;
            }
        }

    })
    .catch(function (error) {
        console.log(error);
    });

axios.get('data/4.geojson')
    .then(function (response) {

        var threeLayer = new ThreeLayer('r', {
            forceRenderOnMoving : true,
            animation : true,
            forceRenderOnRotating : true
        });
        let data = response.data;
        // debugger
        var json = data




        threeLayer.prepareToDraw = function (renderer, scene, camera) {

            // 调整自动动画
            let threeRenderer = this.getRenderer();
            threeRenderer.needToRedraw = function(){
                return true;
            }

            //'#ff0'

            let randomColor1 = randomColor();
            // '#57ed89'
            randomColor1 = randomColor1
            const material = new MeshPhongMaterial({color: randomColor1, opacity : 0.7});
            material.side = DoubleSide

            let orderLineUtil = new OrderLineUtil();
            orderLineUtil.json = json;
            orderLineUtil.me = this;
            json = orderLineUtil.getConvertGeoJson();
            let n = json.name
            let crs = json.crs;
            let t = json.type;

            let float32BufferAttribute = {}

            const geometry = new BufferGeometry();
            const {polyline} = extrudeGeoJSON(json, {
                depth: 0.05,
                lineWidth: 0.05,
                bevelSize: 0.01
            });
            const {position, normal, indices} = polyline;



            // debugger
            float32BufferAttribute = new Float32BufferAttribute(position, 3);
            geometry.addAttribute('position', float32BufferAttribute);
            geometry.addAttribute('normal', new Float32BufferAttribute(normal, 3));
            geometry.setIndex(new Uint32BufferAttribute(indices, 1));




            // geometry.computeBoundingSphere();
            // const  line = new Line(geometry,material);

            const mesh = new Mesh(geometry, material);
            scene.add(mesh);

            // json.features.forEach(function (feature) {
            //     const geometry = new BufferGeometry();
            //
            //     // 初始化数据
            //     let j = {}
            //     j.name =n;
            //     j.crs = crs;
            //     j.type = t;
            //     j.features = []
            //     j.features.push(feature);
            //
            //     let duplicate;
            //     duplicate = function (arr) {
            //         // 法一：es6
            //         // let res = new Map();
            //         // arr.forEach(item => {
            //         //     item.sort((a, b) => a - b);
            //         //     res.set(item.join(), item);
            //         // });
            //         // return Array.from(res.values);
            //
            //         // 法二：
            //         let res={}
            //         arr.forEach(item=>{
            //             item.sort((a,b)=>a-b);
            //             res[item]=item;
            //         });
            //         return Object.values(res)
            //     };
            //
            //     flattenEach(j, function (currentFeature, featureIndex) {
            //         currentFeature.geometry.coordinates = getCoords(cleanCoords(currentFeature))
            //         let arr = currentFeature.geometry.coordinates;
            //         let b = [];
            //         b.push(arr)
            //
            //         let duplicate1 = duplicate(b);
            //         console.log("又重复数据",duplicate1,b)
            //         if (duplicate1.length<b.length){
            //         }
            //         currentFeature.geometry.coordinates = duplicate1[0]
            //         j.features[featureIndex] = currentFeature;
            //     });
            //
            //     const {polyline} = extrudeGeoJSON(j, {
            //         depth: 0.05,
            //         lineWidth: 0.05,
            //         bevelSize: 0.01
            //     });
            //     const {position, normal, indices} = polyline;
            //
            //
            //
            //     // debugger
            //     float32BufferAttribute = new Float32BufferAttribute(position, 3);
            //     geometry.addAttribute('position', float32BufferAttribute);
            //     geometry.addAttribute('normal', new Float32BufferAttribute(normal, 3));
            //     geometry.setIndex(new Uint32BufferAttribute(indices, 1));
            //
            //
            //
            //
            //     // geometry.computeBoundingSphere();
            //     // const  line = new Line(geometry,material);
            //
            //     const mesh = new Mesh(geometry, material);
            //     scene.add(mesh);
            // })

            let drone = new Drone();
            drone.loadModel(renderer, scene, camera,float32BufferAttribute)
            // mesh.drawMode = THREE.TriangleStripDrawMode;
            // mesh.drawMode = THREE.TriangleFanDrawMode;
            //mesh.position.copy(new Vector3().fromBufferAttribute(float32BufferAttribute,1))
            function animate() {
                requestAnimationFrame(animate);
                drone.update();
                //renderer.clear()
                //renderer.render(scene, camera);
            }
            // scene.add(mesh);
            animate();

        };

        threeLayer.addTo(map);

    })
    .catch(function (error) {
        console.log(error);
    });
