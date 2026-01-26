
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { User, City } from '../types';
import { CITY_FILTERS } from '../constants';

const BirthdaysPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Added type assertion to allow comparison between 'City' and 'ALL' string
  const canSeeAll = currentUser?.role === 'Super Admin' || (currentUser?.city as string) === 'ALL';
  const [selectedCity, setSelectedCity] = useState<City | 'ALL'>(canSeeAll ? 'ALL' : (currentUser?.city || 'JHB'));

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const u = await googleSheetService.fetchTable<User>('Users');
    setUsers(u.filter(user => user.active_status === 'Active'));
    setLoading(false);
  };

  const cityFiltered = users.filter(u => {
    if (canSeeAll) {
      return selectedCity === 'ALL' ? true : u.city === selectedCity;
    }
    return u.city === currentUser?.city;
  });

  const monthBirthdays = cityFiltered.filter(u => {
    if (!u.date_of_birth) return false;
    const dob = new Date(u.date_of_birth);
    return dob.getMonth() === nextMonth.getMonth();
  }).sort((a, b) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());

  if (loading) return <div className="text-center py-12">Loading Birthdays...</div>;

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Birthday Calendar</h1>
          <p className="text-gray-500">Upcoming birthdays for <strong>{nextMonthName}</strong> {selectedCity === 'ALL' ? 'across all campuses' : `at ${selectedCity}`}.</p>
        </div>
        
        {canSeeAll && (
           <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-gray-400">Campus Filter</span>
            <select 
              className="border border-brand-light rounded p-2 bg-white font-bold"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City | 'ALL')}
            >
              {CITY_FILTERS.map(c => <option key={c} value={c}>{c === 'ALL' ? 'ALL CITIES' : c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {monthBirthdays.map(u => {
          const dob = new Date(u.date_of_birth);
          return (
            <div key={u.user_id} className="bg-white p-6 rounded shadow-sm border border-brand-light flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-2xl font-bold text-brand-black mb-4">
                {dob.getDate()}
              </div>
              <h4 className="font-bold text-lg">{u.name} {u.surname}</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{u.city}</p>
              <p className="text-sm text-gray-500 mb-1">{u.main_station}</p>
              <div className="mt-4 pt-4 border-t border-brand-light w-full">
                <p className="text-xs font-bold text-gray-400 uppercase">Cellphone</p>
                <p className="text-sm">{u.cellphone}</p>
              </div>
            </div>
          );
        })}
        {monthBirthdays.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 italic">
            No birthdays found for {nextMonthName} {selectedCity === 'ALL' ? 'in any campus' : `in ${selectedCity}`}.
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdaysPage;
