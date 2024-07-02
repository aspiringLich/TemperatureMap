import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AIO_KEY } from '$env/static/private'

const s =  (s) => `https://io.adafruit.com/api/v2/aspiringLich/feeds/airmesh.${s}/data/last?x-aio-key=${AIO_KEY}`;

export const GET: RequestHandler = async ({ json, fetch }) => {
	const humidity = await (await fetch(s("humidity"))).json();
	const pressure = await (await fetch(s("pressure"))).json();
	const quality = await (await fetch(s("quality"))).json();
	const temp = await (await fetch(s("temp"))).json();
	
	const ret = {
		lat: humidity.lat / 100,
		lon: -humidity.lon / 100,
		humidity: Number(humidity.value),
		pressure: Number(pressure.value),
		quality: Number(quality.value),
		temp: Number(temp.value)
	};
	console.log(ret);
	return new Response(JSON.stringify(ret));
};
