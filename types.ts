
export type Role = 'Super Admin' | 'Admin' | 'Section Leader' | 'Volunteer';
export type City = 'JHB' | 'BFN' | 'PTA';

export interface User {
  user_id: string;
  name: string;
  surname: string;
  cellphone: string;
  email: string;
  date_of_birth: string;
  zone_pastor: string;
  homecell_leader: string;
  shirt_size: string;
  main_station: string;
  city: City;
  role: Role;
  active_status: 'Active' | 'Inactive';
  created_at: string;
  profile_picture?: string; // Base64 or URL
}

export interface Availability {
  availability_id: string;
  user_id: string;
  month: string;
  year: number;
  date: string;
  is_available: boolean;
  service_times: string; // Comma separated
  rehearsal_available: boolean;
  city: City;
}

export interface Attendance {
  attendance_id: string;
  user_id: string;
  date: string;
  service_time: string;
  rehearsal: boolean;
  building: 'North' | 'South' | '';
  captured_by: string;
}

export interface Roster {
  roster_id: string;
  date: string;
  city: City;
  station: string;
  volunteer_1: string;
  volunteer_2: string;
}

export interface AdhocEvent {
  event_id: string;
  name: string;
  date: string;
  service_times: string;
}

export interface AdhocAvailability {
  adhoc_availability_id: string;
  event_id: string;
  user_id: string;
  service_time: string;
}

export interface AdhocRoster {
  adhoc_roster_id: string;
  event_id: string;
  service_time: string;
  station: string;
  volunteer_1: string;
  volunteer_2: string;
}

export interface VolunteerComment {
  comment_id: string;
  user_id: string;
  added_by: string;
  comment_text: string;
  date_added: string;
  city: City;
}

export interface Lookups {
  Cities: string[];
  Stations: string[];
  Roles: string[];
  ShirtSizes: string[];
}
