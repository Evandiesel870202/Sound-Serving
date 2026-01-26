
export type Role = 'Super Admin' | 'Admin' | 'Section Leader' | 'Volunteer' | '2IC' | 'New Volunteer';
export type City = 'JHB' | 'BFN' | 'PTA' | 'ALL';

export interface User {
  user_id: string;
  name: string;
  surname: string;
  gender?: string;
  ethnicity?: string;
  cellphone: string;
  email: string;
  suburb?: string;
  date_of_birth?: string;
  member_of_crc?: boolean;
  zone_pastor?: string;
  homecell_leader?: string;
  zone?: string;
  shirt_size?: string;
  main_station?: string;
  start_date?: string;
  city: City;
  role: Role;
  status: 'Active' | 'Inactive';
  // Added active_status to resolve errors where components refer to this property instead of 'status'
  active_status?: 'Active' | 'Inactive';
  popia_consent: boolean;
  profile_picture?: string;
  created_at: string;
}

export interface Availability {
  id: string;
  user_id: string;
  month: string;
  year: number;
  date: string;
  is_available: boolean | string;
  service_times: string;
  rehearsal_available: boolean | string;
  city?: City;
}

export interface Event {
  event_id: string;
  city: City;
  name: string;
  date: string;
  type: 'Sunday' | 'AdHoc';
  service_times: string;
}

// Updated Roster interface to include building, runner, and shadow properties
export interface Roster {
  roster_id: string;
  date: string;
  city: City;
  station: string;
  volunteer_1: string;
  volunteer_2: string;
  building?: string;
  runner?: string;
  shadow?: string;
}

export interface RosterAssignment {
  roster_id: string;
  event_id: string;
  user_id: string;
  station: string;
  assignment_type: 'Primary' | 'Runner' | 'Shadow';
  service_time: string;
}

// Added missing Attendance interface used by Attendance and Reports pages
export interface Attendance {
  id?: string;
  user_id: string;
  date: string;
  service_time: string;
  rehearsal: boolean;
  building?: string;
  captured_by: string;
}

export interface Training {
  id: string;
  city: City;
  name: string;
  station: string;
  due_date: string;
  description: string;
  url?: string;
}

export interface Announcement {
  id: string;
  city: City;
  title: string;
  content: string;
  type: string;
  event_date?: string;
}

// Added missing Adhoc interfaces used by Adhoc page
export interface AdhocEvent {
  event_id: string;
  name: string;
  date: string;
  service_times: string;
}

export interface AdhocAvailability {
  id?: string;
  event_id: string;
  user_id: string;
  service_time: string;
}

// Added missing VolunteerComment interface used by Comments page
export interface VolunteerComment {
  comment_id: string;
  user_id: string;
  added_by: string;
  comment_text: string;
  date_added: string;
  city: City;
}