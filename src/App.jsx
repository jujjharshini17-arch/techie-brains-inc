import { useEffect, useMemo, useState, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowRight, Bell, Check, CheckCircle2, ChevronDown, Download, Eye, FileUp,
  Linkedin, Loader, Lock, LogOut, Mail, MapPin, Menu, Moon, Phone, Search, Send, ShieldCheck, Sparkles, Sun, Trash2,
  User, Users, X
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { navLinks, stats, whyChoose, partnerships, staffingServices, consultingServices, testimonials, faqs, adminMetrics, chartData, techStack } from './data/content';
import { adminExists, allStatuses, createAdminAccount, deleteContactMessage as deleteContactMessageDb, fetchContactMessages, fetchResumes, fetchStats, fetchUserResume, fetchUsers, getProfile, getResumeDownloadUrl, loginWithGoogle, loginWithPassword, progressStatuses, registerUser, saveContactMessage, supabase, supabaseConfigured, updateContactMessage, updateResumeStatus, uploadResume, upsertProfile } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { AuthProvider, useAuth } from './components/AuthProvider';

// Space Theme Components
import SpaceBackground from './components/SpaceBackground';
import CustomCursor from './components/CustomCursor';
import FlyingRocket from './components/FlyingRocket';

import TiltCard from './components/TiltCard';
import SurpriseGift from './components/SurpriseGift';

// Page slide transition presets
const page = { 
  initial: { opacity: 0, scale: 0.98, y: 15 }, 
  animate: { opacity: 1, scale: 1, y: 0 }, 
  exit: { opacity: 0, scale: 0.98, y: -15 }, 
  transition: { duration: 0.4, ease: 'easeInOut' } 
};

// Global Page transition hook
export function useSpaceTransition() {
  const navigate = useNavigate();
  const setIsNavigating = useAppStore((s) => s.setIsNavigating);
  
  return async (to) => {
    if (!to) return;
    setIsNavigating(true);
    // wait for transition rocket animation sweep (900ms)
    await new Promise((r) => setTimeout(r, 900));
    navigate(to);
    // let fade transition finish
    await new Promise((r) => setTimeout(r, 400));
    setIsNavigating(false);
  };
}
const office = 'Flat No - 301, 3rd Floor, Madhu Enclave, Opp MaxCure Hospital, Patrika Nagar, HiTech City, Hyderabad - 500081, India';
const mailTo = 'mailto:info@techiebrains.com?subject=Inquiry%20from%20Techie%20Brains%20website';

function App() {
  const { theme } = useAppStore();
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

function buildProfile(user, role = 'User') {
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Techie Brains User',
    email: user.email,
    phone: user.user_metadata?.phone || '',
    role
  };
}

function Layout() {
  const location = useLocation();
  const isNavigating = useAppStore(s => s.isNavigating);
  return (
    <>
      <SpaceBackground />
      <CustomCursor />
      <FlyingRocket />
      <SurpriseGift />

      {/* Navigation transition sweep rocket overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="nav-transition-overlay"
            style={{ zIndex: 99999 }}
          >
            <motion.div
              initial={{ x: '-100vw', y: '100vh', rotate: -45, scale: 0.6 }}
              animate={{ x: '100vw', y: '-100vh', rotate: -45, scale: 1.3 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="transition-rocket-container"
            >
              <svg width="90" height="90" viewBox="0 0 64 64" fill="none">
                <path d="M12 32C12 32 3 35 1 32C3 29 12 32 12 32Z" fill="#ea580c" />
                <path d="M10 32C10 32 5 33.5 4 32C5 30.5 10 32 10 32Z" fill="#fb923c" />
                <path d="M12 32C12 22 20 18 36 18C48 18 56 26 58 32C56 38 48 46 36 46C20 46 12 42 12 32Z" fill="url(#layoutRocketGrad)" stroke="#c084fc" strokeWidth="1" />
                <path d="M20 20L10 14V22L20 20Z" fill="#ec4899" />
                <path d="M20 44L10 50V42L20 44Z" fill="#ec4899" />
                <defs>
                  <linearGradient id="layoutRocketGrad" x1="12" y1="32" x2="58" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Shell />
      <main style={{ position: 'relative', zIndex: 5 }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Protected><UserDashboard /></Protected>} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin" element={<Protected role="Admin"><AdminDashboard /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTransition = useSpaceTransition();
  const { theme, setTheme } = useAppStore();
  const { session, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => setMenuOpen(false), [location.pathname]);
  const authed = Boolean(session);

  const search = (event) => {
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const target = q.includes('staff') || q.includes('service') || q.includes('cloud') ? '/services' : q.includes('contact') || q.includes('resume') ? '/contact' : q.includes('faq') ? '/faqs' : q.includes('about') ? '/about' : '/';
    navigateTransition(target);
    toast.success('Showing the closest section for "' + query + '"');
    setQuery('');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out');
      navigateTransition('/');
    } catch (e) {
      console.error('Logout error:', e);
      toast.error('Logout failed');
    }
  };

  const handleNavLink = (e, to) => {
    e.preventDefault();
    setMenuOpen(false);
    navigateTransition(to);
  };

  return <>
    <header className="nav-shell">
      <a href="/" className="brand" onClick={(e) => handleNavLink(e, '/')} aria-label="Techie Brains home"><img src="/techiebrains-logo.png" alt="Techie Brains" /></a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navLinks.map(([to, label]) => (
          <a
            key={to}
            href={to}
            className={location.pathname === to ? 'active' : ''}
            onClick={(e) => handleNavLink(e, to)}
          >
            {label}
          </a>
        ))}
        {authed ? (
          <a
            href={profile?.role === 'Admin' ? '/admin' : '/dashboard'}
            className={location.pathname === (profile?.role === 'Admin' ? '/admin' : '/dashboard') ? 'active' : ''}
            onClick={(e) => handleNavLink(e, profile?.role === 'Admin' ? '/admin' : '/dashboard')}
          >
            Dashboard
          </a>
        ) : (
          <a
            href="/login"
            className={location.pathname === '/login' ? 'active' : ''}
            onClick={(e) => handleNavLink(e, '/login')}
          >
            Login
          </a>
        )}
      </nav>
      <form className="nav-search" onSubmit={search}><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" /></form>
      <div className="nav-actions">
        <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun /> : <Moon />}</button>
        {authed && <button className="icon-btn" onClick={handleLogout} aria-label="Logout"><LogOut /></button>}
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </header>
    {menuOpen && (
      <div className="mobile-menu">
        {navLinks.map(([to, label]) => (
          <a key={to} href={to} className={location.pathname === to ? 'active' : ''} onClick={(e) => handleNavLink(e, to)}>{label}</a>
        ))}
        <a 
          href={authed ? (profile?.role === 'Admin' ? '/admin' : '/dashboard') : '/login'} 
          className={location.pathname === (authed ? (profile?.role === 'Admin' ? '/admin' : '/dashboard') : '/login') ? 'active' : ''} 
          onClick={(e) => handleNavLink(e, authed ? (profile?.role === 'Admin' ? '/admin' : '/dashboard') : '/login')}
        >
          {authed ? 'Dashboard' : 'Login'}
        </a>
        {authed && (
          <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); handleLogout(); }}>Logout</a>
        )}
      </div>
    )}
  </>;
}

function Protected({ children, role }) {
  const { session, profile, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: '#fff' }}>
        <Loader className="animate-spin" size={40} style={{ color: '#a855f7' }} />
        <p>Verifying authentication...</p>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function Section({ eyebrow, title, children, className = '' }) {
  return <section className={'section ' + className}><div className="section-head"><span>{eyebrow}</span><h2>{title}</h2></div>{children}</section>;
}

function Card({ children, className = '', onClick }) {
  return <TiltCard className={className} onClick={onClick}>{children}</TiltCard>;
}

function ButtonLink({ to, href, children, variant = 'primary' }) {
  const className = variant === 'primary' ? 'gradient-btn' : 'secondary-btn';
  const navigateTransition = useSpaceTransition();
  const triggerGift = useAppStore(s => s.triggerGift);

  const handleClick = (e) => {
    if (href) return;
    e.preventDefault();
    
    // Check if it's an important button (e.g. Contact, Services, Discuss) to trigger the surprise gift box explosion!
    const isImportant = to === '/contact' || to === '/services';
    if (isImportant) {
      triggerGift(to);
    } else {
      navigateTransition(to);
    }
  };

  if (href) return <a className={className} href={href}>{children}<ArrowRight size={18} /></a>;
  return <a className={className} href={to} onClick={handleClick}>{children}<ArrowRight size={18} /></a>;
}

function CountUp({ value, duration = 1.0 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) {
      setCount(value);
      return;
    }
    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);
    const timer = setInterval(() => {
      start += Math.ceil(end / 35);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
}

function Home() {
  const navigateTransition = useSpaceTransition();
  const [typedText, setTypedText] = useState('');
  const fullText = "Trusted recruitment, IT staffing, and consulting solutions for companies that need skilled technology professionals and reliable delivery support.";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return <motion.div {...page}>
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-copy">
        <span className="pill"><Sparkles size={15} />Recruitment and IT Consulting</span>
        <h1 className="text-glow-header">Techie Brains Inc.</h1>
        <p style={{ minHeight: '60px' }}>{typedText}<span className="typing-cursor">|</span></p>
        <div className="hero-actions"><ButtonLink to="/contact">Contact Us</ButtonLink><ButtonLink to="/services" variant="secondary">Our Services</ButtonLink></div>
        <div className="hero-trust"><span>Contract</span><span>Contract-to-Hire</span><span>Permanent Staffing</span><span>IT Consulting</span></div>
      </div>
      <div className="hero-visual">
        <div className="floating-astronaut-wrapper">
          <svg className="floating-astronaut" width="220" height="280" viewBox="0 0 220 280" fill="none">
            <circle cx="110" cy="90" r="45" fill="url(#astroHelmetGradHero)" stroke="#a855f7" strokeWidth="2.5" />
            <ellipse cx="110" cy="85" rx="35" ry="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M92 78C100 70 120 70 128 78" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="50" y="110" width="20" height="90" rx="6" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="150" y="110" width="20" height="90" rx="6" fill="#cbd5e1" stroke="#94a3b8" />
            <path d="M70 135C70 135 60 215 65 245C70 275 150 275 155 245C160 215 150 135 150 135H70Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5" />
            <rect x="90" y="145" width="40" height="40" rx="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="96" y="152" width="12" height="6" fill="#ef4444" />
            <circle cx="118" cy="155" r="3" fill="#10b981" />
            <circle cx="126" cy="155" r="3" fill="#3b82f6" />
            <path d="M70 140C52 155 42 175 52 190C56 196 66 185 70 172" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M150 140C168 155 178 175 168 190C164 196 154 185 150 172" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            <defs>
              <linearGradient id="astroHelmetGradHero" x1="110" y1="45" x2="110" y2="135" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="scroll-indicator">
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="scroll-dot"
        />
      </div>
    </section>
    <Section eyebrow="Why Choose Us" title="A refined recruitment model for high-stakes technology hiring.">
      <div className="feature-grid">{whyChoose.map(([title, Icon]) => <Card key={title}><Icon className="card-icon" /><h3>{title}</h3><p>Careful screening, clear communication, and delivery ownership from first call to final onboarding.</p></Card>)}</div>
    </Section>
    <Section eyebrow="Company Statistics" title="Client-ready proof points.">
      <div className="stats-grid">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <strong>
              <CountUp value={value} />
              {label === 'Satisfaction' ? '%' : '+'}
            </strong>
            <span>{label}</span>
          </Card>
        ))}
      </div>
    </Section>
    <Section eyebrow="Featured Services" title="Capabilities clients can buy with confidence.">
      <div className="service-strip">
        {consultingServices.slice(0, 6).map(([title, Icon, text]) => (
          <Card key={title}>
            <Icon className="card-icon" />
            <h3>{title}</h3>
            <p>{text}</p>
            <a href="/services" className="text-link" onClick={(e) => { e.preventDefault(); navigateTransition('/services'); }}>
              View details <ArrowRight size={14} />
            </a>
          </Card>
        ))}
      </div>
    </Section>
    <Section eyebrow="Technology Stack" title="Modern platforms, practical delivery."><div className="logo-cloud">{techStack.map((item) => <span key={item}>{item}</span>)}</div></Section>
    <Partnerships />
    <section className="cta">
      <div>
        <h2>Ready to accelerate hiring or delivery?</h2>
        <p>Send requirements, upload a resume, or speak with the Techie Brains team today.</p>
      </div>
      <div className="cta-actions">
        <ButtonLink to="/contact">Contact Team</ButtonLink>
        <ButtonLink href={mailTo} variant="secondary">Email Us</ButtonLink>
      </div>
    </section>
  </motion.div>;
}

function About() {
  const navigateTransition = useSpaceTransition();
  return <motion.div {...page}>
    <section className="page-hero"><span className="pill">About Techie Brains</span><h1>Fast-growing IT services, solutions, products, and professional services.</h1><p>Techie Brains provides a positive, passionate, and collaborative work environment with opportunities to support elite global clients and next-generation technology programs.</p></section>
    
    <Section eyebrow="Global Footprint" title="IT staffing without borders.">
      <div className="about-earth-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'center' }}>
        <Card>
          <h3>Our Journey</h3>
          <p>We work with enterprises and fast-growing technology startups to bridge the engineering gap. Our team has built long-term hiring partnerships, providing consistent execution and clear delivery paths.</p>
          <p>Every profile submitted is carefully evaluated by our technology subject-matter experts before it reaches the client, ensuring standard-compliant capability matches.</p>
        </Card>
        
        {/* Orbiting rocket around Earth */}
        <div className="about-earth-visual" style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rotating-earth-wrapper" style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, #38bdf8 0%, #1e3a8a 70%, #030712 100%)', boxShadow: '0 0 35px rgba(56, 189, 248, 0.45)', position: 'relative', overflow: 'hidden' }}>
            <svg className="rotating-earth" viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: '#10b981', opacity: 0.85 }}>
              <path d="M20 30 Q 30 15, 45 25 T 60 10 T 70 30 T 40 45 Z" />
              <path d="M10 60 Q 25 50, 35 65 T 55 55 T 75 70 T 30 80 Z" />
            </svg>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            style={{ position: 'absolute', width: '240px', height: '240px', transformOrigin: 'center center' }}
          >
            <svg width="28" height="28" viewBox="0 0 64 64" style={{ transform: 'rotate(135deg)', position: 'absolute', top: 0, left: 'calc(50% - 14px)' }}>
              <path d="M12 32C12 22 20 18 36 18C48 18 56 26 58 32C56 38 48 46 36 46C20 46 12 42 12 32Z" fill="#a855f7" />
              <path d="M44 20C47 23 54 28 58 32C54 36 47 41 44 44C49 39 49 25 44 20Z" fill="#ec4899" />
              <path d="M12 32C12 32 3 35 1 32C3 29 12 32 12 32Z" fill="#fb923c" />
            </svg>
          </motion.div>
        </div>
      </div>
    </Section>

    <Section eyebrow="About Us" title="Quality recruitment starts with understanding the requirement."><div className="two-col"><Card><p>Every recruiter carefully studies client requirements before shortlisting candidates. This approach has enabled Techie Brains to consistently deliver high-quality talent to clients.</p><p>Profiles are evaluated for domain expertise, leadership, collaboration, communication, professionalism, and loyalty.</p></Card><div className="timeline">{['Domain Expertise', 'Leadership', 'Team Collaboration', 'Communication Skills', 'Professionalism', 'Loyalty'].map((item) => <div key={item}><Check />{item}</div>)}</div></div></Section>
    <section className="mission-grid"><Card><h2>Our Mission</h2><p>To strive for transcendence, encourage innovation by adopting the latest technological developments in the pursuit of providing quality business solutions.</p></Card><Card><h2>Our Vision</h2><p>We strive to provide clients trustworthy, cost-effective, scalable, and efficient solutions driven by passion, intellect, and integrity.</p></Card></section>
    <Partnerships />
  </motion.div>;
}

