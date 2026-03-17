import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { languages } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, MapPin, Globe, User, Shield, UserCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import SOSButton from './SOSButton';

export default function Navbar() {
  const { user, role, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  // Role-based nav links using translation keys
  const navLinks = {
    citizen: [
      { to: '/dashboard', label: t('nav_dashboard') },
      { to: '/submit', label: t('nav_submit') },
    ],
    officer: [
      { to: '/officer', label: t('nav_dashboard') },
      { to: '/heatmap', label: 'Heatmap' },
      { to: '/public', label: 'Statistics' },
    ],
    admin: [
      { to: '/admin', label: t('nav_dashboard') },
      { to: '/heatmap', label: 'Heatmap' },
      { to: '/public', label: 'Statistics' },
      { to: '/admin?tab=complaints', label: 'All Complaints' },
      { to: '/admin?tab=departments', label: 'Manage Departments' },
      { to: '/admin?tab=analytics', label: 'Analytics' },
    ],
  };

  const links = role ? navLinks[role] : [];

  const isActive = (to: string) =>
    location.pathname === to.split('?')[0] &&
    (to.includes('?') ? location.search.includes(to.split('?')[1]) : true);

  const linkClass = (to: string) =>
    `rounded-full px-4 py-1.5 text-xs font-bold tracking-tight transition-all duration-300 ${isActive(to) ? 'bg-white/20 text-white scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <nav className="mx-auto max-w-5xl glass-dark rounded-b-[2rem] px-6 py-2 shadow-cinematic pointer-events-auto transition-all hover:bg-slate-950/80">
        <div className="flex items-center justify-between h-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-white/90">Voice4City</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 md:flex">
            {!user && (
              <Link to="/" className={linkClass('/')}>{t('nav_home')}</Link>
            )}
            {links.map((l) => (
              <Link key={l.to + l.label} to={l.to} className={linkClass(l.to)}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right: Language + SOS + Auth */}
          <div className="flex items-center gap-3">
            {role === 'citizen' && <SOSButton />}

            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="group flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Change Language"
              >
                <Globe className="h-3.5 w-3.5 text-white/60 group-hover:text-white transition-colors" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-4 z-50 min-w-[140px] rounded-2xl glass-dark shadow-cinematic p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all ${language === lang.code ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-white/20"
                  title="User Profile"
                >
                  <UserCircle className="h-5 w-5" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-4 z-50 min-w-[200px] rounded-2xl glass-dark shadow-cinematic p-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-white truncate">{profile?.name || 'User'}</p>
                        <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <Shield className="h-3 w-3 text-primary" />
                          <span className="text-[10px] uppercase tracking-wider font-bold text-primary/80">{role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>View Profile</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t('nav_logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/login')}
                className="bg-white text-slate-950 hover:bg-white/90 rounded-full px-5 h-8 text-xs font-bold tracking-tight shadow-md transition-transform active:scale-95"
              >
                {t('nav_login')}
              </Button>
            )}

            {/* Mobile toggle */}
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="mt-4 pb-4 animate-in slide-in-from-top-2 duration-300 md:hidden">
            <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
              {!user && (
                <Link to="/" className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white" onClick={() => setOpen(false)}>{t('nav_home')}</Link>
              )}
              {links.map((l) => (
                <Link
                  key={l.to + l.label} to={l.to}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${isActive(l.to) ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}

              <div className="mt-2 pt-4 border-t border-white/5">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { navigate('/profile'); setOpen(false); }}
                      className="px-4 py-3 bg-white/5 rounded-2xl text-left hover:bg-white/10 transition-all"
                    >
                      <p className="text-sm font-bold text-white">{profile?.name || 'User'}</p>
                      <p className="text-xs text-white/40">{user?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary/80">{role}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-primary/60 font-bold uppercase tracking-widest">
                        View Profile <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </button>
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                      <LogOut className="h-4 w-4" /> {t('nav_logout')}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 p-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-white/10" onClick={() => { navigate('/login'); setOpen(false); }}>{t('nav_login')}</Button>
                    <Button size="sm" className="flex-1 bg-white text-slate-950 hover:bg-white/90 rounded-xl" onClick={() => { navigate('/register'); setOpen(false); }}>{t('nav_register')}</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
