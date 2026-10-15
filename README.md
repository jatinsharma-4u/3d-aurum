# Aurum Residences · 3D / 360° Real Estate Website

A luxury 2 BHK apartment showcase with an immersive 360° walk-through tour.

## Open it
Double-click `index.html`. No server or install needed. The tour also works when the site is hosted (Netlify, Vercel, GitHub Pages).

## Features
- 4K AI-upscaled 360° panoramas for 7 rooms, plus a second standing point in the living room
- Drag to look around, scroll or pinch to zoom, tap room labels to walk (flash transition)
- Info hotspots, floor-plan mini map, gyroscope on phones, fullscreen
- Smooth scrolling and scroll animations (GSAP + Lenis), fully responsive

## Structure
- `index.html`: page
- `css/style.css`: styles
- `js/app.js`: interactions and tour
- `js/tour-data.js`: rooms, links and hotspots
- `js/panos-data.js`: embedded panoramas, used only when opened by double-click (file://)
- `panos/`: 360° images (`card/` and `thumbs/` are smaller copies)
- `img/`: exterior and amenity photos in 3 sizes

Interiors and exteriors are AI-generated concept visuals.