function Partnerships() {
  return <Section eyebrow="Our Partnerships" title="A partner ecosystem across staffing, technology, and enterprise delivery."><div className="partner-grid">{partnerships.map((name) => <div className="partner-logo" key={name}>{name}</div>)}</div></Section>;
}

function Services() {
  return <motion.div {...page}><section className="page-hero"><span className="pill">Services</span><h1>Right resources. Right cost. Right time.</h1><p>Techie Brains provides contract staffing, contract-to-hire, permanent staffing, full-time recruitment, and consulting services across enterprise technology domains.</p><div className="hero-actions"><ButtonLink to="/contact">Send Requirement</ButtonLink><ButtonLink href={mailTo} variant="secondary">Email Requirement</ButtonLink></div></section>
    <Section eyebrow="IT Staffing Services" title="Specialized recruitment across the full technology organization."><div className="chip-grid">{staffingServices.map((item) => <span key={item}>{item}</span>)}</div></Section>
    <Section eyebrow="IT Consulting Services" title="Premium consulting for transformation, operations, and delivery."><div className="feature-grid">{consultingServices.map(([title, Icon, text]) => <Card key={title}><Icon className="card-icon" /><h3>{title}</h3><p>{text}</p><ButtonLink to="/contact" variant="secondary">Discuss</ButtonLink></Card>)}</div></Section>
  </motion.div>;
}

