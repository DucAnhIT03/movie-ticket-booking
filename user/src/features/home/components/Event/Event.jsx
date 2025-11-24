import React from "react";
import "./Event.css";

export default function Event({ events }) {
  return (
    <div className="event">
      <div className="option">
        <h3>Sự kiện</h3>
        <h3>Xem tất cả</h3>
      </div>
      {events.map((e) => (
        <img key={e.id} src={e.img} alt="event" />
      ))}
    </div>
  );
}
