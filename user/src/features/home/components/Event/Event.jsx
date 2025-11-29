import React from "react";
import { Link } from "react-router-dom";
import "./Event.css";

const FALLBACK_IMG = "/event.jpg";

export default function Event({ events = [] }) {
  return (
    <div className="event">
      <div className="option">
        <h3>Sự kiện</h3>
        <Link to="/events" className="option-link">
          Xem tất cả
        </Link>
      </div>
      {events.map((e) => (
        <img
          key={e.id}
          src={e.img || e.image || FALLBACK_IMG}
          alt={e.title || "Sự kiện"}
          onError={(ev) => {
            ev.currentTarget.src = FALLBACK_IMG;
          }}
        />
      ))}
    </div>
  );
}
