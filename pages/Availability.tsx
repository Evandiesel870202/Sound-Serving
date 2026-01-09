
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { googleSheetService } from '../services/googleSheetService';
import { Availability, City } from '../types';
import { SERVICE_TIMES } from '../constants';

const AvailabilityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [existingAvail, setExistingAvail] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Month config (always for next month)
  const today = new Date();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
  const monthYear = nextMonthDate.getFullYear();

  // Selected dates/times
  const [selections, setSelections] = useState<Record<string, { serviceTimes: string[], rehearsal: boolean }>>({});

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    const all = await googleSheetService.fetchTable<Availability>('Availability');
    const userMonth = all.filter(a => 
      a.user_id === currentUser?.user_id && 
      a.month === monthName && 
      a.year === monthYear
    );
    setExistingAvail(userMonth);
    
    // Convert existing to selections
    const initialSelections: any = {};
    userMonth.forEach(a => {
      initialSelections[a.date] = {
        serviceTimes: a.service_times.split(',').filter(Boolean),
        rehearsal: a.rehearsal_available
      };
    });
    setSelections(initialSelections);
    setLoading(false);
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
    if (existingAvail.length > 0) return; // Locked

    setSelections(prev => {
      const current = prev[dateStr] || { serviceTimes: [], rehearsal: false };
      const times = current.serviceTimes.includes(time)
        ? current.serviceTimes.filter(t => t !== time)
        : [...current.serviceTimes, time];
      
      return { ...prev, [dateStr]: { ...current, serviceTimes: times } };
    });
  };

  const toggleRehearsal = (dateStr: string) => {
    if (existingAvail.length > 0) return; // Locked
    setSelections(prev => {
      const current = prev[dateStr] || { serviceTimes: [], rehearsal: false };
      return { ...prev, [dateStr]: { ...current, rehearsal: !current.rehearsal } };
    });
  };

  const saveAvailability = async () => {
    setSubmitting(true);
    // Fixed: Explicitly casting Object.entries to ensure 'data' is typed correctly and not 'unknown'
    const rows = (Object.entries(selections) as Array<[string, { serviceTimes: string[], rehearsal: boolean }]>).map(([date, data]) => ({
      user_id: currentUser?.user_id,
      month: monthName,
      year: monthYear,
      date,
      is_available: data.serviceTimes.length > 0 || data.rehearsal,
      service_times: data.serviceTimes.join(','),
      rehearsal_available: data.rehearsal,
      city: currentUser?.city
    }));

    const results = await Promise.all(rows.map(row => googleSheetService.appendRow('Availability', row)));
    if (results.every(r => r)) {
      alert("Availability saved and locked.");
      fetchAvailability();
    } else {
      alert("Some records failed to save.");
    }
    setSubmitting(false);
  };

  const isLocked = existingAvail.length > 0;
  const availableTimes = SERVICE_TIMES[currentUser?.city || 'JHB'];

  if (loading) return <div className="text-center py-12">Loading Availability Form...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-black">Monthly Availability</h1>
        <p className="text-gray-500">Submitting for <strong>{monthName} {monthYear}</strong></p>
      </div>

      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-800 flex items-center">
          <i className="fa-solid fa-lock mr-3"></i>
          <p>Your availability for {monthName} has been submitted and is now locked for editing.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targetDates.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const isSunday = date.getDay() === 0;
          const current = selections[dateStr] || { serviceTimes: [], rehearsal: false };

          return (
            <div key={dateStr} className={`bg-white p-6 rounded shadow-sm border ${current.serviceTimes.length > 0 || current.rehearsal ? 'border-brand-black ring-1 ring-brand-black' : 'border-brand-light'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg">{date.toLocaleDateString(undefined, { weekday: 'long' })}</h4>
                  <p className="text-gray-500 font-medium">{date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isSunday ? 'bg-brand-black text-white' : 'bg-brand-light text-brand-dark'}`}>
                  {isSunday ? 'Service' : 'Rehearsal'}
                </div>
              </div>

              {isSunday ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Service Times</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        disabled={isLocked}
                        onClick={() => toggleTime(dateStr, time)}
                        className={`px-3 py-2 rounded text-sm font-semibold transition-all border
                          ${current.serviceTimes.includes(time) 
                            ? 'bg-brand-black text-white border-brand-black' 
                            : 'bg-white text-brand-black border-brand-light hover:border-brand-dark'}
                          ${isLocked ? 'cursor-not-allowed opacity-80' : ''}
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <button
                    disabled={isLocked}
                    onClick={() => toggleRehearsal(dateStr)}
                    className={`w-full p-3 rounded text-sm font-bold transition-all border flex items-center justify-between
                      ${current.rehearsal 
                        ? 'bg-brand-black text-white border-brand-black' 
                        : 'bg-white text-brand-black border-brand-light hover:border-brand-dark'}
                      ${isLocked ? 'cursor-not-allowed opacity-80' : ''}
                    `}
                  >
                    <span>Available for Rehearsal</span>
                    {current.rehearsal && <i className="fa-solid fa-check"></i>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLocked && (
        <div className="flex justify-end pt-8">
          <button
            onClick={saveAvailability}
            disabled={submitting}
            className="bg-brand-black text-white px-10 py-4 rounded-lg font-bold shadow-lg hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Submit Availability'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
