// Room data for the 360° tour.
// Each panorama is a partial (~200° wide) image, so haov/vaov tell the viewer how much of the sphere it covers.
// Hotspot positions: yaw = left/right in degrees (-100 to 100), pitch = up/down in degrees.
window.TOUR = {
  firstScene: "living",
  haov: 200,
  vaov: 112,
  rooms: {
    living: {
      title: "Living Room",
      area: "18' × 14'",
      image: "panos/living.webp",
      thumb: "panos/thumbs/living.webp",
      yaw: 0,
      links: [
        { to: "dining", yaw: -92, pitch: -4 },
        { to: "balcony", yaw: 3, pitch: -2 },
        { to: "master", yaw: 80, pitch: -4, label: "Bedrooms" },
        { to: "living_b", yaw: 30, pitch: -30, label: "Walk to the sofa side" }
      ],
      info: [
        { yaw: -36, pitch: 6, title: "Travertine TV Wall", text: "Natural travertine cladding with walnut slat panels and a linear bio-ethanol fireplace." },
        { yaw: 51, pitch: 10, title: "Backlit Display Niche", text: "Walnut shelving with concealed 2700K LED strips for a warm gallery glow." },
        { yaw: 36, pitch: -15, title: "L-shaped Lounge Sofa", text: "Bouclé upholstery in sand beige, seats 6 comfortably." },
        { yaw: -10, pitch: 30, title: "Cove Ceiling", text: "Floating gypsum ceiling with warm cove lighting and black magnetic track spots." }
      ]
    },
    // Second standing point in the living room, seen from the opposite side
    living_b: {
      room: "living",
      title: "Living Room",
      view: "View 2",
      area: "18' × 14'",
      image: "panos/living_v2.webp",
      thumb: "panos/thumbs/living_v2.webp",
      yaw: 0,
      links: [
        { to: "living", yaw: 40, pitch: -30, label: "Walk to the TV wall" },
        { to: "dining", yaw: -50, pitch: 2 },
        { to: "balcony", yaw: 7, pitch: 2 }
      ],
      info: [
        { yaw: 58, pitch: 8, title: "Travertine TV Wall", text: "Natural travertine cladding with walnut slat panels and a linear bio-ethanol fireplace." },
        { yaw: -86, pitch: 8, title: "Backlit Display Niche", text: "Walnut shelving with concealed 2700K LED strips for a warm gallery glow." },
        { yaw: -32, pitch: -20, title: "L-shaped Lounge Sofa", text: "Bouclé upholstery in sand beige, seats 6 comfortably." }
      ]
    },
    dining: {
      title: "Dining Area",
      area: "12' × 11'",
      image: "panos/dining.webp",
      thumb: "panos/thumbs/dining.webp",
      yaw: 0,
      links: [
        { to: "living", yaw: -58, pitch: -4 },
        { to: "kitchen", yaw: 42, pitch: -4 }
      ],
      info: [
        { yaw: -1, pitch: -24, title: "6-Seater Stone Table", text: "Travertine top with cane-back oak chairs." },
        { yaw: 5, pitch: 6, title: "Fluted Crockery Wall", text: "Full-height oak storage with a lit open niche for serveware." },
        { yaw: 0, pitch: 28, title: "Globe Pendants", text: "Brushed brass and opal glass pendants on a dimmer." }
      ]
    },
    kitchen: {
      title: "Modular Kitchen",
      area: "11' × 9'",
      image: "panos/kitchen.webp",
      thumb: "panos/thumbs/kitchen.webp",
      yaw: 0,
      links: [
        { to: "dining", yaw: 44, pitch: -6 }
      ],
      info: [
        { yaw: 10, pitch: -26, title: "Island with Wine Cooler", text: "Calacatta-look quartz island with built-in dual-zone wine cooler." },
        { yaw: -50, pitch: 2, title: "Marble Backsplash", text: "Book-matched veined stone with under-cabinet LED lighting." },
        { yaw: -9, pitch: 1, title: "Built-in Appliances", text: "Oven, microwave and refrigerator integrated in a tall unit." }
      ]
    },
    master: {
      title: "Master Bedroom",
      area: "15' × 13'",
      image: "panos/master.webp",
      thumb: "panos/thumbs/master.webp",
      yaw: 20,
      links: [
        { to: "bathroom", yaw: -22, pitch: -24, label: "Attached Bath" },
        { to: "living", yaw: 88, pitch: -24 }
      ],
      info: [
        { yaw: 28, pitch: -22, title: "King Platform Bed", text: "Upholstered low-profile bed with soft linen bedding." },
        { yaw: 58, pitch: 16, title: "Walnut Headboard Wall", text: "Full-height veneer panelling with hidden cove lighting." },
        { yaw: -59, pitch: 4, title: "Garden-view Window", text: "Floor-to-ceiling glazing with sheer and blackout layers." },
        { yaw: 5, pitch: 4, title: "Walk-in Style Wardrobe", text: "Handleless taupe shutters, soft-close fittings." }
      ]
    },
    bedroom2: {
      title: "Second Bedroom",
      area: "12' × 11'",
      image: "panos/bedroom2.webp",
      thumb: "panos/thumbs/bedroom2.webp",
      yaw: 0,
      links: [
        { to: "living", yaw: 47, pitch: -2 }
      ],
      info: [
        { yaw: -53, pitch: -6, title: "Study Corner", text: "Built-in desk with floating shelves and task pendant." },
        { yaw: -30, pitch: 4, title: "Oak Wardrobe", text: "Full-height light oak wardrobe with internal drawers." },
        { yaw: 5, pitch: 14, title: "Fluted Bed Wall", text: "Oak fluted panelling with a warm LED reveal." }
      ]
    },
    bathroom: {
      title: "Bathroom",
      area: "9' × 7'",
      image: "panos/bathroom.webp",
      thumb: "panos/thumbs/bathroom.webp",
      yaw: 0,
      links: [
        { to: "master", yaw: 92, pitch: -4 }
      ],
      info: [
        { yaw: -68, pitch: -12, title: "Stone Vessel Basin", text: "Floating stone vanity with matte black wall-mounted mixer." },
        { yaw: -4, pitch: 4, title: "Walk-in Rain Shower", text: "Frameless glass enclosure with ceiling rain shower." },
        { yaw: -70, pitch: 12, title: "Backlit Mirror", text: "Anti-fog mirror with warm halo lighting." }
      ]
    },
    balcony: {
      title: "Balcony",
      area: "14' × 6'",
      image: "panos/balcony.webp",
      thumb: "panos/thumbs/balcony.webp",
      yaw: -10,
      links: [
        { to: "living", yaw: 52, pitch: -6 }
      ],
      info: [
        { yaw: -9, pitch: 16, title: "Open Skyline View", text: "12th floor, east-facing — sunrise and green belt views." },
        { yaw: -64, pitch: -24, title: "Lounge Seating", text: "Weather-proof seating with an oak coffee table." }
      ]
    }
  },
  // Display order for room strip and floor plan
  order: ["living", "dining", "kitchen", "master", "bedroom2", "bathroom", "balcony"]
};
