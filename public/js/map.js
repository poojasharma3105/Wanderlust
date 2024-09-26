mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map',
    style: "mapbox://styles/mapbox/streets-v12",
    center: coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});  

const popup = new mapboxgl.Popup({ offset: 25 }).setText(
    "Exact Location provided after booking." 
);

const marker = new mapboxgl.Marker({color: "red"})
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);