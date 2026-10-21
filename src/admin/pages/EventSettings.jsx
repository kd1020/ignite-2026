import React, { useState, useEffect } from 'react';
import { getEventSettings, updateEventSetting } from
'../../services/adminService';
import './EventSettings.css';


export default function EventSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [auditReason, setAuditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getEventSettings();
      const mapped = {};
      data.forEach((s) => {
        mapped[s.key] = s.value;
      });
      setSettings(mapped);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to load configuration.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadSettings();
  }, []);


  const handleUpdate = async (key, newValue, desc) => {
    if (!auditReason.trim() || auditReason.trim().length < 4) {
      alert('An audit log reason is required before modifying live event parameters.');
      return;
    }


    setIsSaving(true);
    try {
      await updateEventSetting(key, newValue, auditReason);
      setNotification({
        type: 'success',
        message: `Setting [${key}] successfully updated and logged to
audit trail.`
      });
      setAuditReason('');
      loadSettings();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>READING SYSTEM CONFIGURATION...</p>
      </div>
    );
  }


  const regStatus = settings.registration_status || { open: true };
  const leadVisibility = settings.leaderboard_visibility || {
public_visible: true, show_r2_swings: true, frozen: false };
  const prizePool = settings.prize_pool || { display_text: 'A PRIZE POOL WORTH THE FIGHT.' };
  const announcements = settings.public_announcements || { active: true,
banner_text: '' };


  return (
    <div className="event-settings-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-lavender">SYSTEM
CONFIGURATION</span>
          <h1 className="page-title">EVENT PARAMETERS</h1>
        </div>


        <div className="mandatory-audit-box">
          <label>GLOBAL AUDIT REASON (REQUIRED FOR EDITS):</label>
          <input
            type="text"
            placeholder="e.g. Official organizer decision to freeze leaderboard at round end."
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            className="comic-input audit-reason-input"
          />
        </div>
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="settings-cards-grid">
        <div className="setting-card comic-panel">
          <div className="card-header">
            <span className="card-badge">ACCESS CONTROL</span>
            <h3 className="card-title">PUBLIC REGISTRATION PORTAL</h3>
          </div>
          <p className="card-desc">
            Controls whether squads can submit new registration forms on
the public website.
          </p>


          <div className="toggle-row">
            <span className="toggle-status">
              Current Status: <strong>{regStatus.open ? 'OPEN (ACCEPTING TEAMS)' : 'CLOSED'}</strong>
            </span>
            <button
              onClick={() => handleUpdate('registration_status', {
...regStatus, open: !regStatus.open }, 'Toggled registration window')}
              disabled={isSaving}
              className={`comic-btn toggle-btn ${regStatus.open ? 'btn- red' : 'btn-green'}`}
            >
              {regStatus.open ? 'CLOSE REGISTRATION' : 'OPEN REGISTRATION'}
            </button>
          </div>
        </div>


        <div className="setting-card comic-panel">
          <div className="card-header">
            <span className="card-badge">PUBLIC TRANSPARENCY</span>
            <h3 className="card-title">LEADERBOARD DISPLAY</h3>
          </div>
          <p className="card-desc">
            Toggle public visibility or freeze scores prior to the
crowning finale.
          </p>


          <div className="toggle-row">
            <span className="toggle-status">
              Public Standings: <strong>{leadVisibility.public_visible ?
'VISIBLE' : 'HIDDEN'}</strong>
            </span>
            <button
              onClick={() => handleUpdate('leaderboard_visibility', {
...leadVisibility, public_visible: !leadVisibility.public_visible },
'Toggled leaderboard visibility')}
              disabled={isSaving}
              className="comic-btn toggle-btn"
            >
              {leadVisibility.public_visible ? 'HIDE FROM PUBLIC' :
'MAKE PUBLIC'}
            </button>
          </div>
        </div>


        <div className="setting-card comic-panel full-width">
          <div className="card-header">
            <span className="card-badge">BRAND MESSAGING</span>
            <h3 className="card-title">PRIZE POOL DISPLAY TEXT</h3>
          </div>
          <p className="card-desc">
            Configurable public copy for Round 3 and promotional cards
(avoids hardcoding unverified cash amounts).
          </p>


          <div className="editable-setting-row">
            <input
              type="text"
              defaultValue={prizePool.display_text}
              id="prizePoolInput"
              className="comic-input prize-input"
            />
            <button
              onClick={() => {
                const val =
document.getElementById('prizePoolInput').value;
                handleUpdate('prize_pool', { display_text: val },
'Updated prize pool copy');
              }}
              disabled={isSaving}
              className="comic-btn comic-btn-primary"
            >
              UPDATE PRIZE COPY
            </button>
          </div>
        </div>


        <div className="setting-card comic-panel full-width">
          <div className="card-header">
            <span className="card-badge">MARQUEE ALERT</span>
            <h3 className="card-title">PUBLIC ANNOUNCEMENT BANNER</h3>
          </div>
          <p className="card-desc">
            Broadcast urgent schedule updates or check-in instructions
to all participants.
          </p>


          <div className="editable-setting-row">
                    <input
                      type="text"
                      defaultValue={announcements.banner_text}
                      id="announcementInput"
                      placeholder="e.g. Round 1 Briefing begins in Auditorium at         10:00 AM."
                      className="comic-input prize-input"
                    />
                    <button
                      onClick={() => {
                        const val =
        document.getElementById('announcementInput').value;
                        handleUpdate('public_announcements', { ...announcements,
        banner_text: val }, 'Updated public announcement');
                      }}
                      disabled={isSaving}
                      className="comic-btn"
                    >
                      BROADCAST BANNER
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
