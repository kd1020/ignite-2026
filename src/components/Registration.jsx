import React, { useState } from 'react';
import { validateRegistrationForm } from '../utils/validation';
import { submitRegistration } from '../services/api';
import './Registration.css';

export default function Registration() {
  const [formData, setFormData] = useState({
    teamName: '',
    leaderName: '',
    leaderMobile: '',
    members: ['', '']
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [apiFeedback, setApiFeedback] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleMemberChange = (index, value) => {
    const updated = [...formData.members];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, members: updated }));

    if (errors.memberList && errors.memberList[index]) {
      const updatedErrors = { ...errors };
      delete updatedErrors.memberList[index];
      setErrors(updatedErrors);
    }
  };

  const addMemberSlot = () => {
    if (formData.members.length < 5) {
      setFormData((prev) => ({ ...prev, members: [...prev.members, '']
}));
    }
  };

  const removeMemberSlot = (index) => {
    if (formData.members.length > 1) {
      const updated = formData.members.filter((_, idx) => idx !==
index);
      setFormData((prev) => ({ ...prev, members: updated }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiFeedback(null);

    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const response = await submitRegistration(formData);
      setStatus('success');
      setApiFeedback(response);
    } catch (err) {
      setStatus('error');
      setApiFeedback({
        message: err.message || "Failed to transmit registration. Please check your connection."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      leaderName: '',
      leaderMobile: '',
      members: ['', '']
    });
    setErrors({});
    setStatus('idle');
    setApiFeedback(null);
  };

  return (
    <section id="register" className="registration-section">
      <div className="container">
        <div className="registration-wrapper comic-panel">
          <div className="registration-header">
            <span className="comic-badge comic-tag-red">ENROLLMENT
PORTAL</span>
            <h2 className="registration-title">REGISTER YOUR
SQUAD</h2>
            <p className="registration-subtitle">
              Secure your place in the IGNITE 2026 arena. Review your
roster carefully before locking in.
            </p>
          </div>

          {status === 'success' && apiFeedback && (
            <div className="status-banner success-banner comic-panel">
              <div className="status-badge success-badge">ROSTER
ENROLLED!</div>
              <h3 className="status-title">WELCOME TO THE ARENA,
{apiFeedback.teamName}</h3>
              <p className="status-text">{apiFeedback.message}</p>

              <div className="ticket-id-box">
                <span className="ticket-label">MOCK REGISTRATION
TOKEN:</span>
                <span
className="ticket-token">{apiFeedback.referenceId}</span>
              </div>

              <p className="status-note">
                <em>* Note: Ready for Supabase API integration in
<code>src/services/api.js</code>.</em>
              </p>

              <button type="button" onClick={resetForm}
className="comic-btn reset-btn">
                ENROLL ANOTHER TEAM
              </button>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit} noValidate
className="registration-form">
              {status === 'error' && (
                <div className="status-banner error-banner">
                  <span className="error-icon">⚠</span>
                  <span>{apiFeedback?.message}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="teamName" className="comic-label">
                    TEAM NAME <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    placeholder="e.g. Apex Predators"
                    className={`comic-input ${errors.teamName ?
'input-error' : ''}`}
                    disabled={status === 'submitting'}
                  />
                  {errors.teamName && <span
className="field-error-msg">{errors.teamName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="leaderName" className="comic-label">
                    TEAM LEADER NAME <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="leaderName"
                    name="leaderName"
                    value={formData.leaderName}
                    onChange={handleInputChange}
                    placeholder="Full name of leader"
                    className={`comic-input ${errors.leaderName ?
'input-error' : ''}`}
                    disabled={status === 'submitting'}
                  />
                  {errors.leaderName && <span
className="field-error-msg">{errors.leaderName}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="leaderMobile"
className="comic-label">
                    TEAM LEADER MOBILE NUMBER <span
className="req">*</span>
                  </label>
                  <div className="mobile-input-wrapper">
                    <span className="mobile-prefix">+91</span>
                    <input
                      type="tel"
                      id="leaderMobile"
                      name="leaderMobile"
                      value={formData.leaderMobile}
                      onChange={handleInputChange}
                      placeholder="10-digit Indian number (e.g. 9876543210)"
                      className={`comic-input mobile-input
${errors.leaderMobile ? 'input-error' : ''}`}
                      disabled={status === 'submitting'}
                    />
                  </div>
                  {errors.leaderMobile && <span
className="field-error-msg">{errors.leaderMobile}</span>}
                  <span className="input-hint">Must be an active
Indian mobile number for tournament updates.</span>
                </div>
              </div>

              <div className="members-section">
                <div className="members-header">
                  <div>
                    <h3 className="comic-label members-title">
                      ADDITIONAL SQUAD MEMBERS
({formData.members.length} / 5)
                    </h3>
                    <p className="input-hint">Specify full names for
all other team members.</p>
                  </div>

                  <button
                    type="button"
                    onClick={addMemberSlot}
                    disabled={formData.members.length >= 5 || status
=== 'submitting'}
                    className="comic-btn add-member-btn"
                  >
                    + ADD MEMBER
                  </button>
                </div>

                {errors.members && <span className="field-error-msg block-error">{errors.members}</span>}

                <div className="member-slots-list">
                  {formData.members.map((member, index) => (
                    <div key={index} className="member-slot-row">
                      <div className="slot-index-badge">MEMBER #{index
+ 1}</div>
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => handleMemberChange(index,
e.target.value)}
                        placeholder={`Member #${index + 1} full name`}
                        className={`comic-input member-input ${
                          errors.memberList &&
errors.memberList[index] ? 'input-error' : ''
                        }`}
                        disabled={status === 'submitting'}
                      />
                      {formData.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMemberSlot(index)}
                          className="remove-member-btn"
                          aria-label={`Remove member ${index + 1}`}
                          disabled={status === 'submitting'}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-submit-row">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="comic-btn comic-btn-primary register-submit-btn"
                >
                  {status === 'submitting' ? (
                    <span className="submitting-spinner">
                      <span className="spinner-dot"></span>
TRANSMITTING ROSTER...
                    </span>
                  ) : (
                    'REGISTER TEAM'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
