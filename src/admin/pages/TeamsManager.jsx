import React, { useState, useEffect } from 'react';
        import { getTeams, updateTeamStatus, assignTeamNumber } from
        '../../services/adminService';
        import './TeamsManager.css';


        export default function TeamsManager() {
          const [teams, setTeams] = useState([]);
          const [loading, setLoading] = useState(true);
          const [searchQuery, setSearchQuery] = useState('');
          const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);


  const [selectedTeam, setSelectedTeam] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      const data = await getTeams({ statusFilter, searchQuery });
      setTeams(data);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch teams.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTeamsData();
  }, [statusFilter]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeamsData();
  };


  const openStatusModal = (team) => {
    setSelectedTeam(team);
    setActionType('status');
    setModalInput(team.registration_status);
    setModalReason('Team registration status updated by admin');
  };

  const openNumberModal = (team) => {
    setSelectedTeam(team);
    setActionType('number');
    setModalInput(team.team_number || '');
    setModalReason('Team ID number updated by admin');
  };

  const openRosterModal = (team) => {
    setSelectedTeam(team);
    setActionType('roster');
  };

  const closeModal = () => {
    setSelectedTeam(null);
    setActionType(null);
    setModalInput('');
    setModalReason('');
  };

  const handleModalSave = async () => {
    const defaultReason = actionType === 'status'
      ? 'Team registration status updated by admin'
      : 'Team ID number updated by admin';
    const finalReason = modalReason.trim() || defaultReason;

    setIsSubmitting(true);
    try {
      if (actionType === 'status') {
        await updateTeamStatus(selectedTeam.id, modalInput, finalReason);
        setNotification({ type: 'success', message: `Status updated for ${selectedTeam.team_name}.` });
      } else if (actionType === 'number') {
        if (!modalInput.trim()) {
          alert('Team number cannot be empty.');
          setIsSubmitting(false);
          return;
        }
        await assignTeamNumber(selectedTeam.id, modalInput, finalReason);
        setNotification({ type: 'success', message: `Assigned ID ${modalInput} to ${selectedTeam.team_name}.` });
      }
      closeModal();
      fetchTeamsData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const exportApprovedCsv = () => {
    const approved = teams.filter((t) => t.registration_status ===
'approved');
    if (approved.length === 0) {
      alert('No approved teams available to export.');
      return;
    }


    const headers = ['Team ID', 'Team Name', 'Leader Name', 'Leader Mobile', 'Members'];
    const rows = approved.map((t) => [
      `"${t.team_number || 'UNASSIGNED'}"`,
      `"${t.team_name.replace(/"/g, '""')}"`,
      `"${t.team_leader_name.replace(/"/g, '""')}"`,
      `"${t.team_leader_mobile}"`,
      `"${(t.team_members || []).map((m) => m.member_name).join(', ').replace(/"/g, '""')}"`
    ]);


    const csvContent = 'data:text/csv;charset=utf-8,' +
[headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ignite2026_approved_teams_${new
Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="teams-manager-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-red">ROSTER
REGISTRY</span>
          <h1 className="page-title">SQUAD MANAGEMENT</h1>
        </div>


        <button onClick={exportApprovedCsv} className="comic-btn export-
csv-btn">
          📥 EXPORT APPROVED (CSV)
        </button>
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="filters-bar comic-panel">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search squad name, team number, or leader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="comic-input search-input"
          />
          <button type="submit" className="comic-btn search-
btn">SEARCH</button>
        </form>


        <div className="status-pills-row">
          <span className="filter-label">FILTER STATUS:</span>
          {['all', 'pending', 'approved', 'rejected',
'disqualified'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`filter-pill ${statusFilter === st ? 'active' :
''}`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>


      <div className="teams-table-card comic-panel">
        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <p>SYNCING SQUAD ROSTERS...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TEAM ID</th>
                  <th>SQUAD NAME</th>
                  <th>LEADER</th>
                  <th>MOBILE (AUTHORIZED)</th>
                  <th>ROSTER</th>
                  <th>STATUS</th>
                  <th>REGISTERED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <span className="team-id-badge">
{team.team_number || 'PENDING'}</span>
                      </td>
                      <td className="team-name-strong">
                        <strong>{team.team_name}</strong>
                      </td>
                      <td>{team.team_leader_name}</td>
                      <td>
                        <span className="mobile-protected">
{team.team_leader_mobile}</span>
                      </td>
                      <td>
                        <span className="members-count">
                          {team.team_members?.length || 0} players
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill-badge
${team.registration_status}`}>
                          {team.registration_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(team.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => openRosterModal(team)}
                            className="action-link"
                            title="View Squad Roster"
                          >
                            ROSTER
                          </button>
                          <button
                            onClick={() => openNumberModal(team)}
                            className="action-link"
                            title="Assign Official ID"
                          >
                            ASSIGN ID
                          </button>
                          <button
                            onClick={() => openStatusModal(team)}
                            className="action-link"
                            title="Update Status"
                          >
                            STATUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state-cell">
                      No teams found matching current search and status
filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {selectedTeam && (
        <div className="modal-backdrop">
          <div className="modal-card comic-panel">
            <div className="modal-header">
              <h3 className="modal-title">
                {actionType === 'number' && `ASSIGN NUMBER:
${selectedTeam.team_name}`}
                {actionType === 'status' && `UPDATE STATUS:
${selectedTeam.team_name}`}
                {actionType === 'roster' && `ROSTER:
${selectedTeam.team_name}`}
              </h3>
              <button onClick={closeModal} className="modal-close-
btn">✕</button>
            </div>


            <div className="modal-body">
              {actionType === 'number' && (
                <div className="modal-form-content">
                  <div className="form-group">
                    <label>OFFICIAL TEAM IDENTIFIER</label>
                    <input
                      type="text"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder="e.g. IGN-042"
                      className="comic-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>AUDIT LOG REASON (OPTIONAL)</label>
                    <textarea
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="e.g. Assigned upon on-site check-in
and document verification."
                      className="comic-input"
                      rows="2"
                    />
                  </div>
                </div>
              )}


              {actionType === 'status' && (
                <div className="modal-form-content">
                  <div className="form-group">
                    <label>REGISTRATION STATUS</label>
                    <select
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      className="comic-input"
                    >
                      <option value="pending">PENDING</option>
                      <option value="approved">APPROVED</option>
                      <option value="rejected">REJECTED</option>
                      <option value="disqualified">DISQUALIFIED</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>AUDIT LOG REASON (OPTIONAL)</label>
                    <textarea
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="e.g. Approved team after eligibility
screening."
                      className="comic-input"
                      rows="2"
                    />
                  </div>
                </div>
              )}


              {actionType === 'roster' && (
                <div className="roster-view-content">
                  <div className="roster-meta-grid">
                    <div><strong>Leader:</strong>
{selectedTeam.team_leader_name}</div>
                    <div><strong>Contact:</strong>
{selectedTeam.team_leader_mobile}</div>
                    <div><strong>Team ID:</strong>
{selectedTeam.team_number || 'None'}</div>
                    <div><strong>Status:</strong>
{selectedTeam.registration_status}</div>
                  </div>


                  <h4 className="roster-subheading">SQUAD MEMBERS:</h4>
                  <ul className="roster-list">
                    {(selectedTeam.team_members || []).map((m, idx) => (
                      <li key={m.id || idx}>
                        <span className="member-num">#{idx + 1}</span>
{m.member_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>


            <div className="modal-footer">
              <button onClick={closeModal} className="comic-btn modal-
cancel-btn">
                {actionType === 'roster' ? 'CLOSE' : 'CANCEL'}
              </button>
              {actionType !== 'roster' && (
                        <button
                          onClick={handleModalSave}
                          disabled={isSubmitting}
                          className="comic-btn comic-btn-primary modal-save-btn"
                        >
                          {isSubmitting ? 'RECORDING AUDIT...' : 'CONFIRM CHANGE'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
