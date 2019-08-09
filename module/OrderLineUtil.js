import {flattenEach} from "@turf/meta";
import {getCoords} from "@turf/invariant";
import {cleanCoords} from "@turf/turf";

class OrderLineUtil {

    json = {}
    me = {}

    /**
     * 工作坐标
     * @param geo geojson格式的条目
     * @returns {*}
     * @private
     */
    _coordProject(geo) {
        if (Array.isArray(geo[0][0])) {
            return geo.map(function (coor) {
                return this._coordProject(coor);
            });
        }
        if (!Array.isArray(geo[0])) {
            return this._coorConvert(geo);
        }
        return geo.map(function (coor) {
            return this._coorConvert(coor);
        },this);
    }

    /**
     *  坐标转换
     * @param geo geojson格式的条目
     * @returns {*[]}
     * @private
     */
    _coorConvert(geo) {
        if (this.me) {
            // 转换为 three.js 坐标
            var ll = this.me.coordinateToVector3({x: geo[0], y: geo[1]});
            return [
                ll.x,
                ll.y,
                geo[2] || 0
            ];

        } else {
            return [
                geo[0],
                geo[1],
                geo[2] || 0
            ];
        }
        // if (isNaN(ll.x ) || isNaN(ll.y)){
        //     debugger
        // }
        // 原坐标


    }

    geoData = [];
    propertiesData = [];
    start = [];
    end = [];


    /**
     * 获取threejs maptalk 能用的
     */
    getConvertGeoJson(){
        var self = this;
        flattenEach(this.json, function (currentFeature, featureIndex) {
            var coord = getCoords(cleanCoords(currentFeature));
            let items = self._coordProject(coord);
            currentFeature.geometry.coordinates = items
            self.json.features[featureIndex] = currentFeature;
            self.geoData.push(items);
        });
        return this.json
    }


    /**
     * 获取排序后的geojson
     */
    getOrderGeoJson() {
        var self = this;
        flattenEach(this.json, function (currentFeature, featureIndex) {
            var coord = getCoords(cleanCoords(currentFeature));
            let items = self._coordProject(coord);
            currentFeature.geometry.coordinates = items
            self.json.features[featureIndex] = currentFeature;
            self.geoData.push(items);
            currentFeature.properties._id = featureIndex + 1;
            self.propertiesData.push(currentFeature.properties);
        });

        // 线条排序的索引，默认情况下，用第一条线段来匹配
        var idx = 0;
        // 取出的首尾坐标点
        var arr = []
        // 转换为纯数组的点
        var lanes = new Map();
        // 把匹配的数据存储为geojson格式的
        var lanesFeatures = new Map();
        // 用来存储已经排序过并连上的索引数组
        var indexs = new Set()
        // 把数据处理为只有首尾的数据格式
        this.geoData.forEach(function (array) {
            arr.push([array[0], array[array.length - 1]])
        })



        var x = 0;

        while (indexs.size != arr.length) {
            console.log((x++))
            // 获取线段
            let nextLane = this.getNextLane(arr, indexs);
            idx = nextLane;
            this.orderLine(idx, lanes, lanesFeatures, arr, indexs)
        }

        var geoJson = {}
        geoJson.features = [...lanesFeatures.values()]
        geoJson.type = 'FeatureCollection'

        flattenEach(geoJson, function (currentFeature, featureIndex) {
            var coord = getCoords(cleanCoords(currentFeature));
            currentFeature.geometry.coordinates = coord
            geoJson.features[featureIndex] = currentFeature;
        });

        return geoJson;
    }

    /**
     * 排序线段
     * @param idx 用来匹配的线段
     * @param lanes 存储只有坐标点的排序线段数据
     * @param lanesFeatures 存储geojson格式的排序线段数据
     * @param arr 处理过，只有首尾的线段点
     * @param indexs 已经排序过的线段
     */
    orderLine(idx, lanes, lanesFeatures, arr, indexs) {

        if (indexs.size == 0 || !indexs.has(idx)) {
            // 获取线段脑袋
            this.start = arr[idx][0];
            // 获取线段尾巴
            this.end = arr[idx][1]
            // 插入默认的匹配的数据位
            lanes.set(idx, this.geoData[idx])
            lanesFeatures.set(idx, this.json.features[idx])
            indexs.add(idx)
        }
        let factor = 0;
        // 排尾部
        arr.forEach(function (value, index, array) {
            // 如果已经排过序的，直接跳过
            if (indexs.has(index)) {
                return;
            }

            // for (var i =0 ;i < indexs.length;i++){
            //     if (indexs[i] == index ) {
            //         return
            //     }
            // }
            // 如果两个点相同，说明是同一条线,尾首对接

            if (Math.abs(this.end[0] - value[0][0]) <= factor && Math.abs(this.end[1] - value[0][1]) <= factor) {
                let newVar = lanes.get(idx);
                if (newVar) {
                    // 合并数组
                    let concat = newVar.concat(this.geoData[index]);
                    lanes.set(idx, concat)
                    let newVar2 = lanesFeatures.get(idx);
                    // 合并数组
                    let coordinates = this.json.features[index].geometry.coordinates;
                    let concat1 = newVar2.geometry.coordinates.concat(coordinates);
                    newVar2.geometry.coordinates = concat1;
                    lanesFeatures.set(idx, newVar2)
                } else {
                    lanes.set(idx, this.geoData[index])
                    lanesFeatures.set(idx, this.json.features[index])
                }
                this.end = value[1]
                indexs.add(index)
                // 如果匹配到线段，继续匹配
                this.orderLine(idx, lanes, lanesFeatures, arr, indexs)
            } else {
                // 如果没有匹配到，说明，没有，则开始另一条线路的匹配
                return;
            }
        },this)
        // 排首部
        arr.forEach(function (value, index, array) {
            // 如果已经排过序的，直接跳过
            if (indexs.has(index)) {
                return;
            }

            // for (var i =0 ;i < indexs.length;i++){
            //     if (indexs[i] == index ) {
            //         return
            //     }
            // }

            // 如果两个点相同，说明是同一条线,首尾对接
            if (Math.abs(this.start[0] - value[1][0]) <= factor && Math.abs(this.start[1] - value[1][1]) <= factor) {
                let newVar = lanes.get(idx);
                if (newVar) {
                    // 合并数组
                    let concat = this.geoData[index].concat(newVar);
                    lanes.set(idx, concat)
                    let newVar2 = lanesFeatures.get(idx);
                    // 合并数组
                    let coordinates = this.json.features[index].geometry.coordinates;
                    let concat1 = coordinates.concat(newVar2.geometry.coordinates);
                    newVar2.geometry.coordinates = concat1;
                    lanesFeatures.set(idx, newVar2)
                } else {
                    lanes.set(idx, this.geoData[index])
                    lanesFeatures.set(idx, this.json.features[index])
                }
                // lanes.unshift(geoData[index])
                // lanesFeatures.unshift(json.features[index])
                this.start = value[0]
                indexs.add(index)
                // 如果匹配到线段，继续匹配
                this.orderLine(idx, lanes, lanesFeatures, arr, indexs)
            } else {
                return;
            }
        },this)
    }

    /**
     * 获取下一条线段数据
     * @param arr
     * @param indexs
     */
    getNextLane(arr, indexs) {
        for (var i = 0; i < arr.length; i++) {
            if (!indexs.has(i)) {
                return i;
            }
        }
        return
    }
}

export default OrderLineUtil
