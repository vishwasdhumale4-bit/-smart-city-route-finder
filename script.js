const MAPBOX_TOKEN = "pk.eyJ1IjoidmlzaHdhczEyMzQiLCJhIjoiY211aWF4MW9oMTh1bDJ5czU0bDJpamx0NyJ9.ldtO7g8hDYoJxQd6BHmU0g";

let map;
let markers = [];
let roadLines = [];
let shortestRouteLine = null;

const locations = {
    "College": [18.5204, 73.8567],
    "Market": [18.5260, 73.8500],
    "Hospital": [18.5300, 73.8600],
    "Bus Stand": [18.5150, 73.8500],
    "Railway Station": [18.5280, 73.8740],
    "Airport": [18.5793, 73.9089]
};

const roads = [
    ["College", "Market", 4],
    ["College", "Bus Stand", 2],
    ["Market", "Hospital", 3],
    ["Market", "Railway Station", 5],
    ["Bus Stand", "Railway Station", 4],
    ["Railway Station", "Airport", 6]
];


function initializeMap() {

    map = L.map("map").setView(
        [18.5350, 73.8650],
        13
    );

  L.tileLayer(
    'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3z2a_1_e3063e6489747f559ad8d73e',
    {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
    }
).addTo(map);


    // Add location markers

    for (let name in locations) {

        const marker = L.marker(
            locations[name]
        )
        .addTo(map)
        .bindPopup(
            "<b>" + name + "</b><br>City Location"
        );

        markers.push(marker);
    }


    // Draw demo graph roads

    roads.forEach(function(road) {

        const from = road[0];
        const to = road[1];
        const distance = road[2];

        const line = L.polyline(
            [
                locations[from],
                locations[to]
            ],
            {
                weight: 3,
                opacity: 0.5
            }
        )
        .addTo(map)
        .bindTooltip(
            distance + " km"
        );

        roadLines.push(line);
    });
}


function showPage(pageName) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function(page) {

        page.classList.remove(
            "active-page"
        );

    });


    const selectedPage =
        document.getElementById(pageName);

    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    const titles = {

        dashboard: "Dashboard",

        route: "Find Route",

        bfs: "BFS Traversal",

        dfs: "DFS Traversal",

        locations: "Locations",

        roads: "Roads"

    };


    const title =
        document.getElementById("page-title");

    if (title) {

        title.innerText =
            titles[pageName];

    }


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(function(item) {

        item.classList.remove("active");

    });

    if (event && event.currentTarget) {

        event.currentTarget.classList.add(
            "active"
        );

    }
}


// =====================================
// FIND REAL ROUTE
// =====================================

async function findRoute() {

    const source =
        document.getElementById("source").value;

    const destination =
        document.getElementById("destination").value;

    const result =
        document.getElementById("routeResult");

    if (source === destination) {

        result.innerHTML = `
            <h3>Invalid Route</h3>
            <p>
                Source and destination cannot be same.
            </p>
        `;

        return;
    }

    result.innerHTML = `
        <h3>Calculating Route...</h3>
        <p>
            Running Dijkstra algorithm in C++...
        </p>
    `;

    try {

        const url =
            `http://localhost:8080/api/route?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Server error: " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message || "Route not found"
            );
        }

        result.innerHTML = `
            <h3>Shortest Route Found</h3>

            <p class="route-path">
                ${data.path.join(" → ")}
            </p>

            <p>
                <strong>Distance:</strong>
                ${data.distance} km
            </p>

            <p>
                <strong>Algorithm:</strong>
                ${data.algorithm}
            </p>

            <p>
                <strong>Source:</strong>
                ${data.source}
            </p>

            <p>
                <strong>Destination:</strong>
                ${data.destination}
            </p>
        `;

        drawShortestRoute(data.path);

    }
    catch (error) {

        console.error(error);

        result.innerHTML = `
            <h3>Connection Error</h3>

            <p>
                ${error.message}
            </p>

            <p>
                Make sure the C++ API is running on
                http://localhost:8080
            </p>
        `;
    }
}

// =====================================
// DRAW REAL ROAD ROUTE
// =====================================
function drawShortestRoute(path) {

    if (shortestRouteLine !== null) {
        map.removeLayer(shortestRouteLine);
    }

    let coordinates = [];

    path.forEach(function(location) {

        if (locations[location]) {
            coordinates.push(locations[location]);
        }

    });

    if (coordinates.length < 2) {
        return;
    }

    shortestRouteLine = L.polyline(
        coordinates,
        {
            weight: 8,
            opacity: 0.9
        }
    ).addTo(map);

    map.fitBounds(
        shortestRouteLine.getBounds(),
        {
            padding: [50, 50]
        }
    );
}
function drawRealRoute(coordinates) {

    if (
        shortestRouteLine !== null
    ) {

        map.removeLayer(
            shortestRouteLine
        );

    }


    const latLngs =
        coordinates.map(function(point) {

            return [
                point[1],
                point[0]
            ];

        });


    shortestRouteLine =
        L.polyline(
            latLngs,
            {
                weight: 7,
                opacity: 0.9
            }
        ).addTo(map);


    map.fitBounds(
        shortestRouteLine.getBounds(),
        {
            padding: [40, 40]
        }
    );

}


// =====================================
// BFS
// =====================================

async function runBFS() {

    const start =
        document.getElementById("bfs-start").value;

    const result =
        document.getElementById("bfs-result");

    result.innerHTML = `
        <h3>Running BFS...</h3>
        <p>Executing Breadth First Search in C++...</p>
    `;

    try {

        const response =
            await fetch(
                `http://localhost:8080/api/bfs?source=${encodeURIComponent(start)}`
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        result.innerHTML = `
            <h3>BFS Traversal</h3>

            <div class="route-display">
                ${data.path.join(" → ")}
            </div>

            <p style="margin-top:15px">
                <strong>Algorithm:</strong>
                ${data.algorithm}
            </p>

            <p>
                <strong>Data Structure:</strong>
                Queue
            </p>
        `;

    }
    catch (error) {

        result.innerHTML = `
            <h3>Connection Error</h3>
            <p>${error.message}</p>
        `;
    }
}

