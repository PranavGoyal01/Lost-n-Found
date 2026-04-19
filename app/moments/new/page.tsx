"use client";
import { Moment } from "@/app/types";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };

type GeocodeResult = { lat: string; lon: string; display_name: string };

function LocationPickerMap({ center, selectedPoint, onChange }: { center: Coordinates; selectedPoint: Coordinates | null; onChange: (point: Coordinates) => void }) {
	const mapHostRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<import("leaflet").Map | null>(null);
	const markerRef = useRef<import("leaflet").Marker | null>(null);
	const initialCenterRef = useRef(center);
	const initialSelectedPointRef = useRef(selectedPoint);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		let mounted = true;

		const initMap = async () => {
			if (!mapHostRef.current || mapRef.current) {
				return;
			}

			const L = await import("leaflet");

			if (!mounted || !mapHostRef.current) {
				return;
			}

			const markerIcon = L.divIcon({
				html: `<span class="moment-pin-core"></span><span class="moment-pin-pulse"></span>`,
				className: "moment-pin-wrapper",
				iconSize: [26, 26],
				iconAnchor: [13, 13],
			});

			const initialCenter = initialCenterRef.current;
			const initialSelectedPoint = initialSelectedPointRef.current;

			const map = L.map(mapHostRef.current, {
				zoomControl: false,
				attributionControl: false,
			}).setView([initialCenter.lat, initialCenter.lng], 14);

			L.control
				.zoom({
					position: "bottomright",
				})
				.addTo(map);

			L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
				attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
				subdomains: "abcd",
				maxZoom: 20,
			}).addTo(map);

			const initialPoint = initialSelectedPoint ?? initialCenter;
			const marker = L.marker([initialPoint.lat, initialPoint.lng], {
				draggable: true,
				icon: markerIcon,
			}).addTo(map);

			marker.on("dragend", () => {
				const position = marker.getLatLng();
				onChangeRef.current({ lat: Number(position.lat.toFixed(6)), lng: Number(position.lng.toFixed(6)) });
			});

			map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
				marker.setLatLng(event.latlng);
				onChangeRef.current({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
			});

			mapRef.current = map;
			markerRef.current = marker;
		};

		void initMap();

		return () => {
			mounted = false;
			markerRef.current = null;
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!mapRef.current) {
			return;
		}
		mapRef.current.flyTo([center.lat, center.lng], Math.max(mapRef.current.getZoom(), 14), { duration: 0.5 });
	}, [center]);

	useEffect(() => {
		if (!markerRef.current || !selectedPoint) {
			return;
		}
		markerRef.current.setLatLng([selectedPoint.lat, selectedPoint.lng]);
	}, [selectedPoint]);

	return (
		<div className='modern-map-shell'>
			<div className='modern-map-badge'>Precise Pin Mode</div>
			<div className='modern-map-crosshair' aria-hidden='true' />
			<div ref={mapHostRef} className='h-72 w-full modern-map-canvas' />
		</div>
	);
}

