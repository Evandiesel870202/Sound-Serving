
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService, isConfigured } from '../services/googleSheetService';
import { User, Roster, City } from '../types';
import { CITY_FILTERS } from '../constants';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const isLinked = isConfigured();
  
  const canSeeAll = currentUser?.role === 'Super Admin' || (currentUser?.city as string) === 'ALL';
  const [selectedCity, setSelectedCity] = useState<City>(canSeeAll ? 'ALL' : (currentUser?.city || 'JHB'));
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
    setUsers(u || []);
    setRoster(r || []);
    setLoading(false);
  };

  const cityFilteredUsers = (users || []).filter(u => {
    if (canSeeAll) {
      return selectedCity === 'ALL' ? true : u.city === selectedCity;
    }
    return u.city === currentUser?.city;
  });

  const activeVolunteers = cityFilteredUsers.filter(u => u.active_status === 'Active' || u.status === 'Active');

  const upcomingBirthdays = cityFilteredUsers.filter(u => {
    if (!u.date_of_birth) return false;
    const dob = new Date(u.date_of_birth);
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const birthdayNextYear = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    
    return (birthdayThisYear >= today && birthdayThisYear <= next30Days) || 
           (birthdayNextYear >= today && birthdayNextYear <= next30Days);
  });

  const getWeekRoster = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return (roster || []).filter(r => {
      const rDate = new Date(r.date);
      const isDateMatch = rDate >= startOfWeek && rDate <= endOfWeek;
      const isCityMatch = selectedCity === 'ALL' ? true : r.city === selectedCity;
      return isDateMatch && isCityMatch;
    });
  };

  if (loading) return <div className="text-center py-12">Loading Dashboard...</div>;

  const currentWeekRoster = getWeekRoster();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-black uppercase tracking-tighter">Dashboard</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Welcome, {currentUser?.name}. Current view: {selectedCity === 'ALL' ? 'All Campuses' : selectedCity}.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isLinked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <i className={`fa-solid ${isLinked ? 'fa-cloud' : 'fa-cloud-slash'} text-xs`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">{isLinked ? 'Cloud Connected' : 'Local Storage'}</span>
          </div>

          {canSeeAll && (
            <div className="flex items-center bg-white border border-brand-light rounded-xl p-2 shadow-sm">
              <select 
                className="bg-transparent font-black text-[10px] uppercase tracking-widest focus:outline-none cursor-pointer px-2"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as City)}
              >
                {CITY_FILTERS.map(c => <option key={c} value={c}>{c === 'ALL' ? 'ALL CITIES' : c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-light flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Database Health</h3>
          <div className="flex items-center justify-between">
             <p className="text-2xl font-black">{isLinked ? 'LIVE' : 'MOCK'}</p>
             <i className="fa-solid fa-server text-brand-black/10 text-3xl"></i>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-light flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active Volunteers</h3>
          <div className="flex items-center justify-between">
             <p className="text-2xl font-black">{activeVolunteers.length}</p>
             <i className="fa-solid fa-users text-brand-black/10 text-3xl"></i>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-light flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Upcoming Birthdays</h3>
          <div className="flex items-center justify-between">
             <p className="text-2xl font-black">{upcomingBirthdays.length}</p>
             <i className="fa-solid fa-cake-candles text-brand-black/10 text-3xl"></i>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-light flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Weekly Slots</h3>
          <div className="flex items-center justify-between">
             <p className="text-2xl font-black">{currentWeekRoster.length}</p>
             <i className="fa-solid fa-calendar-check text-brand-black/10 text-3xl"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] shadow-sm border border-brand-light overflow-hidden">
          <div className="bg-brand-black text-white px-8 py-6 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-widest">Sunday Roster ({selectedCity})</h3>
            <i className="fa-solid fa-clipboard-list text-sm"></i>
          </div>
          <div className="p-8">
            {currentWeekRoster.length > 0 ? (
              <div className="space-y-4">
                {currentWeekRoster.map(r => (
                  <div key={r.roster_id} className="flex justify-between items-center border-b border-brand-light pb-4 last:border-0">
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight">{r.station}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(r.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-brand-black">{r.volunteer_1}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{r.volunteer_2 || 'Solo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <i className="fa-solid fa-calendar-xmark text-brand-light text-4xl"></i>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No rosters found for this week.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-brand-light overflow-hidden">
          <div className="bg-brand-dark text-white px-8 py-6 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-widest">Upcoming Birthdays</h3>
            <i className="fa-solid fa-gift text-sm"></i>
          </div>
          <div className="p-8">
            {upcomingBirthdays.length > 0 ? (
              <ul className="space-y-6">
                {upcomingBirthdays.map(u => (
                  <li key={u.user_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center font-black text-lg text-brand-black">
                        {new Date(u.date_of_birth).getDate()}
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase">{u.name} {u.surname}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(u.date_of_birth).toLocaleDateString(undefined, { month: 'long' })}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-brand-white bg-brand-black px-2 py-1 rounded-lg uppercase tracking-widest">{u.city}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 space-y-3">
                <i className="fa-solid fa-cake-candles text-brand-light text-4xl"></i>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No birthdays this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