// =====================================
// DFS
// =====================================

async function runDFS() {

    const start =
        document.getElementById("dfs-start").value;

    const result =
        document.getElementById("dfs-result");

    result.innerHTML = `
        <h3>Running DFS...</h3>
        <p>Executing Depth First Search in C++...</p>
    `;

    try {

        const response =
            await fetch(
                `http://localhost:8080/api/dfs?source=${encodeURIComponent(start)}`
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        result.innerHTML = `
            <h3>DFS Traversal</h3>

            <div class="route-display">
                ${data.path.join(" → ")}
            </div>

            <p style="margin-top:15px">
                <strong>Algorithm:</strong>
                ${data.algorithm}
            </p>

            <p>
                <strong>Data Structure:</strong>
                Stack
            </p>
        `;

    }
    catch (error) {

        result.innerHTML = `
            <h3>Connection Error</h3>
            <p>${error.message}</p>
        `;
    }
}

// =====================================
// START MAP
// =====================================

window.onload = function() {

    initializeMap();

};
async function searchRealLocation() {

    const input =
        document.getElementById("realLocationSearch");

    const result =
        document.getElementById("locationSearchResult");

    const query =
        input.value.trim();

    if (query === "") {

        result.innerHTML = `
            <h3>Enter Location</h3>
            <p>
                Please enter a location to search.
            </p>
        `;

        return;
    }

    result.innerHTML = `
        <h3>Searching...</h3>
        <p>
            Finding real location coordinates...
        </p>
    `;

    try {

        const url =
            `https://api.mapbox.com/search/geocode/v6/forward` +
            `?q=${encodeURIComponent(query)}` +
            `&country=IN` +
            `&limit=1` +
            `&access_token=${MAPBOX_TOKEN}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Mapbox API error: " +
                response.status
            );
        }

        const data =
            await response.json();

        if (
            !data.features ||
            data.features.length === 0
        ) {

            throw new Error(
                "Location not found."
            );
        }

        const feature =
            data.features[0];

        const coordinates =
            feature.geometry.coordinates;

        const longitude =
            coordinates[0];

        const latitude =
            coordinates[1];

        const locationName =
            feature.properties.full_address ||
            feature.properties.name ||
            query;

        map.setView(
            [latitude, longitude],
            15
        );

        L.marker(
            [latitude, longitude]
        )
        .addTo(map)
        .bindPopup(
            `<b>${locationName}</b><br>
             Latitude: ${latitude.toFixed(6)}<br>
             Longitude: ${longitude.toFixed(6)}`
        )
        .openPopup();

        result.innerHTML = `
            <h3>Location Found</h3>

            <p>
                <strong>Name:</strong>
                ${locationName}
            </p>

            <p>
                <strong>Latitude:</strong>
                ${latitude.toFixed(6)}
            </p>

            <p>
                <strong>Longitude:</strong>
                ${longitude.toFixed(6)}
            </p>
        `;

    }
    catch (error) {

        console.error(error);

        result.innerHTML = `
            <h3>Search Error</h3>

            <p>
                ${error.message}
            </p>
        `;
    }
}
let realSourceLocation = null;
let realDestinationLocation = null;
let realRouteLine = null;


async function geocodeRealLocation(query) {

    const url =
        `https://api.mapbox.com/search/geocode/v6/forward` +
        `?q=${encodeURIComponent(query)}` +
        `&country=IN` +
        `&limit=1` +
        `&access_token=${MAPBOX_TOKEN}`;

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Mapbox Geocoding Error: " +
            response.status
        );

    }

    const data =
        await response.json();

    if (
        !data.features ||
        data.features.length === 0
    ) {

        throw new Error(
            "Location not found."
        );

    }

    const feature =
        data.features[0];

    const coordinates =
        feature.geometry.coordinates;

    return {

        name:
            feature.properties.full_address ||
            feature.properties.name ||
            query,

        longitude:
            coordinates[0],

        latitude:
            coordinates[1]

    };

}



