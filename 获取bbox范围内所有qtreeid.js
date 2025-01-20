
import * as Cesium from 'cesium'


function get4326zxy(params) {

  console.log(params);

  let result = {
    start: {
      x: 0,
      y: 0,
    },
    xcount: 0,
    ycount: 0,
  }

  // 定义地理范围 (经度和纬度)
  const west = params.bbox.left; // 最小经度
  const south = params.bbox.bottom;  // 最小纬度
  const east = params.bbox.right; // 最大经度
  const north = params.bbox.top;  // 最大纬度
  
  // 指定瓦片层级 (Z)
  const zoomLevel = params.level - 1;
  
  // 使用 WebMercatorTilingScheme
  const tilingScheme = new Cesium.GeographicTilingScheme();
  // const tilingScheme = new Cesium.WebMercatorTilingScheme();
  
  // 计算瓦片范围
  const southwest = Cesium.Cartographic.fromDegrees(west, south);
  const northeast = Cesium.Cartographic.fromDegrees(east, north);
  
  const southwestTile = tilingScheme.positionToTileXY(southwest, zoomLevel);
  const northeastTile = tilingScheme.positionToTileXY(northeast, zoomLevel);
  
  if (southwestTile && northeastTile) {
      console.log(`Zoom Level: ${zoomLevel}`);
      console.log(`Tile Range:`);
      console.log(`X: ${southwestTile.x} to ${northeastTile.x}`);
      console.log(`Y: ${southwestTile.y} to ${northeastTile.y}`);
  } else {
      console.error("无法计算瓦片索引，请检查范围和层级。");
  }


  result.start.x = southwestTile.x
  result.start.y = northeastTile.y
  result.xcount = northeastTile.x - southwestTile.x + 1
  result.ycount = southwestTile.y - northeastTile.y + 1

  console.log(result);

  return result
}





function getid(params) {

  let res4326 = get4326zxy(params)

  let result = {
    potree: [

    ],
    total: 0,
    xcount: 0,
    ycount: 0,
    xstart: 0,
    ystart: 0
  }

  function getTileSubAddress(x, y) {
    const subCol = x % 2;
    const subRow = y % 2;
    return (subCol | (subRow << 1)) ^ subRow;
  }

  function calculateTileAddress(lat, lon, zoom,zxy) {
    let s = '';
    for (let z = 0; z <= zoom; z++) {
      const zoomPower = Math.pow(2, z);
      const tileGeoSize = 360 / zoomPower;
      const x = Math.floor((lon - rcValidBounds.left) / tileGeoSize);
      const y = Math.floor((lat - rcValidBounds.bottom) / tileGeoSize);
      zxy.x = x
      zxy.y = y
      s += getTileSubAddress(x, y);
    }
  
    return s;
  }

  let rcBound = {
    left: 113.537628,
    right: 113.568816,
    top: 34.818287,
    bottom: 34.797651,
  };

  rcBound = params.bbox

  let zoomStart = 16; // I found out that it is effective from level 4 onwards.
  let zoomEnd = 16; // inclusive

  zoomStart = params.level
  zoomEnd = params.level

  const rcValidBounds = {
    left: -180.0,
    right: 180.0,
    top: 180.0,
    bottom: -180.0,
  };

  for (let zoom = zoomStart; zoom <= zoomEnd; zoom++) {
    // Get the geographic size of the tile at the specified level.
    const zoomPower = Math.pow(2, zoom);
    const tileGeoSize = 360 / zoomPower;

    const colLeft = Math.floor((rcBound.left - rcValidBounds.left) / tileGeoSize);
    let colCount = Math.ceil((rcBound.right - rcBound.left) / tileGeoSize);
    const rowBottom = Math.floor((rcBound.bottom - rcValidBounds.bottom) / tileGeoSize);
    let rowCount = Math.ceil((rcBound.top - rcBound.bottom) / tileGeoSize);

    colCount = res4326.xcount
    rowCount = res4326.ycount

    const progressTotal = rowCount * colCount;
    result.total = progressTotal
    result.xcount = colCount
    result.ycount = rowCount
    result.xstart = colLeft
    result.ystart = rowBottom
    let progressCurrent = 0;

    for (let x = 0; x < colCount; x++) {
      for (let y = 0; y < rowCount; y++) {
          progressCurrent++;
          const dStartLon = (colLeft + x) * tileGeoSize + rcValidBounds.left;
          const dStartLat = (rowBottom + y) * tileGeoSize + rcValidBounds.bottom;
          let zxy = {
            z:zoom - 1,
            x:0,
            y:0,
          }
          const tileAddress = calculateTileAddress(dStartLat, dStartLon, zoom, zxy);
          zxy.y = res4326.start.y + result.ycount - y  - 1
          result.potree.push(
            {
              id:tileAddress + '',
              zxy: zxy
            }
          )
      } // for y
    } // for x
  }
  return result
}

// getid()

export { getid }