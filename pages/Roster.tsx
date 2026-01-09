
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Roster, User, Availability, City } from '../types';
import { CITIES, STATIONS } from '../constants';

const RosterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City>(currentUser?.city || 'JHB');
  const [selectedDate, setSelectedDate] = useState('');

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
    setUsers(u);
    setAvailability(a);
    setRosters(r);
    setLoading(false);
  };

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Section Leader';
  const targetCity = currentUser?.role === 'Super Admin' ? selectedCity : currentUser?.city;

  const getAvailableVolunteers = (date: string) => {
    const availEntries = availability.filter(a => a.date === date && a.city === targetCity && a.is_available);
    const availUserIds = availEntries.map(a => a.user_id);
    return users.filter(u => availUserIds.includes(u.user_id));
  };

  const handleRosterChange = async (station: string, v1: string, v2: string) => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    const newRoster: Partial<Roster> = {
      date: selectedDate,
      city: targetCity as City,
      station,
      volunteer_1: v1,
      volunteer_2: v2
    };

    const success = await googleSheetService.appendRow('Roster', newRoster);
    if (success) {
      setRosters([...rosters, newRoster as Roster]);
      alert(`Roster updated for ${station}`);
    }
  };

  const currentDayRoster = rosters.filter(r => r.date === selectedDate && r.city === targetCity);
  const availableVolunteers = getAvailableVolunteers(selectedDate);

  if (loading) return <div className="text-center py-12">Loading Roster Builder...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Roster Builder</h1>
          <p className="text-gray-500">Plan and assign volunteers to stations.</p>
        </div>
        
        <div className="flex gap-2">
          {currentUser?.role === 'Super Admin' && (
            <select 
              className="border border-brand-light rounded p-2 bg-white"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input 
            type="date" 
            className="border border-brand-light rounded p-2 bg-white"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {!selectedDate && (
        <div className="text-center py-20 bg-white rounded border border-dashed border-brand-light">
          <i className="fa-solid fa-calendar-pointer text-4xl text-gray-200 mb-4"></i>
          <p className="text-gray-400">Select a date to begin rostering.</p>
        </div>
      )}

      {selectedDate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATIONS.map(station => {
            const current = currentDayRoster.find(r => r.station === station) || { volunteer_1: '', volunteer_2: '' };
            const [v1, setV1] = useState(current.volunteer_1);
            const [v2, setV2] = useState(current.volunteer_2);

            return (
              <div key={station} className="bg-white p-6 rounded shadow-sm border border-brand-light">
                <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                  {station}
                  <i className="fa-solid fa-headphones text-xs text-gray-300"></i>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Volunteer 1</label>
                    <select 
                      disabled={!isAdmin}
                      className="w-full border p-2 rounded bg-gray-50 mt-1"
                      value={v1}
                      onChange={(e) => setV1(e.target.value)}
                    >
                      <option value="">None</option>
                      {availableVolunteers.map(v => (
                        <option key={v.user_id} value={`${v.name} ${v.surname}`}>
                          {v.name} {v.surname} ({v.main_station})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Volunteer 2</label>
                    <select 
                      disabled={!isAdmin}
                      className="w-full border p-2 rounded bg-gray-50 mt-1"
                      value={v2}
                      onChange={(e) => setV2(e.target.value)}
                    >
                      <option value="">None</option>
                      {availableVolunteers.map(v => (
                        <option key={v.user_id} value={`${v.name} ${v.surname}`}>
                          {v.name} {v.surname} ({v.main_station})
                        </option>
                      ))}
                    </select>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleRosterChange(station, v1, v2)}
                      className="w-full bg-brand-black text-white p-2 rounded font-bold mt-2 hover:bg-brand-dark transition-colors"
                    >
                      Update {station}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RosterPage;