async function searchRealSource() {

    const input =
        document.getElementById("realSource");

    const result =
        document.getElementById("realSourceResult");

    const query =
        input.value.trim();


    if (query === "") {

        result.innerHTML = `
            <h3>Enter Source</h3>
            <p>Please enter a source location.</p>
        `;

        return;

    }


    result.innerHTML = `
        <h3>Searching Source...</h3>
        <p>Finding real coordinates...</p>
    `;


    try {

        const location =
            await geocodeRealLocation(query);


        realSourceLocation =
            location;


        map.setView(
            [
                location.latitude,
                location.longitude
            ],
            15
        );


        L.marker(
            [
                location.latitude,
                location.longitude
            ]
        )
        .addTo(map)
        .bindPopup(
            `<b>Source</b><br>${location.name}`
        )
        .openPopup();


        result.innerHTML = `
            <h3>Source Found</h3>

            <p>
                <strong>Name:</strong>
                ${location.name}
            </p>

            <p>
                <strong>Latitude:</strong>
                ${location.latitude.toFixed(6)}
            </p>

            <p>
                <strong>Longitude:</strong>
                ${location.longitude.toFixed(6)}
            </p>
        `;

    }
    catch (error) {

        console.error(error);

        realSourceLocation = null;

        result.innerHTML = `
            <h3>Search Error</h3>
            <p>${error.message}</p>
        `;

    }

}



async function searchRealDestination() {

    const input =
        document.getElementById("realDestination");

    const result =
        document.getElementById(
            "realDestinationResult"
        );

    const query =
        input.value.trim();


    if (query === "") {

        result.innerHTML = `
            <h3>Enter Destination</h3>
            <p>
                Please enter a destination location.
            </p>
        `;

        return;

    }


    result.innerHTML = `
        <h3>Searching Destination...</h3>
        <p>Finding real coordinates...</p>
    `;


    try {

        const location =
            await geocodeRealLocation(query);


        realDestinationLocation =
            location;


        map.setView(
            [
                location.latitude,
                location.longitude
            ],
            15
        );


        L.marker(
            [
                location.latitude,
                location.longitude
            ]
        )
        .addTo(map)
        .bindPopup(
            `<b>Destination</b><br>${location.name}`
        )
        .openPopup();


        result.innerHTML = `
            <h3>Destination Found</h3>

            <p>
                <strong>Name:</strong>
                ${location.name}
            </p>

            <p>
                <strong>Latitude:</strong>
                ${location.latitude.toFixed(6)}
            </p>

            <p>
                <strong>Longitude:</strong>
                ${location.longitude.toFixed(6)}
            </p>
        `;

    }
    catch (error) {

        console.error(error);

        realDestinationLocation = null;

        result.innerHTML = `
            <h3>Search Error</h3>
            <p>${error.message}</p>
        `;

    }

}