export default function NewMoment() {
	const router = useRouter();
	const [form, setForm] = useState({ description: "", date: "", time: "", locationQuery: "" });
	const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 37.7749, lng: -122.4194 });
	const [selectedPoint, setSelectedPoint] = useState<Coordinates | null>(null);
	const [locationLabel, setLocationLabel] = useState("");
	const [locationLookupLoading, setLocationLookupLoading] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [loading, setLoading] = useState(false);

	// New state for the "menu" view
	const [potentials, setPotentials] = useState<Moment[]>([]);
	const [currentMomentId, setCurrentMomentId] = useState<string | null>(null);

	const findLocation = async () => {
		const query = form.locationQuery.trim();
		if (!query) {
			setLocationError("Enter a location first so we can place the map.");
			return;
		}

		setLocationLookupLoading(true);
		setLocationError("");

		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);

			if (!response.ok) {
				throw new Error("Location search failed.");
			}

			const matches = (await response.json()) as GeocodeResult[];
			if (!matches.length) {
				setLocationError("No nearby location found. Try a more specific place name.");
				return;
			}

			const lat = Number(matches[0].lat);
			const lng = Number(matches[0].lon);

			if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
				setLocationError("Could not read map coordinates for that location.");
				return;
			}

			const pinpoint = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };

			setMapCenter(pinpoint);
			setSelectedPoint(pinpoint);
			setLocationLabel(matches[0].display_name);
		} catch {
			setLocationError("Something went wrong while searching for that location.");
		} finally {
			setLocationLookupLoading(false);
		}
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const session = (await supabase.auth.getSession()).data.session;

		const res = await fetch("/api/moments", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: form.description, date: form.date, time: form.time, latitude: selectedPoint?.lat ?? null, longitude: selectedPoint?.lng ?? null }) });

		const data = await res.json();
		setLoading(false);

		if (data.status === "similar_found") {
			// Switch to the potentials menu
			setPotentials(data.matches);
			setCurrentMomentId(data.moment.id);
		} else {
			router.push("/moments");
		}
	};

	const confirmMatch = async (otherPostId: string) => {
		const session = (await supabase.auth.getSession()).data.session;
		await fetch("/api/confirmations", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ current_post_id: currentMomentId, other_post_id: otherPostId }) });
		// Redirect to matches after they confirm!
		router.push("/matches");
	};

	// If we found similar vectors, show the menu instead of the form
	if (potentials.length > 0) {
		return (
			<div className='p-8 max-w-lg mx-auto'>
				<h2 className='text-2xl font-bold mb-4'>Are any of these them?</h2>
				<p className='mb-6 text-gray-600'>We found some similar moments. Take a look:</p>

				<div className='space-y-4'>
					{potentials.map((p, idx) => (
						<div key={idx} className='border p-4 rounded-lg bg-white shadow-sm'>
							<p className='text-gray-800 mb-4 italic'>{p.description}</p>
							<button onClick={() => confirmMatch(p.id)} className='w-full bg-black text-white p-2 rounded font-semibold hover:bg-gray-800 transition'>
								Yes, this is who I am looking for
							</button>
						</div>
					))}
				</div>

				<button onClick={() => router.push("/matches")} className='mt-6 w-full text-center text-gray-500 underline'>
					None of these are them (skip for now)
				</button>
			</div>
		);
	}

	// Standard Form View
	return (
		<form onSubmit={submit} className='p-8 flex flex-col gap-4 max-w-md mx-auto'>
			<h1 className='text-2xl font-bold mb-2'>Post a Moment</h1>
			<label className='space-y-1 text-sm font-medium text-gray-700'>
				<span>Date</span>
				<input type='date' onChange={(e) => setForm({ ...form, date: e.target.value })} className='border p-2 rounded w-full' required />
			</label>
			<label className='space-y-1 text-sm font-medium text-gray-700'>
				<span>Time</span>
				<input type='time' onChange={(e) => setForm({ ...form, time: e.target.value })} className='border p-2 rounded w-full' required />
			</label>
			<div className='space-y-2'>
				<label htmlFor='location' className='font-medium text-sm text-gray-700'>
					Start with a place
				</label>
				<div className='flex gap-2'>
					<input id='location' type='text' value={form.locationQuery} onChange={(e) => setForm({ ...form, locationQuery: e.target.value })} className='border p-2 rounded w-full' placeholder='Cafe, station, neighborhood...' />
					<button type='button' onClick={findLocation} disabled={locationLookupLoading} className='px-4 py-2 rounded bg-gray-900 text-white font-medium disabled:bg-gray-500'>
						{locationLookupLoading ? "Locating..." : "Locate"}
					</button>
				</div>
				{locationError ? <p className='text-sm text-red-600'>{locationError}</p> : null}
				{locationLabel ? <p className='text-xs text-gray-500 leading-relaxed'>{locationLabel}</p> : null}
			</div>

			<div className='space-y-3'>
				<p className='text-sm text-gray-700 font-medium'>Refine the exact point (drag pin, zoom, or tap map)</p>
				<LocationPickerMap center={mapCenter} selectedPoint={selectedPoint} onChange={setSelectedPoint} />
				{selectedPoint ? (
					<p className='text-xs text-gray-600 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
						Selected coordinates: {selectedPoint.lat}, {selectedPoint.lng}
					</p>
				) : (
					<p className='text-xs text-gray-500 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2'>Search a place first, then move the pin for exact location.</p>
				)}
			</div>
			<textarea placeholder='Describe them, you, and the interaction...' onChange={(e) => setForm({ ...form, description: e.target.value })} className='border p-2 h-32 rounded' required />
			<button type='submit' disabled={loading} className='bg-black text-white p-2 rounded disabled:bg-gray-400'>
				{loading ? "Searching..." : "Find Them"}
			</button>
		</form>
	);
}
