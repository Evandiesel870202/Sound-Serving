
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { User, Role, City } from './types';
import { googleSheetService } from './services/googleSheetService';

// Pages
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import AvailabilityPage from './pages/Availability';
import AttendancePage from './pages/Attendance';
import RosterPage from './pages/Roster';
import AdhocPage from './pages/Adhoc';
import CommentsPage from './pages/Comments';
import ReportsPage from './pages/Reports';
import BirthdaysPage from './pages/Birthdays';

// Context
interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  loading: true,
  logout: () => {},
  refreshUserData: async () => {}
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      checkUser(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUser = async (email: string) => {
    setLoading(true);
    const users = await googleSheetService.fetchTable<User>('Users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active_status === 'Active');
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('user_email', user.email);
    } else {
      localStorage.removeItem('user_email');
    }
    setLoading(false);
  };

  const refreshUserData = async () => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      const users = await googleSheetService.fetchTable<User>('Users');
      const user = users.find(u => u.email.toLowerCase() === savedEmail.toLowerCase());
      if (user) setCurrentUser(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user_email');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-black">
        <div className="text-brand-white text-xl animate-pulse">Loading CRC Sound Dept...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading, logout, refreshUserData }}>
      <HashRouter>
        <Routes>
          {!currentUser ? (
            <>
              <Route path="/login" element={<Login onLogin={checkUser} />} />
              <Route path="/register" element={<Registration onComplete={checkUser} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="availability" element={<AvailabilityPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="roster" element={<RosterPage />} />
              <Route path="adhoc" element={<AdhocPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="birthdays" element={<BirthdaysPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          )}
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

// UI Parts
const Login: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-black p-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-lg border-t-4 border-brand-dark">
        <h1 className="text-3xl font-bold mb-6 text-brand-black">CRC Sound Dept</h1>
        <p className="mb-4 text-gray-600">Enter your email to sign in.</p>
        <input 
          type="email" 
          className="w-full border border-brand-light p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-brand-dark" 
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button 
          onClick={() => onLogin(email)}
          className="w-full bg-brand-black text-white p-3 rounded hover:bg-brand-dark transition-colors font-bold"
        >
          Sign In
        </button>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-brand-dark hover:underline">New volunteer? Register here</Link>
        </div>
      </div>
    </div>
  );
};

const EditProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, refreshUserData } = useAuth();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    cellphone: currentUser?.cellphone || '',
    date_of_birth: currentUser?.date_of_birth ? currentUser.date_of_birth.split('T')[0] : '',
    zone_pastor: currentUser?.zone_pastor || '',
    homecell_leader: currentUser?.homecell_leader || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    
    const success = await googleSheetService.updateRow('Users', currentUser.user_id, 'user_id', formData);
    if (success) {
      await refreshUserData();
      onClose();
    } else {
      alert("Failed to update profile.");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-brand-black text-white p-4 flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-wider">Edit Profile</h3>
          <button onClick={onClose} className="hover:text-brand-light">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-brand-black">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full border border-brand-light p-2 rounded focus:ring-2 focus:ring-brand-black outline-none" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cellphone</label>
            <input 
              required
              type="tel" 
              className="w-full border border-brand-light p-2 rounded focus:ring-2 focus:ring-brand-black outline-none" 
              value={formData.cellphone}
              onChange={e => setFormData({...formData, cellphone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
            <input 
              required
              type="date" 
              className="w-full border border-brand-light p-2 rounded focus:ring-2 focus:ring-brand-black outline-none" 
              value={formData.date_of_birth}
              onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Zone Pastor</label>
            <input 
              type="text" 
              className="w-full border border-brand-light p-2 rounded focus:ring-2 focus:ring-brand-black outline-none" 
              value={formData.zone_pastor}
              onChange={e => setFormData({...formData, zone_pastor: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Homecell Leader</label>
            <input 
              type="text" 
              className="w-full border border-brand-light p-2 rounded focus:ring-2 focus:ring-brand-black outline-none" 
              value={formData.homecell_leader}
              onChange={e => setFormData({...formData, homecell_leader: e.target.value})}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-brand-black text-white p-2 rounded font-bold hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 border border-brand-light p-2 rounded font-bold hover:bg-gray-50 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const { currentUser, logout, refreshUserData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/availability', label: 'Availability', icon: 'fa-calendar-check' },
    { path: '/attendance', label: 'Attendance', icon: 'fa-user-check' },
    { path: '/roster', label: 'Monthly Roster', icon: 'fa-users' },
    { path: '/adhoc', label: 'Adhoc Events', icon: 'fa-bolt' },
    { path: '/comments', label: 'Comments', icon: 'fa-comment-dots' },
    { path: '/birthdays', label: 'Birthdays', icon: 'fa-cake-candles' },
    { path: '/reports', label: 'Reports', icon: 'fa-file-lines' },
  ];

  const registrationDate = currentUser?.created_at 
    ? new Date(currentUser.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const success = await googleSheetService.updateRow('Users', currentUser.user_id, 'user_id', {
        profile_picture: base64String
      });
      
      if (success) {
        await refreshUserData();
      } else {
        alert("Failed to update profile picture.");
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} />}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-black text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 shrink-0">
          <h2 className="text-2xl font-bold tracking-tight">CRC SOUND</h2>
          <p className="text-xs text-brand-light opacity-60">ADMIN SYSTEM</p>
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center px-6 py-4 hover:bg-brand-dark transition-colors
                ${location.pathname === item.path ? 'bg-brand-dark border-l-4 border-white' : ''}
              `}
            >
              <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
              <span className="ml-3 font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-brand-dark bg-brand-dark/30 shrink-0">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                <div className="relative group shrink-0">
                  <div className={`w-14 h-14 rounded-full overflow-hidden bg-brand-light flex items-center justify-center text-brand-black font-bold text-xl border-2 border-white/20 shadow-lg ${isUploading ? 'animate-pulse' : ''}`}>
                    {currentUser?.profile_picture ? (
                      <img src={currentUser.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser?.name?.[0]}{currentUser?.surname?.[0]}</span>
                    )}
                  </div>
                  <button 
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full text-brand-black flex items-center justify-center border border-brand-dark shadow-md hover:bg-brand-light transition-colors"
                  >
                    <i className={`fa-solid ${isUploading ? 'fa-spinner fa-spin' : 'fa-camera'} text-[10px]`}></i>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate leading-tight">{currentUser?.name} {currentUser?.surname}</p>
                  <div className="mt-1 flex items-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      currentUser?.role === 'Super Admin' ? 'bg-red-600 text-white' : 
                      currentUser?.role === 'Admin' ? 'bg-blue-600 text-white' : 
                      currentUser?.role === 'Section Leader' ? 'bg-green-600 text-white' : 
                      'bg-gray-600 text-white'
                    }`}>
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="p-1 text-brand-light opacity-50 hover:opacity-100 hover:text-white transition-all"
                title="Edit Profile"
              >
                <i className="fa-solid fa-user-pen"></i>
              </button>
            </div>
            
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center text-brand-light opacity-70">
                <i className="fa-solid fa-id-badge w-4 text-[10px]"></i>
                <span className="text-[10px] font-mono ml-2 uppercase truncate">ID: {currentUser?.user_id || 'N/A'}</span>
              </div>
              <div className="flex items-center text-brand-light opacity-70">
                <i className="fa-solid fa-calendar-day w-4 text-[10px]"></i>
                <span className="text-[10px] ml-2 uppercase tracking-tighter">Since: {registrationDate}</span>
              </div>
              <div className="flex items-center text-brand-light opacity-70">
                <i className="fa-solid fa-location-dot w-4 text-[10px]"></i>
                <span className="text-[10px] ml-2 uppercase">{currentUser?.city} Campus</span>
              </div>
            </div>

            <button 
              onClick={logout}
              className="w-full flex items-center justify-center p-2 rounded bg-red-900/40 text-red-100 hover:bg-red-800/60 transition-colors text-[10px] font-bold border border-red-800/30 uppercase tracking-widest"
            >
              <i className="fa-solid fa-right-from-bracket mr-2"></i>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-brand-light p-4 flex items-center justify-between lg:justify-end">
          <button 
            className="lg:hidden p-2 text-brand-black" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold hidden md:inline">{currentUser?.city} Campus</span>
            <div className="h-8 w-[1px] bg-brand-light hidden md:block"></div>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-ZA', { dateStyle: 'long' })}</span>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <React.Suspense fallback={<div className="p-8 text-center">Loading section...</div>}>
            <Outlet />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
