
// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5vdmFrIiwiYSI6ImNsa2Zyd2ZvdjFjbHAzaW8zNnd4ODkwaHcifQ.V-0D14XZBY5lfMfw8Qg7vg';

var map = new mapboxgl.Map({
    container: 'mapView',
    style: 'mapbox://styles/anovak/clr4tt9ns00j601r85izo5ouy', // Replace with your style URL if needed
    center: [-98.5795, 39.8283], // Starting position [lng, lat]
    zoom: 3 // Starting zoom
});


map.on('load', function() {
    // Add a new source from our GeoJSON data for ski resorts and set the
    // 'cluster' option to true.
    const pulsingDot = {
        width: 5,
        height: 5,
        data: new Uint8Array(5 * 5 * 4),
     
        onAdd: function() {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            this.context = canvas.getContext('2d');
        },
     
        render: function() {
            const duration = 1000;
            const t = (performance.now() % duration) / duration;
     
            const radius = (this.width / 2) * 0.3;
            const outerRadius = (this.width / 2) * 0.7 * t + radius;
     
            this.context.clearRect(0, 0, this.width, this.height);
     
            this.context.beginPath();
            this.context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
            this.context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
            this.context.fill();
     
            this.context.beginPath();
            this.context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
            this.context.fillStyle = 'rgba(255, 100, 100, 1)';
            this.context.fill();
     
            this.data = this.context.getImageData(0, 0, this.width, this.height).data;
     
            return true;
        },
     
        getSize: function() {
            return [this.width, this.height];
        }
     };

     map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

    map.addSource('skiResorts', {
        type: 'geojson',
        data: 'data/NorthAmericaSkiResorts.geojson', // Replace with the path to your GeoJSON
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 20 // Radius of each cluster when clustering points (defaults to 50)
    });
   
    // Add a new source for offices without clustering
    map.addSource('offices', {
        type: 'geojson',
        data: 'data/offices.geojson' // Replace with the path to your offices GeoJSON
    });

    // Add a layer for ski resort clusters
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'skiResorts',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#d2b22a',
                10,
                '#d2b22a',
                30,
                '#d2b22a'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
    
            ]
        }
    });

    // Add a layer for the unclustered ski resorts
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'skiResorts',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#d2b22a',
            'circle-radius': 4,

        }
    });

    map.addLayer({
        id: 'pulsing-offices',
        type: 'symbol',
        source: 'offices',
        layout: {
            'icon-image': 'pulsing-dot',
            'icon-size': 1
        }
     });
    // Add a layer for offices using the offices icon
    map.addLayer({
        id: 'offices',
        type: 'symbol',
        source: 'offices',
        layout: {
            'icon-image': 'offices', // This should match the name of your uploaded icon
            'icon-size': 1.25 // Adjust the size of the icon
        }
    });



   

    // inspect a cluster on click
    map.on('click', 'clusters', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        var clusterId = features[0].properties.cluster_id;
        map.getSource('skiResorts').getClusterExpansionZoom(
            clusterId,
            function (err, zoom) {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
    });
});