import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import * as axios from "axios";
import {extrudeGeoJSON} from 'geometry-extrude';
import * as randomColor from 'randomColor';
import OrderLineUtil from "../module/OrderLineUtil";

const map = new maptalks.Map('map', {
    // center : [116.1822762440612, 39.926143877394885],
    center : [121.48505486216655, 31.258584413770077],
    zoom   :  15,
    pitch : 70,
    bearing : 180,
    centerCross : true,
    doubleClickZoom : false,
    baseLayer : new maptalks.TileLayer('tile',{
        urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a','b','c','d'],
        attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
    })
});

axios.get('data/antbuildrect.geojson')
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
            var me = this;
            var light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, -10, 10).normalize();
            scene.add(light);
            features.forEach(function (g) {
                var heightPerLevel = 10;
                var levels = g.properties.levels || 1;
                var color = getColor(levels);
                var m = new THREE.MeshPhongMaterial({color: color, opacity : 0.7});
                //change to back side with THREE <= v0.94
                // m.side = THREE.BackSide;
                var mesh = me.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), levels * heightPerLevel, m, levels * heightPerLevel);
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

axios.get('data/antroadrect.geojson')
    .then(function (response) {

        var threeLayer = new ThreeLayer('r', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });
        let data = response.data;
        var json = data


        threeLayer.prepareToDraw = function (renderer, scene, camera) {

            //'#ff0'
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.MeshStandardMaterial({color: randomColor()});

            let orderLineUtil = new OrderLineUtil();
            orderLineUtil.json = json;
            orderLineUtil.me = this;
            json = orderLineUtil.getConvertGeoJson();

            const {polyline} = extrudeGeoJSON(json, {
                depth: 0.01,
                lineWidth: 0.01,
                bevelSize: 0.01
            });
            const {position, normal, indices} = polyline;

            let float32BufferAttribute = new THREE.Float32BufferAttribute(position, 3);
            geometry.addAttribute('position', float32BufferAttribute);
            geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
            geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
            // geometry.computeBoundingSphere();

            const mesh = new THREE.Mesh(geometry, material);
            //mesh.position.copy(new Vector3().fromBufferAttribute(float32BufferAttribute,1))
            // function animate() {
            //     requestAnimationFrame(animate);
            //     renderer.render(scene, camera);
            // }
            scene.add(mesh);
        };

        // animate();
        threeLayer.addTo(map);

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
