/** Static content of the original Quanta S+ screens. Values come from the supplied source document. */

export interface Row {
  label: string;
  value: string;
}

export interface SafetyItem {
  title: string;
  description: string;
}

export const QUANTA_STATS = [
  { value: '165', label: 'KM RANGE' },
  { value: '75', label: 'KM/H' },
  { value: '4', label: 'KW MOTOR' },
] as const;

export const BATTERY_INTRO = 'Quanta S+ uses an LMFP battery designed for durability and thermal stability.';

export const BATTERY_ROWS: readonly Row[] = [
  { label: 'Range', value: 'Up to 165 km' },
  { label: '20–90% Charging', value: '3.46 hrs' },
  { label: '0–100% Charging', value: '5.4 hrs' },
  { label: 'Battery Warranty', value: '3 Years / 30,000 km' },
];

export const PERFORMANCE_ROWS: readonly Row[] = [
  { label: 'Motor', value: '4 kW BLDC Hub' },
  { label: 'Max Torque', value: '172 Nm at wheel' },
  { label: 'Top Speed', value: '75 km/h' },
  { label: 'Gradability', value: '33%' },
  { label: 'Riding Modes', value: 'Eco · Power · Sport' },
  { label: 'Wheel Size', value: '17-inch Alloy' },
];

export const SAFETY_ITEMS: readonly SafetyItem[] = [
  { title: '🛡 Rib-Caged Chassis', description: 'Designed for strength and protection of internal components.' },
  { title: '🛑 Dual Disc Brakes with CBS', description: 'Designed for controlled and safer braking.' },
  { title: '🏍 17-inch Alloy Wheels', description: 'Large wheels designed for stability and handling.' },
  { title: '⚡ LMFP Battery', description: 'Advanced battery chemistry with thermal protection features.' },
];

export interface SelectOption {
  value: string;
  label: string;
}

export const RIDE_MODEL_OPTIONS: readonly SelectOption[] = [
  { value: 'Quanta S+', label: 'Quanta S+ — 165 km Range' },
  { value: 'Quanta S', label: 'Quanta S — 125 km Range' },
];

export const SHOWROOM_MODEL_OPTIONS: readonly SelectOption[] = [
  ...RIDE_MODEL_OPTIONS,
  { value: 'Not sure', label: 'Not sure' },
];