function Testimonials({ preview = false }) {
  const shown = preview ? testimonials.slice(0, 2) : testimonials;
  const navigateTransition = useSpaceTransition();
  return <motion.div {...(!preview ? page : {})}><Section eyebrow="Testimonials" title="Trusted by clients, consultants, and delivery teams."><div className="testimonial-grid">{shown.map(([who, quote]) => <Card key={who}><div className="stars">5.0 / 5 rating</div><p>{quote}</p><strong>{who}</strong></Card>)}</div>{preview && <a className="section-link" href="/testimonials" onClick={(e) => { e.preventDefault(); navigateTransition('/testimonials'); }}>View all testimonials <ArrowRight size={17} /></a>}</Section></motion.div>;
}

function Faqs({ preview = false }) {
  const [open, setOpen] = useState(0);
  const shown = preview ? faqs.slice(0, 4) : faqs;
  const navigateTransition = useSpaceTransition();
  return <motion.div {...(!preview ? page : {})}><Section eyebrow="FAQs" title="Clear answers for candidates and clients."><div className="faq-list">{shown.map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><ChevronDown className={open === index ? 'spin' : ''} /></button>{open === index && <p>{answer}</p>}</div>)}</div>{preview && <a className="section-link" href="/faqs" onClick={(e) => { e.preventDefault(); navigateTransition('/faqs'); }}>Browse all FAQs <ArrowRight size={17} /></a>}</Section></motion.div>;
}

