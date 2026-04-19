"use client";
import { MomentWithUser } from "@/app/types";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/app/components/Avatar";

type Coordinates = { lat: number; lng: number };
type GeocodeResult = { lat: string; lon: string; display_name: string };

function LocationPickerMap({ center, selectedPoint, onChange }: { center: Coordinates; selectedPoint: Coordinates | null; onChange: (point: Coordinates) => void }) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const initialCenterRef = useRef(center);
  const initialSelectedPointRef = useRef(selectedPoint);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let mounted = true;
    const initMap = async () => {
      if (!mapHostRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !mapHostRef.current) return;

      const markerIcon = L.divIcon({
        html: `<span class="moment-pin-core"></span><span class="moment-pin-pulse"></span>`,
        className: "moment-pin-wrapper",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const map = L.map(mapHostRef.current, { zoomControl: false, attributionControl: false })
        .setView([initialCenterRef.current.lat, initialCenterRef.current.lng], 14);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const initialPoint = initialSelectedPointRef.current ?? initialCenterRef.current;
      const marker = L.marker([initialPoint.lat, initialPoint.lng], { draggable: true, icon: markerIcon }).addTo(map);

      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
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
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([center.lat, center.lng], Math.max(mapRef.current.getZoom(), 14), { duration: 0.5 });
  }, [center]);

  useEffect(() => {
    if (!markerRef.current || !selectedPoint) return;
    markerRef.current.setLatLng([selectedPoint.lat, selectedPoint.lng]);
  }, [selectedPoint]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapHostRef} className="h-64 w-full" />
    </div>
  );
}

const inputClass = "w-full text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors";
const labelClass = "block text-[12px] font-medium text-gray-500 mb-1.5";

export default function NewMoment() {
  const router = useRouter();
  const [form, setForm] = useState({ description: "", date: "", time: "", locationQuery: "" });
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 37.7749, lng: -122.4194 });
  const [selectedPoint, setSelectedPoint] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLookupLoading, setLocationLookupLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [potentials, setPotentials] = useState<MomentWithUser[]>([]);
  const [currentMomentId, setCurrentMomentId] = useState<string | null>(null);

  const findLocation = async () => {
    const query = form.locationQuery.trim();
    if (!query) { setLocationError("Enter a location first."); return; }
    setLocationLookupLoading(true);
    setLocationError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Location search failed.");
      const matches = (await response.json()) as GeocodeResult[];
      if (!matches.length) { setLocationError("No location found. Try a more specific place name."); return; }
      const lat = Number(matches[0].lat);
      const lng = Number(matches[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setLocationError("Could not read coordinates for that location."); return; }
      const pinpoint = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      setMapCenter(pinpoint);
      setSelectedPoint(pinpoint);
      setLocationLabel(matches[0].display_name);
    } catch {
      setLocationError("Something went wrong while searching.");
    } finally {
      setLocationLookupLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch("/api/moments", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ description: form.description, date: form.date, time: form.time, latitude: selectedPoint?.lat ?? null, longitude: selectedPoint?.lng ?? null }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.status === "similar_found") {
      setPotentials(data.matches);
      setCurrentMomentId(data.moment.id);
    } else {
      router.push("/moments");
    }
  };

  const confirmMatch = async (otherPostId: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    await fetch("/api/confirmations", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ current_post_id: currentMomentId, other_post_id: otherPostId }),
    });
    router.push("/matches");
  };

  // Potentials view
  if (potentials.length > 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
        <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <span className="text-[15px] font-medium tracking-tight text-gray-900">Lost&amp;Found</span>
          <Link href="/home" className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors">Home</Link>
        </nav>

        <div className="flex-1 flex flex-col items-center px-6 py-14">
          <div className="w-full max-w-sm">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4 text-center">Possible match</p>
            <h2
              className="text-[28px] font-normal tracking-tight text-center text-gray-900 mb-3 leading-tight"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              Is this who you saw?
            </h2>
            <p className="text-[14px] text-gray-400 text-center mb-10">
              We found some similar moments. Take a look.
            </p>

            <div className="flex flex-col gap-3">
              {potentials.map((p, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar src={p.users?.profile_picture} name={p.users?.name} size={40} />
                    <p className="text-[14px] font-medium text-gray-900">{p.users?.name ?? 'Someone'}</p>
                  </div>
                  <p className="text-[14px] text-gray-700 leading-relaxed italic mb-5">&ldquo;{p.description}&rdquo;</p>
                  <button
                    onClick={() => confirmMatch(p.id)}
                    className="w-full bg-gray-900 text-white text-[13px] font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Yes, this is them
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/matches")}
              className="mt-6 w-full text-center text-[13px] text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              None of these — skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-[15px] font-medium tracking-tight text-gray-900">Lost&amp;Found</span>
        <Link href="/home" className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors">Home</Link>
      </nav>

      <form onSubmit={submit} className="flex-1 flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-sm flex flex-col gap-6">

          <div className="text-center mb-2">
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4">New moment</p>
            <h1
              className="text-[32px] font-normal tracking-tight text-gray-900 leading-tight"
              style={{ fontFamily: "Georgia, Times New Roman, serif" }}
            >
              Who did you see?
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="time" onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.locationQuery}
                onChange={(e) => setForm({ ...form, locationQuery: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void findLocation(); } }}
                placeholder="Café, station, neighborhood…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={findLocation}
                disabled={locationLookupLoading}
                className="px-4 py-3 rounded-lg bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {locationLookupLoading ? "…" : "Find"}
              </button>
            </div>
            {locationError && <p className="text-[12px] text-red-500 mt-2">{locationError}</p>}
            {locationLabel && <p className="text-[12px] text-gray-400 mt-2 leading-relaxed">{locationLabel}</p>}
          </div>

          <div>
            <label className={labelClass}>Pin the exact spot</label>
            <LocationPickerMap center={mapCenter} selectedPoint={selectedPoint} onChange={setSelectedPoint} />
            {selectedPoint ? (
              <p className="text-[11px] text-gray-400 mt-2">{selectedPoint.lat}, {selectedPoint.lng}</p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-2">Search a place, then drag the pin.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Describe the moment</label>
            <textarea
              placeholder="Describe them, you, and what happened…"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className={`${inputClass} h-32 resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white text-[14px] font-medium py-3.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {loading ? "Searching…" : "Find them"}
          </button>
        </div>
      </form>
    </div>
  );
}