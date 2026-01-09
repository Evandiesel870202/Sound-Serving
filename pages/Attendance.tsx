
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Attendance, User, City } from '../types';
import { SERVICE_TIMES, CITIES } from '../constants';

const AttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City>(currentUser?.city || 'JHB');
  
  // Selection filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceTime, setServiceTime] = useState(SERVICE_TIMES[selectedCity][0]);
  const [isRehearsal, setIsRehearsal] = useState(false);
  const [building, setBuilding] = useState<'North' | 'South' | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [u, a] = await Promise.all([
      googleSheetService.fetchTable<User>('Users'),
      googleSheetService.fetchTable<Attendance>('Attendance')
    ]);
    setUsers(u.filter(user => user.active_status === 'Active'));
    setAttendance(a);
    setLoading(false);
  };

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const targetCity = currentUser?.role === 'Super Admin' ? selectedCity : currentUser?.city;
  const filteredUsers = users.filter(u => u.city === targetCity);

  const isUserMarked = (userId: string) => {
    return attendance.some(a => 
      a.user_id === userId && 
      a.date === date && 
      a.service_time === serviceTime && 
      a.rehearsal === isRehearsal
    );
  };

  const toggleAttendance = async (userId: string) => {
    // Permission check: Volunteer can only mark themselves
    if (!isAdmin && userId !== currentUser?.user_id) return;

    const existing = attendance.find(a => 
      a.user_id === userId && 
      a.date === date && 
      a.service_time === serviceTime && 
      a.rehearsal === isRehearsal
    );

    if (existing) {
      // Logic for delete would go here if backend supported it, for now we just show it's there
      alert("Attendance already recorded for this person.");
      return;
    }

    const newEntry: Partial<Attendance> = {
      user_id: userId,
      date,
      service_time: serviceTime,
      rehearsal: isRehearsal,
      building: targetCity === 'BFN' ? building : '',
      captured_by: currentUser?.name + ' ' + currentUser?.surname
    };

    const success = await googleSheetService.appendRow('Attendance', newEntry);
    if (success) {
      setAttendance([...attendance, newEntry as Attendance]);
    }
  };

  if (loading) return <div className="text-center py-12">Loading Attendance...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Attendance Capture</h1>
          <p className="text-gray-500">Record who served on the platform.</p>
        </div>
        {currentUser?.role === 'Super Admin' && (
           <select 
            className="border border-brand-light rounded p-2 bg-white"
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value as City);
              setServiceTime(SERVICE_TIMES[e.target.value as City][0]);
            }}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-sm border border-brand-light grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Date</label>
          <input type="date" className="w-full border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Service Time</label>
          <select className="w-full border p-2 rounded" value={serviceTime} onChange={e => setServiceTime(e.target.value)}>
            {SERVICE_TIMES[targetCity as City]?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2 pb-2">
          <input type="checkbox" id="rehearsal" checked={isRehearsal} onChange={e => setIsRehearsal(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="rehearsal" className="text-sm font-bold">Is Rehearsal?</label>
        </div>
        {targetCity === 'BFN' && (
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Building</label>
            <select className="w-full border p-2 rounded" value={building} onChange={e => setBuilding(e.target.value as any)}>
              <option value="">Select Building</option>
              <option value="North">North</option>
              <option value="South">South</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow-sm border border-brand-light overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-black text-white">
            <tr>
              <th className="px-6 py-4">Volunteer</th>
              <th className="px-6 py-4">Station</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-light">
            {filteredUsers.map(u => {
              const checked = isUserMarked(u.user_id);
              const canEdit = isAdmin || u.user_id === currentUser?.user_id;

              return (
                <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold">{u.name} {u.surname}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{u.main_station}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      disabled={!canEdit || checked}
                      onClick={() => toggleAttendance(u.user_id)}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-brand-light'}
                        ${!canEdit && !checked ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                    >
                      {checked ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus"></i>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
