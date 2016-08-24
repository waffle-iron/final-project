const ChiasmLeaflet = require('./chiasm-leaflet');
const Model = require('model-js');
const L = require('leaflet');
const d3 = require('d3');

function BubbleMap() {
  const latitudeColumn = 'latitude';
  const longitudeColumn = 'longitude';

  const my = ChiasmLeaflet();



  var MyCustomMarker = L.Marker.extend({

      bindPopup: function(htmlContent, options) {

      if (options && options.showOnMouseOver) {

        // call the super method
        L.Marker.prototype.bindPopup.apply(this, [htmlContent, options]);

        // unbind the click event
        this.off("click", this.openPopup, this);

        // bind to mouse over
        this.on("mouseover", function(e) {

          // get the element that the mouse hovered onto
          var target = e.originalEvent.fromElement || e.originalEvent.relatedTarget;
          var parent = this._getParent(target, "leaflet-popup");

          // check to see if the element is a popup, and if it is this marker's popup
          if (parent == this._popup._container)
            return true;

          // show the popup
          this.openPopup();

        }, this);

        // and mouse out
        this.on("mouseout", function(e) {

          // get the element that the mouse hovered onto
          var target = e.originalEvent.toElement || e.originalEvent.relatedTarget;

          // check to see if the element is a popup
          if (this._getParent(target, "leaflet-popup")) {

            L.DomEvent.on(this._popup._container, "mouseout", this._popupMouseOut, this);
            return true;

          }

          // hide the popup
          this.closePopup();

        }, this);

      }

    },

    _popupMouseOut: function(e) {

      // detach the event
      L.DomEvent.off(this._popup, "mouseout", this._popupMouseOut, this);

      // get the element that the mouse hovered onto
      var target = e.toElement || e.relatedTarget;

      // check to see if the element is a popup
      if (this._getParent(target, "leaflet-popup"))
        return true;

      // check to see if the marker was hovered back onto
      if (target == this._icon)
        return true;

      // hide the popup
      this.closePopup();

    },

    _getParent: function(element, className) {

      var parent = element.parentNode;

      while (parent != null) {

        if (parent.className && L.DomUtil.hasClass(parent, className))
          return parent;

        parent = parent.parentNode;

      }

      return false;

    }

  });



  my.when('data', (data) => {
    my.cleanData = data.filter((d) => {
      const lat = d[latitudeColumn];
      const lng = d[longitudeColumn];
      if (isNaN(+lat) || isNaN(+lng)) {
        console.log(`lat:${lat} + lng:${lng} Invalid.`);
        return false;
      }
      return true;
    });
  });
  my.addPublicProperties({
    rColumn: Model.None,
    rDefault: 3,
    rMin: 0,
    rMax: 10,
  });
  const rScale = d3.scale.sqrt();

  const canvasTiles = L.tileLayer.canvas();
  canvasTiles.drawTile = (canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(240,60,2, 0.03)';
    ctx.fillRect(50, 100, canvas.width, canvas.height*2);
  };
  canvasTiles.addTo(my.map);
  canvasTiles.bringToBack();
  my.when(['datasetForScaleDomain', 'rColumn', 'rDefault', 'rMin', 'rMax'],
      (dataset, rColumn, rDefault, rMin, rMax) => {
        const data = dataset.data;
        if (rColumn === Model.None) {
          my.r = () => rDefault;
        } else {
          rScale
            .domain(d3.extent(data, (d) => d[rColumn]))
            .range([rMin, rMax]);
          my.r = (d) => rScale(d[rColumn]);
        }
      });

  let oldMarkers = [];
  const locationRandomizer = [];
  const randomizer = (object) => {
    const tempObj = object;
    if (!locationRandomizer.includes(tempObj)) {
      tempObj.latitude += Math.random(0, 500);
      tempObj.longitude += Math.random(0, 500);
      locationRandomizer.push(tempObj);
    }
  };

  my.when(['cleanData', 'r'], _.throttle((data, r) => {
    oldMarkers.forEach((marker) => {
      my.map.removeLayer(marker);
    });
    oldMarkers = data.map((daData) => {
      randomizer(daData);
      const lat = locationRandomizer[locationRandomizer.indexOf(daData)].latitude;
      const lng = locationRandomizer[locationRandomizer.indexOf(daData)].longitude;
      const aniType = locationRandomizer[locationRandomizer.indexOf(daData)].type;
      // console.log(aniType);
      const markerCenter = L.latLng(lat, lng);
      let circleMarker;
      if(aniType==='land'){
        circleMarker = L.circleMarker(markerCenter, {

          color: '#FF4136',
          weight: 2,
          clickable: true,
        });
        circleMarker.bindPopup(daData.common_name);
        circleMarker.setRadius(r(daData));
        circleMarker.addTo(my.map);
      }
      else if(aniType==='air'){
        circleMarker = L.circleMarker(markerCenter, {
          color: 'yellow',
          weight: 2,
          clickable: true,
        });
        circleMarker.bindPopup(daData.common_name);
        circleMarker.setRadius(r(daData));
        circleMarker.addTo(my.map);
      }
      else if(aniType==='marine'){
        circleMarker = L.circleMarker(markerCenter, {
          color: 'lightblue',
          weight: 2,
          clickable: true,
        });
        circleMarker.bindPopup(daData.common_name);
        circleMarker.setRadius(r(daData));
        circleMarker.addTo(my.map);
      }
      else{

      }

      // circleMarker.bindPopup(daData.common_name);
      // circleMarker.setRadius(r(daData));
      // circleMarker.addTo(my.map);
      return circleMarker;
    });
  }, 100));
  return my;
}
module.exports = BubbleMap;
