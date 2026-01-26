
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Roster, User, Availability, City } from '../types';
import { CITIES, STATIONS, BFN_BUILDINGS } from '../constants';

interface StationCardProps {
  station: string;
  current: { volunteer_1: string; volunteer_2: string; runner?: string; shadow?: string };
  isAdmin: boolean;
  availableVolunteers: (User & { hasRehearsal: boolean })[];
  isNewVolunteerStation?: boolean;
  onUpdate: (station: string, data: any) => Promise<void>;
}

const StationCard: React.FC<StationCardProps> = ({ station, current, isAdmin, availableVolunteers, isNewVolunteerStation, onUpdate }) => {
  const [v1, setV1] = useState(current.volunteer_1 || '');
  const [v2, setV2] = useState(current.volunteer_2 || '');
  const [runner, setRunner] = useState(current.runner || '');
  const [shadow, setShadow] = useState(current.shadow || '');

  // Filter logic: New volunteers only in shadow, others elsewhere
  const pool = availableVolunteers.filter(v => {
    if (isNewVolunteerStation) return v.role === 'New Volunteer';
    return v.role !== 'New Volunteer';
  });

  const getDropdownLabel = (v: User & { hasRehearsal: boolean }) => 
    `${v.name} ${v.surname} - ${v.main_station} (${v.hasRehearsal ? 'Y' : 'N'})`;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-light space-y-6">
      <h3 className="font-black text-lg tracking-tighter uppercase border-b border-brand-light pb-4">{station}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black text-gray-300 uppercase block mb-1">Volunteer 1</label>
          <select disabled={!isAdmin} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs" value={v1} onChange={e => setV1(e.target.value)}>
            <option value="">-- UNASSIGNED --</option>
            {pool.map(v => <option key={v.user_id} value={`${v.name} ${v.surname}`}>{getDropdownLabel(v)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black text-gray-300 uppercase block mb-1">Volunteer 2</label>
          <select disabled={!isAdmin} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs" value={v2} onChange={e => setV2(e.target.value)}>
            <option value="">-- UNASSIGNED --</option>
            {pool.map(v => <option key={v.user_id} value={`${v.name} ${v.surname}`}>{getDropdownLabel(v)}</option>)}
          </select>
        </div>
        {!isNewVolunteerStation && (
          <div>
            <label className="text-[9px] font-black text-gray-300 uppercase block mb-1">Runner</label>
            <select disabled={!isAdmin} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs" value={runner} onChange={e => setRunner(e.target.value)}>
              <option value="">-- UNASSIGNED --</option>
              {availableVolunteers.map(v => <option key={v.user_id} value={`${v.name} ${v.surname}`}>{getDropdownLabel(v)}</option>)}
            </select>
          </div>
        )}
        {!isNewVolunteerStation && (
           <div>
             <label className="text-[9px] font-black text-gray-300 uppercase block mb-1">New Volunteer Shadow</label>
             <select disabled={!isAdmin} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs" value={shadow} onChange={e => setShadow(e.target.value)}>
               <option value="">-- UNASSIGNED --</option>
               {availableVolunteers.filter(v => v.role === 'New Volunteer').map(v => <option key={v.user_id} value={`${v.name} ${v.surname}`}>{getDropdownLabel(v)}</option>)}
             </select>
           </div>
        )}
      </div>

      {isAdmin && (
        <button onClick={() => onUpdate(station, { v1, v2, runner, shadow })} className="w-full bg-brand-black text-white p-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">Save Slot</button>
      )}
    </div>
  );
};

const RosterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCity, setSelectedCity] = useState<City | null>(currentUser?.city === 'ALL' ? null : (currentUser?.city as City));
  const [selectedBuilding, setSelectedBuilding] = useState<string>('North');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isAdmin = ['Super Admin', 'Admin', 'Section Leader'].includes(currentUser?.role || '');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [u, a, r] = await Promise.all([
      googleSheetService.fetchTable<User>('Users'),
      googleSheetService.fetchTable<Availability>('Availability'),
      googleSheetService.fetchTable<Roster>('Roster')
    ]);
    setUsers(u || []);
    setAvailability(a || []);
    setRosters(r || []);
    setLoading(false);
  };

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const getSundays = () => {
    const d = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const sundays = [];
    while (d.getMonth() === nextMonth.getMonth()) {
      if (d.getDay() === 0) sundays.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return sundays;
  };

  const getAvailableVolunteersForDate = (dateStr: string) => {
    const availEntries = availability.filter(a => a.date === dateStr && a.city === selectedCity && (a.is_available === "TRUE" || a.is_available === true));
    
    // Find the Thursday before this date
    const targetDate = new Date(dateStr);
    const thursdayDate = new Date(targetDate);
    thursdayDate.setDate(targetDate.getDate() - 3); // Sun -> Thu is -3 days
    const thursStr = thursdayDate.toISOString().split('T')[0];

    return users.filter(u => availEntries.some(a => String(a.user_id) === String(u.user_id))).map(u => ({
      ...u,
      hasRehearsal: availability.some(a => String(a.user_id) === String(u.user_id) && a.date === thursStr && (a.rehearsal_available === "TRUE" || a.rehearsal_available === true))
    }));
  };

  const handleUpdate = async (station: string, data: any) => {
    if (!selectedDate || !selectedCity) return;
    
    // Validation: Min 1 for core stations
    if (['FOH', 'Monitors', 'Broadcast'].includes(station) && !data.v1 && !data.v2) {
      alert(`Critical Error: At least one person must be rostered for ${station}`);
      return;
    }

    const roster_id = `${selectedDate}-${selectedCity}-${station}-${selectedBuilding}`.replace(/\s/g, '-');
    const entry = {
      roster_id,
      date: selectedDate,
      city: selectedCity,
      station: station,
      building: selectedCity === 'BFN' ? selectedBuilding : '',
      volunteer_1: data.v1,
      volunteer_2: data.v2,
      runner: data.runner,
      shadow: data.shadow
    };

    await googleSheetService.updateRow('Roster', roster_id, 'roster_id', entry);
    fetchData();
  };

  if (!selectedCity) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter">Select Campus</h2>
        <div className="grid grid-cols-3 gap-6">
          {CITIES.map(c => (
            <button key={c} onClick={() => setSelectedCity(c)} className="p-12 bg-white border-2 border-brand-light rounded-[3rem] text-2xl font-black uppercase hover:border-brand-black transition-all">{c}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Roster Builder</h1>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">{selectedCity} Campus • {nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-4">
          {selectedCity === 'BFN' && (
            <select className="p-4 bg-white border border-brand-light rounded-2xl font-black text-xs" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
              {BFN_BUILDINGS.map(b => <option key={b} value={b}>{b} Building</option>)}
            </select>
          )}
          <button onClick={() => setSelectedCity(null)} className="p-4 bg-white border border-brand-light rounded-2xl text-[10px] font-black uppercase tracking-widest">Change City</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {getSundays().map(sun => {
          const s = sun.toISOString().split('T')[0];
          return (
            <button key={s} onClick={() => setSelectedDate(s)} className={`px-8 py-6 rounded-[2rem] border-2 transition-all min-w-[150px] ${selectedDate === s ? 'bg-brand-black text-white border-brand-black shadow-xl' : 'bg-white border-brand-light text-gray-400'}`}>
              <p className="text-[10px] font-black uppercase opacity-50">{sun.toLocaleDateString(undefined, { weekday: 'short' })}</p>
              <p className="text-2xl font-black tracking-tighter">{sun.getDate()}</p>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STATIONS.map(st => {
            const current = rosters.find(r => r.date === selectedDate && r.station === st && (selectedCity === 'BFN' ? r.building === selectedBuilding : true)) || {};
            return (
              <StationCard 
                key={st}
                station={st}
                isAdmin={isAdmin}
                current={current as any}
                availableVolunteers={getAvailableVolunteersForDate(selectedDate)}
                onUpdate={handleUpdate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RosterPage;