function Contact() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const { addContactMessage } = useAppStore();
  const onSubmit = async (values) => {
    try {
      await saveContactMessage(values);
      addContactMessage(values);
      toast.success('Message submitted successfully');
      reset();
    } catch (error) {
      toast.error(error.message || 'Could not submit message');
    }
  };
  return <motion.div {...page}><section className="page-hero"><span className="pill">Contact</span><h1>Start a hiring or consulting conversation.</h1><p>Send a requirement, candidate inquiry, partnership request, or service question. The form stores messages in Supabase when configured.</p></section>
    <section className="contact-stack"><Card><h2>Send a Message</h2><form className="form" onSubmit={handleSubmit(onSubmit)}><input {...register('name', { required: true })} placeholder="Name" /><input type="email" {...register('email', { required: true })} placeholder="Email" /><input {...register('phone')} placeholder="Phone" /><input {...register('subject', { required: true })} placeholder="Subject" /><textarea {...register('message', { required: true })} placeholder="Message" rows="5" /><button className="gradient-btn" disabled={isSubmitting}><Send size={18} />{isSubmitting ? 'Submitting...' : 'Submit Message'}</button></form></Card><Card><h2>Office Information</h2><p><MapPin />{office}</p><p><Phone />040-46032959</p><p><Mail />info@techiebrains.com</p><div className="contact-actions"><a className="secondary-btn" href="tel:04046032959"><Phone size={18} />Call Office</a><a className="secondary-btn" href={mailTo}><Mail size={18} />Email Team</a><a className="secondary-btn" href="https://www.linkedin.com/company/techie-brains-incorporated/about/" target="_blank" rel="noreferrer"><Linkedin size={18} />LinkedIn</a></div><iframe title="Techie Brains Hyderabad map" src="https://www.google.com/maps?q=Madhu%20Enclave%20Patrika%20Nagar%20HiTech%20City%20Hyderabad%20500081%20India&output=embed" loading="lazy" /></Card></section>
  </motion.div>;
}

