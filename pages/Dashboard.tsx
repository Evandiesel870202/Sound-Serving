
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { User, Roster, City } from '../types';
import { CITIES } from '../constants';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City>(currentUser?.city || 'JHB');
  const [users, setUsers] = useState<User[]>([]);
  const [roster, setRoster] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [u, r] = await Promise.all([
      googleSheetService.fetchTable<User>('Users'),
      googleSheetService.fetchTable<Roster>('Roster')
    ]);
    setUsers(u);
    setRoster(r);
    setLoading(false);
  };

  const cityFilteredUsers = users.filter(u => 
    (currentUser?.role === 'Super Admin' ? true : u.city === currentUser?.city) &&
    (currentUser?.role === 'Super Admin' ? u.city === selectedCity : true)
  );

  const activeVolunteers = cityFilteredUsers.filter(u => u.active_status === 'Active');

  const upcomingBirthdays = cityFilteredUsers.filter(u => {
    if (!u.date_of_birth) return false;
    const dob = new Date(u.date_of_birth);
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    
    // Check if birthday falls in the next 30 days regardless of year
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const birthdayNextYear = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    
    return (birthdayThisYear >= today && birthdayThisYear <= next30Days) || 
           (birthdayNextYear >= today && birthdayNextYear <= next30Days);
  });

  const getWeekRoster = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return roster.filter(r => {
      const rDate = new Date(r.date);
      return rDate >= startOfWeek && rDate <= endOfWeek && r.city === selectedCity;
    });
  };

  if (loading) return <div className="text-center py-12">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Overview</h1>
          <p className="text-gray-500">Welcome back, {currentUser?.name}.</p>
        </div>
        
        {currentUser?.role === 'Super Admin' && (
          <div className="flex items-center bg-white border border-brand-light rounded p-2 shadow-sm">
            <span className="text-xs font-bold mr-2 uppercase text-gray-400">Viewing City</span>
            <select 
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Active Volunteers</h3>
            <i className="fa-solid fa-users text-brand-black"></i>
          </div>
          <p className="text-4xl font-bold">{activeVolunteers.length}</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Upcoming Birthdays</h3>
            <i className="fa-solid fa-cake-candles text-brand-black"></i>
          </div>
          <p className="text-4xl font-bold">{upcomingBirthdays.length}</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-brand-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase">This Week's Services</h3>
            <i className="fa-solid fa-calendar-day text-brand-black"></i>
          </div>
          <p className="text-4xl font-bold">{getWeekRoster().length > 0 ? 'Active' : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Roster */}
        <div className="bg-white rounded shadow-sm border border-brand-light overflow-hidden">
          <div className="bg-brand-black text-white px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold">This Week's Roster ({selectedCity})</h3>
            <i className="fa-solid fa-clipboard-list"></i>
          </div>
          <div className="p-6">
            {getWeekRoster().length > 0 ? (
              <div className="space-y-4">
                {getWeekRoster().map(r => (
                  <div key={r.roster_id} className="flex justify-between items-center border-b border-brand-light pb-2">
                    <div>
                      <p className="font-bold">{r.station}</p>
                      <p className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{r.volunteer_1}</p>
                      <p className="text-sm font-medium">{r.volunteer_2}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 italic">No rosters found for this week.</p>
            )}
          </div>
        </div>

        {/* Upcoming Birthdays List */}
        <div className="bg-white rounded shadow-sm border border-brand-light overflow-hidden">
          <div className="bg-brand-dark text-white px-6 py-4 flex items-center justify-between">
            <h3 className="font-bold">Upcoming Birthdays (30 days)</h3>
            <i className="fa-solid fa-gift"></i>
          </div>
          <div className="p-6">
            {upcomingBirthdays.length > 0 ? (
              <ul className="space-y-4">
                {upcomingBirthdays.map(u => (
                  <li key={u.user_id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-bold">
                      {new Date(u.date_of_birth).getDate()}
                    </div>
                    <div>
                      <p className="font-bold">{u.name} {u.surname}</p>
                      <p className="text-xs text-gray-500">{new Date(u.date_of_birth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400 py-8 italic">No birthdays in the next 30 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
