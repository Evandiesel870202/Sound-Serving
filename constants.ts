
import { City, Role } from './types';

export const CITIES: City[] = ['JHB', 'BFN', 'PTA'];

export const SERVICE_TIMES: Record<City, string[]> = {
  JHB: ['09:30', '17:00'],
  BFN: ['08:30', '11:00', '17:00'],
  PTA: ['08:30', '11:00', '17:00'],
};

export const STATIONS = [
  'FOH',
  'Monitors',
  'Broadcast',
  'Mothers/Toddlers',
  'New Volunteers Shadowing'
];

export const SHIRT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const ROLES: Role[] = ['Super Admin', 'Admin', 'Section Leader', 'Volunteer'];

export const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYED_APPS_SCRIPT_URL/exec";
