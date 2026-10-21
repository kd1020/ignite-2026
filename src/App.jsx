import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import EventIntro from './components/EventIntro.jsx';
import RoundOverview from './components/RoundOverview.jsx';
import RoundDetails from './components/RoundDetails.jsx';
import Registration from './components/Registration.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Footer from './components/Footer.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import './App.css';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin');
  });

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      setIsAdminRoute(path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin'));
    };

    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href === '/admin' || href === '#admin' || href === '#/admin') {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setIsAdminRoute(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (href === '/' || href === '#hero') {
        if (isAdminRoute) {
          e.preventDefault();
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return (
      <div className="ignite-app-root admin-mode">
        <AdminLayout />
      </div>
    );
  }

  return (
    <div className="ignite-app-root">
      <Navbar />
      <main>
        <Hero />
        <EventIntro />
        <RoundOverview />
        <RoundDetails />
        <Registration />
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
