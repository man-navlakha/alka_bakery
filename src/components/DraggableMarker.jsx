import { Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";

export default function DraggableMarker({ position, onDragEnd }) {
  const [markerPos, setMarkerPos] = useState(position);

  useMapEvents({
    click(e) {
      setMarkerPos(e.latlng);
      onDragEnd(e.latlng);
    }
  });

  return (
    <Marker
      position={markerPos}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setMarkerPos(latlng);
          onDragEnd(latlng);
        },
      }}
    />
  );
}