function AdminSetup() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const [checking, setChecking] = useState(true);
  const [exists, setExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigateTransition = useSpaceTransition();

  useEffect(() => {
    if (!supabaseConfigured) {
      setChecking(false);
      return;
    }
    adminExists().then((value) => {
      setExists(value);
      if (value) navigate('/login', { replace: true });
    }).catch((error) => toast.error(error.message)).finally(() => setChecking(false));
  }, [navigate]);

  const submit = async (values) => {
    setBusy(true);
    try {
      await createAdminAccount(values);
      toast.success('Admin account created successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.message || 'Could not create admin account');
    } finally {
      setBusy(false);
    }
  };

  if (!supabaseConfigured) return <motion.div {...page}><section className="auth-wrap"><Card className="auth-card"><img src="/techiebrains-logo.png" alt="Techie Brains" /><h1>Connect Supabase</h1><p className="auth-intro">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, run the SQL schema, then refresh this page to create the first admin account.</p></Card></section></motion.div>;
  if (checking) return <motion.div {...page}><section className="auth-wrap"><Card className="auth-card"><h1>Checking admin setup...</h1></Card></section></motion.div>;
  if (exists) return null;

  return <motion.div {...page}><section className="auth-wrap"><Card className="auth-card"><img src="/techiebrains-logo.png" alt="Techie Brains" /><span className="pill"><Lock size={15} />First Launch</span><h1>Create Admin Account</h1><p className="auth-intro">Only one admin account can be created. After this step, admin registration is locked and future admins must use Admin Login.</p><form className="form" onSubmit={handleSubmit(submit)}><input {...register('name', { required: true })} placeholder="Admin name" /><input type="email" {...register('email', { required: true })} placeholder="Admin email" /><input type="password" {...register('password', { required: true, minLength: 8 })} placeholder="Admin password" /><button className="gradient-btn" disabled={busy}>{busy ? 'Creating...' : 'Create Admin Account'}</button></form><div className="auth-links"><button onClick={() => navigateTransition('/login')}>Admin Login</button></div></Card></section></motion.div>;
}

function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const { session, profile } = useAuth();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);

  const navigateTransition = useSpaceTransition();
  const setIsNavigating = useAppStore(s => s.setIsNavigating);

  useEffect(() => {
    if (session) {
      navigate(profile?.role === 'Admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [session, profile, navigate]);

  const submit = async (values) => {
    setBusy(true);
    try {
      if (!supabaseConfigured) throw new Error('Authentication service is not connected. Configure Supabase before client delivery.');
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: window.location.origin + '/login' });
        if (error) throw error;
        toast.success('Password reset link sent');
        return;
      }
      if (mode === 'register') {
        await registerUser(values);
        toast.success('Registration successful. Please verify email if confirmation is enabled.');
        setMode('login');
        return;
      }
      
      // Enforce admin-only credentials check
      if (mode === 'admin') {
        const adminEmail = 'hrishitha8@gmail.com';
        const passwordInput = values.password.trim();
        const isValidPassword = passwordInput === 'abhi$maggieb1226' || passwordInput === 'abhi$maggie1226';
        
        if (values.email.trim().toLowerCase() !== adminEmail || !isValidPassword) {
          throw new Error('Invalid admin credentials. Only the authorized administrator account can log in.');
        }
      }

      const result = await loginWithPassword(values);
      if (mode === 'admin' && result.profile.role !== 'Admin') throw new Error('This account does not have admin access.');
      if (mode !== 'admin' && result.profile.role === 'Admin') throw new Error('Please use Admin Login for this account.');
      
      // Celebrate login redirect
      setIsNavigating(true);
      toast.success(mode === 'admin' ? 'Admin signed in' : 'Welcome back');
      
      await new Promise(r => setTimeout(r, 900));
      navigate(result.profile.role === 'Admin' ? '/admin' : '/dashboard');
      setIsNavigating(false);
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      if (!supabaseConfigured) throw new Error('Authentication service is not connected. Configure Supabase before client delivery.');
      await loginWithGoogle();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLinkClick = (e, targetMode) => {
    e.preventDefault();
    setMode(targetMode);
  };

  return (
    <motion.div {...page}>
      <section className="auth-wrap">
        <Card className="auth-card">
          <img src="/techiebrains-logo.png" alt="Techie Brains" />
          <span className="pill"><Lock size={15} />Secure Access</span>
          <h1>{mode === 'login' ? 'User Login' : mode === 'register' ? 'Create candidate account' : mode === 'admin' ? 'Admin Login' : 'Reset password'}</h1>
          <p className="auth-intro">Users and administrators sign in separately. Admin registration is available only on first launch.</p>
          
          {mode !== 'admin' && mode !== 'forgot' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
              <button type="button" className="google-btn" onClick={google}><span>G</span>Continue with Google</button>
            </motion.div>
          )}
          
          <div className="divider"><span>or</span></div>
          
          <form className="form" onSubmit={handleSubmit(submit)}>
            {mode === 'register' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'grid', gap: '13px' }}>
                <input {...register('name', { required: true })} placeholder="Full name" />
                <input {...register('phone')} placeholder="Phone" />
              </motion.div>
            )}
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <input type="email" {...register('email', { required: true })} placeholder={mode === 'admin' ? 'Admin email' : 'Email'} />
            </motion.div>
            
            {mode !== 'forgot' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <input type="password" {...register('password', { required: true, minLength: mode === 'register' ? 8 : 6 })} placeholder={mode === 'admin' ? 'Admin password' : 'Password'} />
              </motion.div>
            )}
            
            <label className="check"><input type="checkbox" />Remember me</label>
            <button className="gradient-btn" disabled={busy}>{busy ? 'Please wait...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'admin' ? 'Login as Admin' : mode === 'register' ? 'Register' : 'Login'}</button>
          </form>
          
          <div className="auth-links">
            <button onClick={(e) => handleLinkClick(e, 'login')}>User Login</button>
            <button onClick={(e) => handleLinkClick(e, 'register')}>Register</button>
            <button onClick={(e) => handleLinkClick(e, 'forgot')}>Forgot Password</button>
            <button onClick={(e) => handleLinkClick(e, 'admin')}>Admin Login</button>
            <button onClick={() => navigateTransition('/admin/setup')}>Create Admin</button>
          </div>
          
          <small>{supabaseConfigured ? 'Connected to Supabase authentication.' : 'Supabase keys are required for production login, Google sign-in, resume upload, and admin access.'}</small>
        </Card>
      </section>
    </motion.div>
  );
}

