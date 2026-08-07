/**
 * Vehicle catalogue and registration-plate rules for host verification.
 *
 * Served to the client from GET /api/host/catalogue rather than duplicated in
 * the web app. A second copy would drift, and the ids stored on Vehicle rows
 * are only meaningful against one list.
 *
 * Brands and models are the Indian market as sold — reference data, not a
 * placeholder set. Adding a model is a one-line change here; existing rows
 * keep their captured `brandLabel`/`modelLabel` regardless.
 */

export type VehicleClass = 'cab' | 'bike' | 'auto';

export interface VehicleModel {
  id: string;
  label: string;
  /** Passenger seats excluding the driver. The default a host is offered. */
  seats: number;
}

export interface VehicleBrand {
  id: string;
  label: string;
  type: VehicleClass;
  models: VehicleModel[];
}

const car = (id: string, label: string, seats = 4): VehicleModel => ({ id, label, seats });

export const VEHICLE_BRANDS: VehicleBrand[] = [
  {
    id: 'maruti-suzuki',
    label: 'Maruti Suzuki',
    type: 'cab',
    models: [
      car('alto-k10', 'Alto K10'),
      car('s-presso', 'S-Presso'),
      car('celerio', 'Celerio'),
      car('wagon-r', 'Wagon R'),
      car('swift', 'Swift'),
      car('dzire', 'Dzire'),
      car('baleno', 'Baleno'),
      car('ignis', 'Ignis'),
      car('fronx', 'Fronx'),
      car('brezza', 'Brezza'),
      car('grand-vitara', 'Grand Vitara'),
      car('ertiga', 'Ertiga', 6),
      car('xl6', 'XL6', 5),
      car('invicto', 'Invicto', 6),
      car('eeco', 'Eeco', 6),
    ],
  },
  {
    id: 'hyundai',
    label: 'Hyundai',
    type: 'cab',
    models: [
      car('grand-i10-nios', 'Grand i10 Nios'),
      car('i20', 'i20'),
      car('aura', 'Aura'),
      car('exter', 'Exter'),
      car('venue', 'Venue'),
      car('verna', 'Verna'),
      car('creta', 'Creta'),
      car('alcazar', 'Alcazar', 6),
      car('tucson', 'Tucson'),
    ],
  },
  {
    id: 'tata',
    label: 'Tata',
    type: 'cab',
    models: [
      car('tiago', 'Tiago'),
      car('tigor', 'Tigor'),
      car('altroz', 'Altroz'),
      car('punch', 'Punch'),
      car('nexon', 'Nexon'),
      car('curvv', 'Curvv'),
      car('harrier', 'Harrier'),
      car('safari', 'Safari', 6),
    ],
  },
  {
    id: 'mahindra',
    label: 'Mahindra',
    type: 'cab',
    models: [
      car('xuv-3xo', 'XUV 3XO'),
      car('bolero', 'Bolero', 6),
      car('bolero-neo', 'Bolero Neo', 6),
      car('thar', 'Thar', 3),
      car('thar-roxx', 'Thar Roxx'),
      car('scorpio-classic', 'Scorpio Classic', 6),
      car('scorpio-n', 'Scorpio N', 6),
      car('xuv700', 'XUV700', 6),
      car('marazzo', 'Marazzo', 6),
    ],
  },
  {
    id: 'toyota',
    label: 'Toyota',
    type: 'cab',
    models: [
      car('glanza', 'Glanza'),
      car('taisor', 'Taisor'),
      car('rumion', 'Rumion', 6),
      car('urban-cruiser-hyryder', 'Urban Cruiser Hyryder'),
      car('innova-crysta', 'Innova Crysta', 6),
      car('innova-hycross', 'Innova Hycross', 6),
      car('fortuner', 'Fortuner', 6),
    ],
  },
  {
    id: 'kia',
    label: 'Kia',
    type: 'cab',
    models: [
      car('sonet', 'Sonet'),
      car('syros', 'Syros'),
      car('seltos', 'Seltos'),
      car('carens', 'Carens', 6),
      car('carnival', 'Carnival', 6),
    ],
  },
  {
    id: 'honda',
    label: 'Honda',
    type: 'cab',
    models: [car('amaze', 'Amaze'), car('city', 'City'), car('elevate', 'Elevate')],
  },
  {
    id: 'renault',
    label: 'Renault',
    type: 'cab',
    models: [car('kwid', 'Kwid'), car('triber', 'Triber', 6), car('kiger', 'Kiger')],
  },
  {
    id: 'nissan',
    label: 'Nissan',
    type: 'cab',
    models: [car('magnite', 'Magnite')],
  },
  {
    id: 'skoda',
    label: 'Skoda',
    type: 'cab',
    models: [car('kylaq', 'Kylaq'), car('slavia', 'Slavia'), car('kushaq', 'Kushaq')],
  },
  {
    id: 'volkswagen',
    label: 'Volkswagen',
    type: 'cab',
    models: [car('virtus', 'Virtus'), car('taigun', 'Taigun')],
  },
  {
    id: 'mg',
    label: 'MG',
    type: 'cab',
    models: [
      car('comet-ev', 'Comet EV', 3),
      car('astor', 'Astor'),
      car('hector', 'Hector'),
      car('gloster', 'Gloster', 6),
    ],
  },
  {
    id: 'citroen',
    label: 'Citroën',
    type: 'cab',
    models: [car('c3', 'C3'), car('basalt', 'Basalt'), car('c3-aircross', 'C3 Aircross', 5)],
  },

  // --- Two-wheelers -------------------------------------------------------
  {
    id: 'honda-2w',
    label: 'Honda',
    type: 'bike',
    models: [
      car('activa', 'Activa', 1),
      car('dio', 'Dio', 1),
      car('shine', 'Shine', 1),
      car('unicorn', 'Unicorn', 1),
      car('sp-125', 'SP 125', 1),
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    type: 'bike',
    models: [
      car('splendor', 'Splendor', 1),
      car('hf-deluxe', 'HF Deluxe', 1),
      car('passion', 'Passion', 1),
      car('glamour', 'Glamour', 1),
      car('xpulse', 'Xpulse', 1),
    ],
  },
  {
    id: 'tvs',
    label: 'TVS',
    type: 'bike',
    models: [
      car('jupiter', 'Jupiter', 1),
      car('ntorq', 'NTorq', 1),
      car('apache', 'Apache', 1),
      car('raider', 'Raider', 1),
      car('iqube', 'iQube', 1),
    ],
  },
  {
    id: 'bajaj',
    label: 'Bajaj',
    type: 'bike',
    models: [
      car('pulsar', 'Pulsar', 1),
      car('platina', 'Platina', 1),
      car('ct-110', 'CT 110', 1),
      car('chetak', 'Chetak', 1),
    ],
  },
  {
    id: 'royal-enfield',
    label: 'Royal Enfield',
    type: 'bike',
    models: [
      car('classic-350', 'Classic 350', 1),
      car('hunter-350', 'Hunter 350', 1),
      car('bullet-350', 'Bullet 350', 1),
      car('himalayan', 'Himalayan', 1),
    ],
  },
  {
    id: 'yamaha',
    label: 'Yamaha',
    type: 'bike',
    models: [car('fz', 'FZ', 1), car('r15', 'R15', 1), car('fascino', 'Fascino', 1)],
  },
  {
    id: 'suzuki-2w',
    label: 'Suzuki',
    type: 'bike',
    models: [car('access-125', 'Access 125', 1), car('burgman', 'Burgman', 1)],
  },
  {
    id: 'ola-electric',
    label: 'Ola Electric',
    type: 'bike',
    models: [car('s1-pro', 'S1 Pro', 1), car('s1-air', 'S1 Air', 1)],
  },
  {
    id: 'ather',
    label: 'Ather',
    type: 'bike',
    models: [car('450x', '450X', 1), car('rizta', 'Rizta', 1)],
  },

  // --- Three-wheelers -----------------------------------------------------
  {
    id: 'bajaj-3w',
    label: 'Bajaj',
    type: 'auto',
    models: [car('re-compact', 'RE Compact', 3), car('maxima', 'Maxima', 3)],
  },
  {
    id: 'piaggio',
    label: 'Piaggio',
    type: 'auto',
    models: [car('ape-city', 'Ape City', 3), car('ape-xtra', 'Ape Xtra', 3)],
  },
  {
    id: 'mahindra-3w',
    label: 'Mahindra',
    type: 'auto',
    models: [car('treo', 'Treo', 3), car('alfa', 'Alfa', 3)],
  },
  {
    id: 'tvs-3w',
    label: 'TVS',
    type: 'auto',
    models: [car('king', 'King', 3), car('king-ev-max', 'King EV Max', 3)],
  },
];

const BRANDS_BY_ID = new Map(VEHICLE_BRANDS.map((brand) => [brand.id, brand]));

export function findBrand(brandId: string): VehicleBrand | null {
  return BRANDS_BY_ID.get(brandId) ?? null;
}

export function findModel(brandId: string, modelId: string): VehicleModel | null {
  return findBrand(brandId)?.models.find((model) => model.id === modelId) ?? null;
}

/**
 * Indian registration marks, normalised.
 *
 * Two live formats:
 *   - state series   MH12AB1234  — state code, RTO number, series, 4 digits
 *   - Bharat series  22BH1234AA  — year, BH, 4 digits, 1–2 letter series
 *
 * Anything the user types is uppercased with separators stripped first, so
 * "TN 07 CV 1234", "tn-07-cv-1234" and "TN07CV1234" are one plate rather than
 * three rows that all look unique to the database.
 */
const STATE_SERIES = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
const BHARAT_SERIES = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

export function normalisePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidPlate(normalised: string): boolean {
  return STATE_SERIES.test(normalised) || BHARAT_SERIES.test(normalised);
}

/** Groups the plate back into readable segments for display. */
export function formatPlate(normalised: string): string {
  const state = normalised.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
  if (state) return `${state[1]} ${state[2]} ${state[3]} ${state[4]}`;

  const bharat = normalised.match(/^([0-9]{2})(BH)([0-9]{4})([A-Z]{1,2})$/);
  if (bharat) return `${bharat[1]} ${bharat[2]} ${bharat[3]} ${bharat[4]}`;

  return normalised;
}