async function findRealRoadRoute() {

    const result =
        document.getElementById(
            "realRouteResult"
        );


    if (!realSourceLocation) {

        result.innerHTML = `
            <h3>Source Missing</h3>
            <p>
                Search the real source location first.
            </p>
        `;

        return;

    }


    if (!realDestinationLocation) {

        result.innerHTML = `
            <h3>Destination Missing</h3>
            <p>
                Search the real destination location first.
            </p>
        `;

        return;

    }


    result.innerHTML = `
        <h3>Calculating Real Road Route...</h3>
        <p>
            Finding the road route between
            the two locations...
        </p>
    `;


    const start =
        realSourceLocation;

    const end =
        realDestinationLocation;


    const url =
        `https://api.mapbox.com/directions/v5/` +
        `mapbox/driving-traffic/` +
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}` +
        `?alternatives=false` +
        `&geometries=geojson` +
        `&overview=full` +
        `&access_token=${MAPBOX_TOKEN}`;


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Directions API Error: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No road route found."
            );

        }


        const route =
            data.routes[0];


        const distance =
            route.distance / 1000;


        const duration =
            Math.round(
                route.duration / 60
            );


        drawRealRoadRoute(
            route.geometry.coordinates
        );


        result.innerHTML = `
            <h3>Real Road Route Found</h3>

            <p>
                <strong>From:</strong>
                ${start.name}
            </p>

            <p>
                <strong>To:</strong>
                ${end.name}
            </p>

            <p>
                <strong>Road Distance:</strong>
                ${distance.toFixed(2)} km
            </p>

            <p>
                <strong>Estimated Time:</strong>
                ${duration} minutes
            </p>

            <p>
                <strong>Routing:</strong>
                Driving Traffic
            </p>
        `;

    }
    catch (error) {

        console.error(error);

        result.innerHTML = `
            <h3>Route Error</h3>

            <p>
                ${error.message}
            </p>
        `;

    }

}



function drawRealRoadRoute(coordinates) {

    if (realRouteLine !== null) {

        map.removeLayer(
            realRouteLine
        );

    }


    const latLngs =
        coordinates.map(
            function(point) {

                return [
                    point[1],
                    point[0]
                ];

            }
        );


    realRouteLine =
        L.polyline(
            latLngs,
            {
                weight: 8,
                opacity: 0.9
            }
        ).addTo(map);


    map.fitBounds(
        realRouteLine.getBounds(),
        {
            padding: [50, 50]
        }
    );

}
async function loadRealGraphData() {

    const result =
        document.getElementById("realGraphResult");

    result.innerHTML = `
        <h3>Loading Real Road Data...</h3>
        <p>
            Calculating distances between real locations...
        </p>
    `;


    const locationNames =
        Object.keys(locations);


    const coordinates =
        locationNames.map(function(name) {

            const point =
                locations[name];

            return point[1] + "," + point[0];

        });


    const coordinateString =
        coordinates.join(";");


    const url =
        `https://api.mapbox.com/directions-matrix/v1/` +
        `mapbox/driving-traffic/` +
        `${coordinateString}` +
        `?annotations=distance,duration` +
        `&access_token=${MAPBOX_TOKEN}`;


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Matrix API Error: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (data.code !== "Ok") {

            throw new Error(
                data.message ||
                "Unable to get matrix data."
            );

        }


        displayRealGraphData(
            locationNames,
            data
        );


    }
    catch (error) {

        console.error(error);

        result.innerHTML = `
            <h3>Real Data Error</h3>

            <p>
                ${error.message}
            </p>
        `;

    }

}



function displayRealGraphData(
    locationNames,
    data
) {

    const result =
        document.getElementById(
            "realGraphResult"
        );


    let html = `
        <h3>Real Road Data Loaded</h3>

        <p>
            Distance and travel time obtained
            from the real road network.
        </p>

        <table class="roads-table">

            <thead>

                <tr>

                    <th>Source</th>
                    <th>Destination</th>
                    <th>Distance</th>
                    <th>Travel Time</th>

                </tr>

            </thead>

            <tbody>
    `;


    for (
        let i = 0;
        i < locationNames.length;
        i++
    ) {

        for (
            let j = 0;
            j < locationNames.length;
            j++
        ) {

            if (i === j) {
                continue;
            }


            const distance =
                data.distances[i][j];


            const duration =
                data.durations[i][j];


            if (
                distance === null ||
                duration === null
            ) {
                continue;
            }


            const distanceKm =
                (
                    distance / 1000
                ).toFixed(2);


            const durationMin =
                Math.round(
                    duration / 60
                );


            html += `

                <tr>

                    <td>
                        ${locationNames[i]}
                    </td>

                    <td>
                        ${locationNames[j]}
                    </td>

                    <td>
                        ${distanceKm} km
                    </td>

                    <td>
                        ${durationMin} min
                    </td>

                </tr>

            `;

        }

    }


    html += `

            </tbody>

        </table>

    `;


    result.innerHTML = html;

}
async function updateCppRoadTime(
    source,
    destination,
    duration
) {

    const url =
        `http://localhost:8080/api/update-road-time` +
        `?source=${encodeURIComponent(source)}` +
        `&destination=${encodeURIComponent(destination)}` +
        `&duration=${duration}`;

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "C++ API error: " +
            response.status
        );

    }

    const data =
        await response.json();

    if (!data.success) {

        throw new Error(
            data.message ||
            "Unable to update traffic weight"
        );

    }

    return data;
}
