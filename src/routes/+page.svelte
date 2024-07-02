<script lang="ts">
	import mapboxgl from 'mapbox-gl';
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { example_data } from './data';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import type { InterpolateHeatmapLayer } from 'interpolateheatmaplayer';

	mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

	const lon = -74.0;
	const lat = 40.7;

	const ext = 0.5;
	const startingLatitude = lat - ext;
	const startingLongitude = lon - ext;
	const endingLatitude = lat + ext;
	const endingLongitude = lon + ext;

	const n = 5;

	let points: { lat: number; lon: number; val: number }[] = [];
	let data = example_data;

	let map: mapboxgl.Map;
	let layer: InterpolateHeatmapLayer;
	let markers: mapboxgl.Marker[] = [];

	onMount(async () => {
		const interpolateHeatmapLayer = await import('interpolateheatmaplayer');

		map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/light-v10',
			// projection: { name: 'globe' },
			zoom: 10.3,
			center: [lon, lat]
		});

		map.on('load', () => {
			layer = interpolateHeatmapLayer.create({
				layerId: 'temperature',
				points: points
				// roi: [[-73, 39.7], [-72, 41.7]],
			});
			map.addLayer(layer, 'road-label');
		});
		updatePoints();
	});

	const updatePoints = async () => {
		if (selected == 'test') {
			data = example_data;
		} else {
			data = [await (await fetch('/last')).json()];
		}
		points = data.map(({ lat, lon, temp }) => {
			return { lat, lon, val: temp };
		});
		layer?.updatePoints(points);

		const values = points.map(({ val }) => val);
		const min = Math.min(...values);
		const max = Math.max(...values);

		for (const marker of markers) marker.remove();
		markers = [];

		for (const [i, { lon, lat, val }] of points.entries()) {
			const el = document.createElement('div');
			el.className = 'marker';

			// current color marker is 206°
			let x = (val - min) / (max - min);
			if (max == min) x = 0;
			el.style.setProperty('--shift', `${x * -206}deg`);
			const d = data[i];

			let marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
				.setLngLat([lon, lat])
				.setPopup(
					new mapboxgl.Popup({ offset: 50 }) // add popups
						.setHTML(
							`<b>Temperature</b> <span>${d.temp.toFixed(2)}</span>
							 <b>Pressure</b>    <span>${d.pressure}</span>
							 <b>Humidiy</b>     <span>${d.humidity}</span>
							 <b>Air Quality</b> <span>${d.quality.toFixed(2)}</span>`
						)
				)
				.addTo(map);
			markers.push(marker);
		}
	};

	let selected: 'test' | 'adafruit';
</script>

<select bind:value={selected} on:change={updatePoints}>
	<option value="test">Test Data</option>
	<option value="adafruit">Adafruit IO</option>
</select>
<div id="map" />

<style>
	select {
		position: absolute;
		z-index: 99;
	}

	#map {
		height: 100%;
	}

	:global(.marker) {
		background-image: url('pin.png');
		background-size: cover;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		cursor: pointer;
		filter: hue-rotate(var(--shift)) opacity(0.5) brightness(1.2);
	}

	:global(.marker):hover,
	:global(.marker.selected) {
		filter: hue-rotate(var(--shift)) opacity(0.8) brightness(1.2);
		transition: 0.2s;
	}

	:gloal(.mapboxgl-popup) {
		max-width: 200px;
	}

	:global(.mapboxgl-popup-content) {
		font-family: 'Open Sans', sans-serif;
		display: grid;
		grid-template-columns: 2;
	}
</style>