function UserDashboard() {
  const { profile, setProfile } = useAuth();
  const { resume, setResume, notifications, markNotificationRead } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { register, handleSubmit } = useForm({ defaultValues: profile || {} });
  
  // Timeline setup mapping
  const timelineStatuses = ['Resume Under Review', 'Shortlisted', 'Interview Scheduled', 'Need More Information'];
  const progress = resume?.status === 'Application Not Selected' ? -1 : timelineStatuses.indexOf(resume?.status || 'Resume Under Review');

  useEffect(() => {
    if (!profile?.id || !supabaseConfigured) return;
    fetchUserResume(profile.id).then((data) => data && setResume(data)).catch((error) => toast.error(error.message));
  }, [profile?.id, setResume]);

  const simulateProgressAndUpload = async (file) => {
    setUploading(true);
    setUploadSuccess(false);
    setUploadProgress(0);

    // Rocket lifting progress ticks
    for (let p = 15; p <= 100; p += 17) {
      await new Promise(r => setTimeout(r, 160));
      setUploadProgress(Math.min(p, 100));
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error('Please login again before uploading your resume.');

      const uploaded = await uploadResume({
        user: data.user,
        profile,
        file
      });

      setResume(uploaded);
      setUploadSuccess(true);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) simulateProgressAndUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateProgressAndUpload(e.dataTransfer.files[0]);
    }
  };

  const saveProfile = async (values) => {
    const next = { ...profile, ...values, role: 'User' };
    try {
      await upsertProfile(next);
      setProfile(next);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
    }
  };

  return <motion.div {...page} className="dashboard"><DashboardHeader title="User Dashboard" subtitle="Manage your profile, resume, notifications, and application status." />
    <div className="dashboard-grid">
      <Card><User className="card-icon" /><h3>{profile?.name}</h3><p>{profile?.email}</p><p>{profile?.phone || 'Phone not added'}</p></Card>
      
      {/* Drag & drop resume box with rocket progression */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`glass-card ${dragActive ? 'resume-dropzone-glow' : ''}`}
        style={{ transition: 'all 0.3s ease' }}
      >
        <FileUp className="card-icon" />
        <h3>Resume Upload</h3>
        
        {uploading ? (
          <div className="upload-progress-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px' }}>
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ color: '#a855f7' }}
            >
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <path d="M12 32C12 22 20 18 36 18C48 18 56 26 58 32C56 38 48 46 36 46C20 46 12 42 12 32Z" fill="url(#astroUpGrad)" stroke="#c084fc" />
                <path d="M44 20C47 23 54 28 58 32C54 36 47 41 44 44C49 39 49 25 44 20Z" fill="#ec4899" />
                <path d="M12 32C12 32 3 35 1 32C3 29 12 32 12 32Z" fill="#fb923c" />
                <rect x="25" y="27" width="10" height="12" rx="1" fill="#fff" stroke="#4f46e5" strokeWidth="0.8" />
                <line x1="28" y1="31" x2="32" y2="31" stroke="#4f46e5" strokeWidth="0.8" />
                <line x1="28" y1="34" x2="32" y2="34" stroke="#4f46e5" strokeWidth="0.8" />
                <defs>
                  <linearGradient id="astroUpGrad" x1="12" y1="32" x2="58" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(to right, #a855f7, #ec4899)', borderRadius: '99px' }} />
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Uploading Resume: {uploadProgress}%</span>
          </div>
        ) : uploadSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '8px' }}>
            <motion.div initial={{ scale: 0.2 }} animate={{ scale: [0.2, 1.3, 1.0] }} transition={{ duration: 0.5 }} style={{ color: '#10b981' }}>
              <CheckCircle2 size={40} />
            </motion.div>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>Success! Sparking checkmark.</span>
            <button className="upload" style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }} onClick={() => setUploadSuccess(false)}>Upload Another</button>
          </div>
        ) : (
          <>
            <label className="upload">
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              Choose File or Drag Here
            </label>
            {resume ? <p>{resume.resume_file_name || resume.fileName}</p> : <p>No resume uploaded yet.</p>}
          </>
        )}
      </div>

      <Card><Bell className="card-icon" /><h3>Notifications</h3>{notifications.length ? notifications.map((item) => <button className={'notice ' + (item.is_read ? 'read' : '')} key={item.id} onClick={() => markNotificationRead(item.id)}><strong>{item.title}</strong><span>{item.message}</span></button>) : <p>No notifications yet.</p>}</Card>
    </div>
    
    <Card className="wide">
      <h2>Application Pipeline</h2>
      {resume ? (
        <>
          <div className="status-line">
            {timelineStatuses.map((step, index) => (
              <div className={index <= progress ? 'done' : ''} key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <p className={'badge status-' + resume.status.toLowerCase().replaceAll(' ', '-')}>Current: {resume.status}</p>
          <p>
            { {
              'Resume Under Review': 'Your resume has been received successfully and is currently under review. We will contact you once the evaluation process is complete.',
              'Shortlisted': 'Congratulations! Your profile has been shortlisted for the next stage. Our recruitment team will contact you shortly with interview details.',
              'Interview Scheduled': 'Thank you for your application. Your interview has been scheduled. Please check your email for the interview date, time, and meeting details.',
              'Need More Information': 'Thank you for your application. Please upload your updated resume and any additional documents required to proceed with your application.',
              'Application Not Selected': 'Thank you for your interest in Techie Brains. After careful review, we have decided not to proceed with your application at this time. We encourage you to apply again when suitable opportunities become available.'
            }[resume.status] || resume.remarks || 'Your application will update as the admin reviews your resume.' }
          </p>
        </>
      ) : (
        <p className="empty-state">Upload a resume to start tracking your application status.</p>
      )}
    </Card>
    
    <Card className="wide"><h2>Account Settings</h2><form className="form settings-form" onSubmit={handleSubmit(saveProfile)}><input {...register('name', { required: true })} placeholder="Name" /><input type="email" {...register('email', { required: true })} placeholder="Email" /><input {...register('phone')} placeholder="Phone" /><button className="gradient-btn">Save Profile</button></form></Card>
  </motion.div>;
}

function AdminDashboard() {
  const { profile } = useAuth();
  const { adminResumes, setAdminResumes, contactMessages, setContactMessages, adminUsers, setAdminUsers, deleteContactMessage, toggleContactMessageRead } = useAppStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [stats, setStats] = useState({ users: 0, resumes: 0, messages: 0, accepted: 0, rejected: 0, pending: 0 });

  const loadAdminData = async () => {
    if (!supabaseConfigured) return;
    try {
      const [users, resumes, messages, nextStats] = await Promise.all([fetchUsers(), fetchResumes(), fetchContactMessages(), fetchStats()]);
      setAdminUsers(users);
      setAdminResumes(resumes);
      setContactMessages(messages);
      setStats(nextStats);
    } catch (error) {
      toast.error(error.message || 'Could not load admin data');
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const rows = useMemo(() => adminResumes.filter((row) => {
    const text = ((row.user_name || '') + ' ' + (row.email || '') + ' ' + (row.status || '')).toLowerCase();
    return text.includes(query.toLowerCase()) && (filter === 'All' || row.status === filter);
  }), [adminResumes, query, filter]);

  const updateStatus = async (row, status) => {
    try {
      const updated = await updateResumeStatus(row.id, status);
      setAdminResumes(adminResumes.map((item) => item.id === row.id ? updated : item));
      setStats(await fetchStats());
      toast.success('Application status updated');
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    }
  };

  const download = async (row) => {
    try {
      const url = await getResumeDownloadUrl(row.resume_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.message || 'Download failed');
    }
  };

  const markMessage = async (message) => {
    try {
      await updateContactMessage(message.id, { is_read: !message.is_read });
      toggleContactMessageRead(message.id);
    } catch (error) {
      toast.error(error.message || 'Could not update message');
    }
  };

  const removeMessage = async (id) => {
    try {
      await deleteContactMessageDb(id);
      deleteContactMessage(id);
      setStats(await fetchStats());
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.message || 'Could not delete message');
    }
  };

  const metricCards = [
    ['Total Users', stats.users, Users], ['Total Resumes Uploaded', stats.resumes, FileUp], ['Total Contact Messages', stats.messages, Mail],
    ['Accepted Applications', stats.accepted, CheckCircle2], ['Rejected Applications', stats.rejected, X], ['Pending Applications', stats.pending, Bell]
  ];

  return <motion.div {...page} className="dashboard"><DashboardHeader title="Admin Dashboard" subtitle="Overview, users, resumes, contact messages, website statistics, and logout." />
    <div className="metric-grid">{metricCards.map(([label, value, Icon]) => <Card key={label}><Icon className="card-icon" /><strong>{value}</strong><span>{label}</span></Card>)}</div>
    <Card className="wide"><h2>Registered Users</h2>{adminUsers.length ? <div className="user-list">{adminUsers.map((user) => <div key={user.id}><span><strong>{user.name}</strong><small>{user.email} - {user.phone || 'No phone'}</small></span><span className="badge">{user.role}</span></div>)}</div> : <p className="empty-state">No users registered.</p>}</Card>
    <Card className="wide"><div className="table-head"><h2>Uploaded Resumes</h2><div className="table-tools"><label><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resumes" /></label><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option>{allStatuses.map((status) => <option key={status}>{status}</option>)}</select></div></div>{rows.length ? <div className="table">{rows.map((row) => <div key={row.id}><span><strong>{row.user_name}</strong><small>{row.email} - {new Date(row.uploaded_at).toLocaleString()}</small><small>{row.resume_file_name}</small></span><select value={row.status} onChange={(e) => updateStatus(row, e.target.value)}>{allStatuses.map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => toast.message(row.user_name, { description: row.resume_file_name })}><Eye />View</button><button onClick={() => download(row)}><Download />Download</button></div>)}</div> : <p className="empty-state">No resumes uploaded yet.</p>}</Card>
    <Card className="wide"><h2>Contact Messages</h2>{contactMessages.length ? <div className="message-list">{contactMessages.map((message) => <div key={message.id} className={message.is_read ? 'read-message' : ''}><span><strong>{message.subject}</strong><small>{message.name} - {message.email} - {new Date(message.created_at).toLocaleString()}</small></span><p>{message.message}</p><div><button className="secondary-btn" onClick={() => markMessage(message)}>{message.is_read ? 'Mark Unread' : 'Mark Read'}</button><button className="secondary-btn danger-text" onClick={() => removeMessage(message.id)}>Delete</button></div></div>)}</div> : <p className="empty-state">No contact messages received.</p>}</Card>
    <Card className="wide"><h2>Website Statistics</h2><ResponsiveContainer width="100%" height={260}><AreaChart data={[{ name: 'Users', value: stats.users }, { name: 'Resumes', value: stats.resumes }, { name: 'Messages', value: stats.messages }]}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.25)"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.18)"/></AreaChart></ResponsiveContainer></Card>
  </motion.div>;
}

function DashboardHeader({ title, subtitle }) {
  return <section className="dash-head"><span className="pill"><ShieldCheck size={16}/>Protected Route</span><h1>{title}</h1><p>{subtitle}</p></section>;
}

function Footer() {
  const footerLinks = [['/', 'Home'], ['/about', 'About Us'], ['/services', 'Services'], ['/contact', 'Contact']];
  const navigateTransition = useSpaceTransition();
  return <footer><div><img src="/techiebrains-logo.png" alt="Techie Brains" /><p>Premium recruitment and IT consulting for scalable, cost-effective, and trustworthy enterprise outcomes.</p><div className="footer-actions"><a href="https://www.linkedin.com/company/techie-brains-incorporated/about/" target="_blank" rel="noreferrer"><Linkedin size={18} />LinkedIn</a></div></div>
    <div><h3>Quick Links</h3>{footerLinks.map(([to,label]) => <a key={to} href={to} onClick={(e) => { e.preventDefault(); navigateTransition(to); }}>{label}</a>)}</div>
    <div><h3>Services</h3><a href="/services" onClick={(e) => { e.preventDefault(); navigateTransition('/services'); }}>IT Staffing</a><a href="/services" onClick={(e) => { e.preventDefault(); navigateTransition('/services'); }}>IT Consulting</a><a href="/contact" onClick={(e) => { e.preventDefault(); navigateTransition('/contact'); }}>Send Requirement</a></div>
    <div><h3>Contact</h3><p>{office}</p><p>040-46032959</p><p>info@techiebrains.com</p><a href="/contact" onClick={(e) => { e.preventDefault(); navigateTransition('/contact'); }}>Contact Form</a></div>
    <small>Copyright (c) 2026 Techie Brains Inc. Privacy Policy | Terms & Conditions</small></footer>;
}

export default App;
