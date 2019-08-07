import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';
import * as axios from "axios";
import {extrudeGeoJSON} from 'geometry-extrude';
import {flattenEach} from "@turf/meta";
import {getCoords} from "@turf/invariant";
import {cleanCoords} from "@turf/turf";
import {Vector3} from "three";

const map = new maptalks.Map('map', {
    center : [116.1822762440612, 39.926143877394885],
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
//
// axios.get('data/bd.geojson')
//     .then(function (response) {
//         var buildings = response.data
// // features to draw
//         var features = buildings.features;
//         // buildings.forEach(function (b) {
//         //     features = features.concat(b.features);
//         // });
// // the ThreeLayer to draw buildings
//         var threeLayer = new ThreeLayer('t', {
//             forceRenderOnMoving : true,
//             forceRenderOnRotating : true
//         });
//         threeLayer.prepareToDraw = function (gl, scene, camera) {
//             var me = this;
//             var light = new THREE.DirectionalLight(0xffffff);
//             light.position.set(0, -10, 10).normalize();
//             scene.add(light);
//             features.forEach(function (g) {
//                 var heightPerLevel = 10;
//                 var levels = g.properties.levels || 1;
//                 var color = getColor(levels);
//                 var m = new THREE.MeshPhongMaterial({color: color, opacity : 0.7});
//                 //change to back side with THREE <= v0.94
//                 // m.side = THREE.BackSide;
//                 var mesh = me.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), levels * heightPerLevel, m, levels * heightPerLevel);
//                 if (Array.isArray(mesh)) {
//                     scene.add.apply(scene, mesh);
//                 } else {
//                     scene.add(mesh);
//                 }
//             });
//         };
//         threeLayer.addTo(map);
// //select buildings by mouse click
//         var raycaster = new THREE.Raycaster();
//         document.addEventListener('click', function (event) {
//             event.preventDefault();
//             var mouse = new THREE.Vector2();
//             mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//             mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//             var objects = [];
//             threeLayer.getScene().children.forEach(child => {
//                 if (child instanceof THREE.Mesh) {
//                     objects.push(child);
//                 }
//             })
//             raycaster.setFromCamera(mouse, threeLayer.getCamera());
//             var intersects = raycaster.intersectObjects(objects);
//             if (intersects.length > 0) {
//                 alert('Mesh : ' + intersects[0].object.uuid);
//             }
//         }, false);
//         function getColor(level) {
//             if (level < 2) {
//                 return 0x2685a7;
//             } else if (level >= 2 && level <= 5) {
//                 return 0xff5733;
//             } else {
//                 return 0xff2e00;
//             }
//         }
//
//     })
//     .catch(function (error) {
//         console.log(error);
//     });

axios.get('data/sd.geojson')
    .then(function (response) {
        debugger
        var threeLayer = new ThreeLayer('r', {
            forceRenderOnMoving : true,
            forceRenderOnRotating : true
        });
        let data = response.data;
        var json = data


        threeLayer.prepareToDraw = function (renderer, scene, camera) {
            var me = this;

            //'#ff0'
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.MeshStandardMaterial({color: 0xff0});

            function _coordProject(geo) {
                if (Array.isArray(geo[0][0])) {
                    return geo.map(function (coor) {
                        return _coordProject(coor);
                    });
                }
                if (!Array.isArray(geo[0])) {
                    return _coorConvert(geo);
                }
                return geo.map(function (coor) {
                    return _coorConvert(coor);
                });
            }
            function _coorConvert(geo) {
                var ll = me.coordinateToVector3({x:geo[0],y:geo[1]});
                return [
                    ll.x,
                    -ll.y,
                    geo[2] || 0
                ];
            }
            var geoData = [];
            var propertiesData = [];
            flattenEach(json, function (currentFeature, featureIndex) {
                var coord = getCoords(cleanCoords(currentFeature));
                let items = _coordProject(coord);
                currentFeature.geometry.coordinates = items
                geoData.push(items);
                currentFeature.properties._id = featureIndex + 1;
                propertiesData.push(currentFeature.properties);
            });

            debugger
            // 线条排序的索引，默认情况下，用第一条线段来匹配
            var idx = 0;
            // 取出的首尾坐标点
            var arr = []
            // 转换为纯数组的点
            var lanes = new Map();
            // 把匹配的数据存储为geojson格式的
            var lanesFeatures = new Map();
            // 用来存储已经排序过并连上的索引数组
            var indexs = []
            // 把数据处理为只有首尾的数据格式
            geoData.forEach(function (array) {
                arr.push([array[0],array[array.length-1]])
            })

            /**
             * 排序线段
             * @param idx 用来匹配的线段
             * @param lanes 存储只有坐标点的排序线段数据
             * @param lanesFeatures 存储geojson格式的排序线段数据
             * @param arr 处理过，只有首尾的线段点
             * @param indexs 已经排序过的线段
             */
            function orderLine(idx,lanes,lanesFeatures,arr,indexs) {
                // 获取线段脑袋
                var start = arr[idx][0];
                // 获取线段尾巴
                var end = arr[idx][1]
                // 插入默认的匹配的数据位
                lanes.set(idx,geoData[idx])
                lanesFeatures.set(idx,json.features[idx])
                indexs.push(idx)
                // 排尾部
                arr.forEach(function (value, index, array) {
                    // 如果已经排过序的，直接跳过
                    for (var i =0 ;i < indexs.length;i++){
                        if (indexs[i] == index ) {
                            return
                        }
                    }
                    // 如果两个点相同，说明是同一条线,尾首对接
                    if (end[0] == value[0][0] && end[1] == value[0][1]){
                        let newVar = lanes.get(idx);
                        if (newVar){
                            // 合并数组
                            let concat = newVar.concat(geoData[index]);
                            lanes.set(idx,concat)
                            let newVar2 = lanesFeatures.get(idx);
                            // 合并数组
                            let coordinates = json.features[index].geometry.coordinates;
                            let concat1 = newVar2.geometry.coordinates.concat(coordinates);
                            newVar2.geometry.coordinates = concat1;
                            lanesFeatures.set(idx,newVar2)
                        }else {
                            lanes.set(idx,geoData[index])
                            lanesFeatures.set(idx,json.features[index])
                        }
                        end = value[1]
                        indexs.push(index)
                    }
                })
                // 排首部
                arr.forEach(function (value, index, array) {
                    // 如果已经排过序的，直接跳过
                    for (var i =0 ;i < indexs.length;i++){
                        if (indexs[i] == index ) {
                            return
                        }
                    }
                    // 如果两个点相同，说明是同一条线,尾首对接
                    if (start[0] == value[1][0] && start[1] == value[1][1]){
                        let newVar = lanes.get(idx);
                        if (newVar){
                            // 合并数组
                            let concat = geoData[index].concat(newVar);
                            lanes.set(idx,concat)
                            let newVar2 = lanesFeatures.get(idx);
                            // 合并数组
                            let coordinates = json.features[index].geometry.coordinates;
                            let concat1 = coordinates.concat(newVar2.geometry.coordinates);
                            newVar2.geometry.coordinates = concat1;
                            lanesFeatures.set(idx,newVar2)
                        }else {
                            lanes.set(idx,geoData[index])
                            lanesFeatures.set(idx,json.features[index])
                        }
                        // lanes.unshift(geoData[index])
                        // lanesFeatures.unshift(json.features[index])
                        start = value[0]
                        indexs.push(index)
                    }
                })
            }

            /**
             * 获取下一条线段数据
             * @param arr
             * @param indexs
             */
            function getNextLane(arr,indexs) {
                for (var i = 0 ; i< arr.length;i ++) {
                    if (indexs.indexOf(i) == -1){
                        return i;
                    }
                }
                return
            }
            var x = 0;
            while (indexs.length != arr.length){
                console.log((x++))
                // 获取线段
                let nextLane = getNextLane(arr,indexs);
                idx = nextLane;
                orderLine(idx,lanes,lanesFeatures,arr,indexs)
            }








            const {polyline} = extrudeGeoJSON(json, {
                depth: 4,
                lineWidth: 0.5,
                bevelSize: 0.05
            });
            const {position, normal, indices} = polyline;

            let float32BufferAttribute = new THREE.Float32BufferAttribute(position, 3);
            geometry.addAttribute('position', float32BufferAttribute);
            geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
            geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
            geometry.computeBoundingSphere();

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(new Vector3().fromBufferAttribute(float32BufferAttribute,1))
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
