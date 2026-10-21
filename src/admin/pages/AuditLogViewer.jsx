import React, { useState, useEffect } from 'react';
        import { getAuditLogs } from '../../services/adminService';
        import './AuditLogViewer.css';


        export default function AuditLogViewer() {
          const [logs, setLogs] = useState([]);
          const [loading, setLoading] = useState(true);
          const [actionFilter, setActionFilter] = useState('all');
          const [expandedLogId, setExpandedLogId] = useState(null);
          const [notification, setNotification] = useState(null);


          const fetchLogs = async () => {
            try {
              setLoading(true);
              const data = await getAuditLogs({ limit: 100 });
              setLogs(data);
            } catch (err) {
              setNotification({ type: 'error', message: err.message || 'Failed         to fetch audit trail.' });
            } finally {
              setLoading(false);
            }
          };
  useEffect(() => {
    fetchLogs();
  }, []);


  const filteredLogs = logs.filter((log) => {
    if (actionFilter === 'all') return true;
    return log.action === actionFilter;
  });


  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };


  return (
    <div className="audit-log-page">
      <div className="page-header-row">
        <div>
          <span className="comic-badge comic-tag-red">SECURITY
AUDIT</span>
          <h1 className="page-title">IMMUTABLE LOG TRAIL</h1>
        </div>


        <div className="security-tag">
          🔒 READ-ONLY ENFORCED VIA DATABASE RLS
        </div>
      </div>


      {notification && (
        <div className={`notification-bar ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}
className="notif-close">✕</button>
        </div>
      )}


      <div className="audit-filters-bar comic-panel">
        <div className="filter-group">
          <label>FILTER BY EVENT ACTION:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="comic-input"
          >
            <option value="all">ALL ACTIONS</option>
            <option value="SCORE_CORRECTION_R1">ROUND 1 SCORE
CORRECTIONS</option>
            <option value="MATCH_RESULT_RECORDED_R2">ROUND 2 MATCH
OUTCOMES</option>
            <option value="TEAM_STATUS_UPDATE">TEAM STATUS
MODIFICATIONS</option>
            <option value="TEAM_NUMBER_ASSIGNED">TEAM NUMBER
ASSIGNMENTS</option>
            <option value="EVENT_SETTING_UPDATE">EVENT SETTING
CHANGES</option>
          </select>
        </div>


        <button onClick={fetchLogs} className="comic-btn reload-btn">
          REFRESH LOGS
        </button>
      </div>


      <div className="audit-table-card comic-panel">
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            <p>QUERYING AUDIT LEDGER...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TIMESTAMP (UTC)</th>
                  <th>ACTION</th>
                  <th>ADMINISTRATOR</th>
                  <th>TARGET RECORD</th>
                  <th>REASON GIVEN</th>
                  <th>PAYLOAD DIFF</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;


                    return (
                      <React.Fragment key={log.id}>
                        <tr>
                          <td className="timestamp-cell">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td>
                            <span className="action-tag">{log.action}
</span>
                          </td>
                          <td>
                            <strong>{log.admin_users?.full_name ||
'System / Admin'}</strong>
                            <div className="admin-email-sub">
{log.admin_users?.email}</div>
                          </td>
                          <td>
                            <code>{log.entity_name}
[{log.entity_id.slice(0, 8)}...]</code>
                          </td>
                          <td className="reason-cell">
                            <em>"{log.reason}"</em>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="inspect-btn"
                            >
                              {isExpanded ? 'HIDE JSON ▲' : 'INSPECT DIFF ▼'}
                            </button>
                          </td>
                        </tr>


                        {isExpanded && (
                          <tr className="diff-row">
                            <td colSpan="6">
                              <div className="diff-container">
                                <div className="diff-box">
                                  <div className="diff-title">PREVIOUS
VALUES</div>
                                  <pre className="diff-pre">
                                    {log.previous_values
                                      ?
JSON.stringify(log.previous_values, null, 2)
                                      : 'NULL (Initial insertion)'}
                                  </pre>
                                </div>
                                <div className="diff-box">
                                  <div className="diff-title">NEW
VALUES</div>
                                  <pre className="diff-pre">
                                    {log.new_values
                                      ? JSON.stringify(log.new_values,
null, 2)
                                      : 'NULL (Deletion)'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      No audit records found matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
            </div>
          );
        }
