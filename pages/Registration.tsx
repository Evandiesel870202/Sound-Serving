
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { googleSheetService } from '../services/googleSheetService';
import { CITIES, SHIRT_SIZES, STATIONS, ETHNICITY_OPTIONS, GENDER_OPTIONS } from '../constants';
import { City, User } from '../types';

const Registration: React.FC<{ onComplete: (email: string) => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'popia' | 'form'>('popia');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    gender: '',
    ethnicity: '',
    cellphone: '',
    email: '',
    suburb: '',
    date_of_birth: '',
    city: 'JHB' as City,
    homecell_member: 'No',
    crc_member: 'No',
    zone_pastor: 'Unknown',
    zone: '',
    shirt_size: '',
    main_station: '',
    start_date: '',
    role: 'Volunteer' as any,
  });
  const [submitting, setSubmitting] = useState(false);

  const handlePopiaAccept = () => setStep('form');
  const handlePopiaReject = () => navigate('/login');

  const validate = () => {
    if (formData.cellphone.length !== 10 || !/^\d+$/.test(formData.cellphone)) {
      alert("Cellphone must be 10 digits.");
      return false;
    }
    if (!formData.email.includes('@')) {
      alert("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    
    const finalStation = formData.role === 'New Volunteer' ? 'In Training' : formData.main_station;

    const newUser: Partial<User> = {
      ...formData,
      main_station: finalStation,
      status: 'Active',
      active_status: 'Active',
      popia_consent: true,
      user_id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const success = await googleSheetService.appendRow('Users', newUser);
    if (success) {
      alert("Registration successful! Welcome to the team.");
      localStorage.setItem('user_phone', formData.cellphone);
      window.location.reload();
    } else {
      alert("Registration failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (step === 'popia') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-xl text-center space-y-8 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto">
             <i className="fa-solid fa-shield-halved text-3xl text-brand-black"></i>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Privacy Consent</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            I provide my information voluntarily and consent to CRC's Privacy Policy which is available on <a href="https://crcchurch.com" target="_blank" className="text-brand-black underline font-bold">crcchurch.com</a>
          </p>
          <div className="flex gap-4">
            <button onClick={handlePopiaReject} className="flex-1 py-4 rounded-2xl border-2 border-brand-light font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Reject</button>
            <button onClick={handlePopiaAccept} className="flex-1 py-4 rounded-2xl bg-brand-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Accept & Continue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-xl overflow-hidden border border-brand-light">
        <div className="bg-brand-black p-12 text-white">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Volunteer Registration</h1>
          <p className="opacity-50 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Personal Details & Assignments</p>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Role</label>
                <select required className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:border-brand-black outline-none font-bold"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                  <option value="Volunteer">Volunteer</option>
                  <option value="New Volunteer">New Volunteer</option>
                  <option value="Section Leader">Section Leader</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Name</label>
                  <input required type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Surname</label>
                  <input required type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Gender</label>
                  <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Ethnicity</label>
                  <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})}>
                    <option value="">Select</option>
                    {ETHNICITY_OPTIONS.map(et => <option key={et} value={et}>{et}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Cellphone (10 Digits)</label>
                <input required type="tel" maxLength={10} className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                  value={formData.cellphone} onChange={e => setFormData({...formData, cellphone: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Email Address</label>
                <input required type="email" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">City You Serve In</label>
                <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                  value={formData.city} onChange={e => setFormData({...formData, city: e.target.value as City})}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">CRC Member?</label>
                  <select className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.crc_member} onChange={e => setFormData({...formData, crc_member: e.target.value})}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Zone Pastor</label>
                  <input required={formData.crc_member === 'Yes'} disabled={formData.crc_member === 'No'}
                    type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold disabled:opacity-30" 
                    value={formData.crc_member === 'No' ? 'Unknown' : formData.zone_pastor} 
                    onChange={e => setFormData({...formData, zone_pastor: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Homecell?</label>
                  <select className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.homecell_member} onChange={e => setFormData({...formData, homecell_member: e.target.value})}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Shirt Size</label>
                  <select required className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                    value={formData.shirt_size} onChange={e => setFormData({...formData, shirt_size: e.target.value})}>
                    <option value="">Select</option>
                    {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Station (FOH/Monitors/Broadcast)</label>
                <select disabled={formData.role === 'New Volunteer'} className="w-full bg-gray-50 p-4 rounded-2xl font-bold disabled:opacity-30" 
                  value={formData.role === 'New Volunteer' ? 'In Training' : formData.main_station} 
                  onChange={e => setFormData({...formData, main_station: e.target.value})}>
                  <option value="">Select Station</option>
                  {STATIONS.filter(s => !['Kids Church runner', 'Mothers and Toddlers'].includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                  {formData.role === 'New Volunteer' && <option value="In Training">In Training</option>}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Start Date (Month/Year)</label>
                <input required type="month" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" 
                  value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-brand-black text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;
