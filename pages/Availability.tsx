
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Availability, City, User } from '../types';
import { SERVICE_TIMES, CITIES } from '../constants';

const AvailabilityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [allAvailability, setAllAvailability] = useState<Availability[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  
  // Management roles
  const isManagement = currentUser && ['Super Admin', 'Admin', 'Section Leader'].includes(currentUser.role);
  
  // Force selection for Super Admin/ALL users
  const userCity = currentUser?.city as string;
  const initialCity = userCity === 'ALL' ? null : (userCity as City);
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity);

  // Month config (always for next month)
  const today = new Date();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
  const monthYear = nextMonthDate.getFullYear();

  // Selected dates/times for personal submission
  const [selections, setSelections] = useState<Record<string, { serviceTimes: string[], rehearsal: boolean }>>({});

  useEffect(() => {
    fetchData();
  }, [currentUser?.user_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availData, userData] = await Promise.all([
        googleSheetService.fetchTable<Availability>('Availability'),
        googleSheetService.fetchTable<User>('Users')
      ]);
      
      setAllAvailability(availData || []);
      setAllUsers(userData || []);

      // Initialize personal selections
      if (currentUser?.user_id) {
        const userMonth = (availData || []).filter(a => 
          (String(a.user_id) === String(currentUser?.user_id)) && 
          String(a.month).toLowerCase() === monthName.toLowerCase() && 
          Number(a.year) === monthYear
        );

        if (userMonth.length > 0) {
          const initialSelections: any = {};
          userMonth.forEach(a => {
            initialSelections[a.date] = {
              serviceTimes: a.service_times ? String(a.service_times).split(',').filter(Boolean) : [],
              rehearsal: String(a.rehearsal_available).toUpperCase() === 'TRUE' || a.rehearsal_available === true
            };
          });
          setSelections(initialSelections);
        }
      }
    } catch (error) {
      console.error("[Availability] Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSundaysAndThursdays = (month: number, year: number) => {
    const dates = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 0 || date.getDay() === 4) { // 0 = Sun, 4 = Thu
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const targetDates = getSundaysAndThursdays(nextMonthDate.getMonth(), monthYear);

  const toggleTime = (dateStr: string, time: string) => {
    if (submitting) return; 
    setSelections(prev => {
      const current = prev[dateStr] || { serviceTimes: [], rehearsal: false };
      const times = current.serviceTimes.includes(time)
        ? current.serviceTimes.filter(t => t !== time)
        : [...current.serviceTimes, time];
      return { ...prev, [dateStr]: { ...current, serviceTimes: times } };
    });
  };

  const toggleRehearsal = (dateStr: string) => {
    if (submitting) return;
    setSelections(prev => {
      const current = prev[dateStr] || { serviceTimes: [], rehearsal: false };
      return { ...prev, [dateStr]: { ...current, rehearsal: !current.rehearsal } };
    });
  };

  const saveAvailability = async () => {
    if (!currentUser?.user_id || !selectedCity) return;
    
    const entriesToSave = (Object.entries(selections) as [string, { serviceTimes: string[], rehearsal: boolean }][]).filter(([_, data]) => 
      data.serviceTimes.length > 0 || data.rehearsal
    );

    if (entriesToSave.length === 0) {
      alert("Please select at least one date before saving.");
      return;
    }

    setSubmitting(true);
    const rows = entriesToSave.map(([date, data]) => ({
      user_id: String(currentUser.user_id),
      month: monthName,
      year: monthYear,
      date: date,
      is_available: "TRUE",
      service_times: data.serviceTimes.join(','),
      rehearsal_available: data.rehearsal ? "TRUE" : "FALSE",
      city: selectedCity // Save for the campus currently filtered
    }));

    try {
      const success = await googleSheetService.batchAppend('Availability', rows);
      if (success) {
        alert("Availability submitted successfully!");
        await fetchData();
      }
    } catch (error) {
      alert("Failed to save availability.");
    } finally {
      setSubmitting(false);
    }
  };

  // Team Overview Logic
  const filteredUsers = allUsers.filter(u => {
    return u.city === selectedCity;
  }).filter(u => u.status === 'Active' || u.active_status === 'Active');

  const getAvailForUserDate = (userId: string, dateStr: string) => {
    return allAvailability.find(a => 
      String(a.user_id) === String(userId) && 
      a.date === dateStr &&
      String(a.month).toLowerCase() === monthName.toLowerCase() &&
      Number(a.year) === monthYear &&
      a.city === selectedCity
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-10 h-10 border-4 border-brand-black border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Availability...</p>
    </div>
  );

  // If no city selected (forced for Super Admin)
  if (!selectedCity) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black tracking-tighter uppercase">Select Campus</h2>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Please choose a campus to view or manage availability</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className="group relative bg-white border-2 border-brand-light p-12 rounded-[3rem] shadow-xl hover:border-brand-black hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="relative z-10">
                <i className="fa-solid fa-location-dot text-4xl mb-6 text-gray-200 group-hover:text-brand-black transition-colors"></i>
                <h3 className="text-3xl font-black tracking-tighter uppercase">{city}</h3>
              </div>
              <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center space-x-6">
           {userCity === 'ALL' && (
             <button 
                onClick={() => setSelectedCity(null)}
                className="w-12 h-12 rounded-2xl bg-white border border-brand-light flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                title="Change Campus"
             >
               <i className="fa-solid fa-chevron-left text-xs"></i>
             </button>
           )}
           <div>
            <h1 className="text-4xl font-black text-brand-black uppercase tracking-tighter leading-none">Availability</h1>
            <p className="text-gray-500 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">
              Campus: <span className="text-brand-black">{selectedCity}</span> • For <span className="text-brand-black">{monthName} {monthYear}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isManagement && (
            <div className="bg-white p-1 rounded-xl border border-brand-light shadow-sm flex items-center">
              <button 
                onClick={() => setViewMode('personal')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'personal' ? 'bg-brand-black text-white shadow-md' : 'text-gray-400 hover:text-brand-black'}`}
              >
                My Entry
              </button>
              <button 
                onClick={() => setViewMode('team')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'team' ? 'bg-brand-black text-white shadow-md' : 'text-gray-400 hover:text-brand-black'}`}
              >
                Team Overview
              </button>
            </div>
          )}
          
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-brand-light rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-400"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>
        </div>
      </div>

      {/* Team Mode View */}
      {viewMode === 'team' && isManagement ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {targetDates.map(date => {
              const dStr = date.toISOString().split('T')[0];
              const count = allAvailability.filter(a => 
                a.date === dStr && 
                a.city === selectedCity &&
                String(a.month).toLowerCase() === monthName.toLowerCase()
              ).length;
              
              return (
                <div key={dStr} className="bg-white p-4 rounded-2xl border border-brand-light shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase">{date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</p>
                  <p className="text-xl font-black mt-1">{count}</p>
                  <p className="text-[8px] font-bold text-gray-300 uppercase">Available</p>
                </div>
              );
            })}
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-brand-light overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-black text-white">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-brand-black z-10">Volunteer</th>
                    {targetDates.map(date => (
                      <th key={date.toISOString()} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center min-w-[80px]">
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}<br/>
                        <span className="opacity-60">{date.getDate()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-light">
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-brand-light">
                        <p className="font-black text-xs leading-none">{user.name} {user.surname}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{user.main_station}</p>
                      </td>
                      {targetDates.map(date => {
                        const dStr = date.toISOString().split('T')[0];
                        const avail = getAvailForUserDate(user.user_id, dStr);
                        
                        return (
                          <td key={dStr} className="px-4 py-4 text-center">
                            {avail ? (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <div className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center text-[10px]">
                                  <i className="fa-solid fa-check"></i>
                                </div>
                                {String(avail.rehearsal_available).toUpperCase() === "TRUE" && (
                                  <span className="text-[8px] font-black text-brand-black bg-brand-light px-1.5 py-0.5 rounded uppercase">Reh</span>
                                )}
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-100 mx-auto"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={targetDates.length + 1} className="py-24 text-center text-gray-400 italic">No active volunteers found for {selectedCity}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Personal Mode View */
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {targetDates.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const isSunday = date.getDay() === 0;
              const current = selections[dateStr] || { serviceTimes: [], rehearsal: false };
              const hasSelection = current.serviceTimes.length > 0 || current.rehearsal;
              const availableTimes = SERVICE_TIMES[selectedCity as City] || SERVICE_TIMES['JHB'];

              return (
                <div key={dateStr} className={`
                  group bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all duration-300
                  ${hasSelection ? 'border-brand-black ring-8 ring-brand-black/5 -translate-y-1' : 'border-brand-light'}
                  ${submitting ? 'opacity-50 grayscale' : ''}
                `}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-xl leading-none text-brand-black uppercase tracking-tighter">{date.toLocaleDateString(undefined, { weekday: 'short' })}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-1.5 tracking-widest">{date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isSunday ? 'bg-brand-black text-white shadow-md' : 'bg-brand-light text-gray-500'}`}>
                      {isSunday ? 'Service' : 'Practice'}
                    </div>
                  </div>

                  {isSunday ? (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Select Slots</p>
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          disabled={submitting}
                          onClick={() => toggleTime(dateStr, time)}
                          className={`
                            w-full px-4 py-3 rounded-xl text-[11px] font-black transition-all border-2 flex justify-between items-center
                            ${current.serviceTimes.includes(time) 
                              ? 'bg-brand-black text-white border-brand-black shadow-xl' 
                              : 'bg-white text-brand-black border-brand-light hover:border-brand-black'}
                          `}
                        >
                          {time}
                          {current.serviceTimes.includes(time) && <i className="fa-solid fa-check text-[9px]"></i>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3">Rehearsal Availability</p>
                      <button
                        disabled={submitting}
                        onClick={() => toggleRehearsal(dateStr)}
                        className={`
                          w-full p-4 rounded-xl text-[11px] font-black transition-all border-2 flex items-center justify-between
                          ${current.rehearsal 
                            ? 'bg-brand-black text-white border-brand-black shadow-xl' 
                            : 'bg-white text-brand-black border-brand-light hover:border-brand-black'}
                        `}
                      >
                        <span>AVAILABLE</span>
                        {current.rehearsal ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus opacity-20"></i>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
            <button
              onClick={saveAvailability}
              disabled={submitting}
              className={`
                w-full bg-brand-black text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center space-x-4
                ${submitting ? 'opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95'}
              `}
            >
              {submitting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Submit {selectedCity} Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
