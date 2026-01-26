
import { City, Role } from './types';

/**
 * GOOGLE SHEETS CONFIGURATION
 * --------------------------
 * 1. Deploy the script provided in the instructions as a Web App.
 * 2. Replace the placeholder URL below with your actual Deployment URL.
 */
export const GOOGLE_SHEET_WEB_APP_URL = "REPLACE_WITH_YOUR_APPS_SCRIPT_URL";

export const CITIES: City[] = ['JHB', 'BFN', 'PTA'];
export const CITY_FILTERS: (City | 'ALL')[] = ['ALL', 'JHB', 'BFN', 'PTA'];

export const SERVICE_TIMES: Record<string, string[]> = {
  JHB: ['09:30', '17:00'],
  BFN: ['08:30', '11:00', '17:00'],
  PTA: ['08:30', '11:00', '17:00'],
  ALL: ['08:30', '09:30', '11:00', '17:00'], 
};

export const ROLES: Role[] = [
  'Super Admin', 
  'Admin', 
  'Section Leader', 
  '2IC', 
  'Volunteer', 
  'New Volunteer'
];

export const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
export const STATIONS = ['Monitors', 'FOH', 'Broadcast', 'Kids Church runner', 'Mothers and Toddlers'];
export const BFN_BUILDINGS = ['North', 'South'];

export const ETHNICITY_OPTIONS = ['White', 'Coloured', 'Black', 'Indian', 'Asian', 'Other'];
export const GENDER_OPTIONS = ['Male', 'Female'];
