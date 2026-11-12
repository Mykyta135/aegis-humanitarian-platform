// Street tiles: MapTiler when a key is configured, otherwise OpenStreetMap,
// so a fresh clone shows a map without signing up anywhere.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

export const hasMapTiler = Boolean(MAPTILER_KEY);

export const streetTiles = hasMapTiler
  ? {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  : {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
