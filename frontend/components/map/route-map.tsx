"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import MapGl, { Layer, MapRef, Marker, Source } from "react-map-gl";
import MapLibre, {
  Layer as MLayer,
  MapRef as LibreMapRef,
  Marker as MMarker,
  Source as MSource
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export type RouteMapProps = {
  /** Mapbox / GeoJSON order: [lng, lat][] */
  coordinates?: [number, number][];
  start?: { lng: number; lat: number } | null;
  end?: { lng: number; lat: number } | null;
};

const defaultCenter = { longitude: 76.5, latitude: 14.5, zoom: 5.3 };

/** Raster OSM when no Mapbox token (heavy use requires your own tiles per OSM policy). */
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", minzoom: 0, maxzoom: 19 }]
};

function boundsForCoords(coords: [number, number][]): [[number, number], [number, number]] {
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

export function RouteMap({ coordinates = [], start, end }: RouteMapProps) {
  const mapboxRef = useRef<MapRef>(null);
  const libreRef = useRef<LibreMapRef>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const routeGeoJson = useMemo(() => {
    if (coordinates.length < 2) return null;
    return {
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates },
      properties: {}
    };
  }, [coordinates]);

  const fitMapbox = useCallback(() => {
    if (coordinates.length < 2) return;
    const map = mapboxRef.current?.getMap();
    if (!map) return;
    map.fitBounds(boundsForCoords(coordinates), { padding: 48, duration: 0 });
  }, [coordinates]);

  const fitLibre = useCallback(() => {
    if (coordinates.length < 2) return;
    const map = libreRef.current?.getMap();
    if (!map) return;
    map.fitBounds(boundsForCoords(coordinates), { padding: 48, duration: 0 });
  }, [coordinates]);

  useEffect(() => {
    if (!routeGeoJson) return;
    requestAnimationFrame(() => {
      if (token) fitMapbox();
      else fitLibre();
    });
  }, [coordinates, routeGeoJson, token, fitMapbox, fitLibre]);

  if (!token) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0c1018]">
        <div className="min-h-0 flex-1">
          <MapLibre
            ref={libreRef}
            initialViewState={defaultCenter}
            mapStyle={OSM_STYLE as never}
            onLoad={fitLibre}
            style={{ width: "100%", height: "100%" }}
            attributionControl={true}
          >
            {routeGeoJson ? (
              <MSource id="route" type="geojson" data={routeGeoJson}>
                <MLayer
                  id="route-layer"
                  type="line"
                  paint={{
                    "line-color": "#55c0ff",
                    "line-width": 5,
                    "line-opacity": 0.95
                  }}
                />
              </MSource>
            ) : null}
            {start ? <MMarker longitude={start.lng} latitude={start.lat} color="#67e8f9" /> : null}
            {end ? <MMarker longitude={end.lng} latitude={end.lat} color="#a78bfa" /> : null}
          </MapLibre>
        </div>
        <p className="border-t border-white/10 px-3 py-1.5 text-[11px] text-slate-500">
          Directions line on OpenStreetMap (free). Optionally set NEXT_PUBLIC_MAPBOX_TOKEN for Mapbox styling.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-white/10">
      <MapGl
        ref={mapboxRef}
        mapboxAccessToken={token}
        initialViewState={defaultCenter}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={fitMapbox}
        style={{ width: "100%", height: "100%" }}
      >
        {routeGeoJson ? (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                "line-color": "#55c0ff",
                "line-width": 4
              }}
            />
          </Source>
        ) : null}
        {start ? <Marker longitude={start.lng} latitude={start.lat} color="#67e8f9" /> : null}
        {end ? <Marker longitude={end.lng} latitude={end.lat} color="#a78bfa" /> : null}
      </MapGl>
    </div>
  );
}
