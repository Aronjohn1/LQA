import React, { useState, useEffect } from "react";
import api from "../../services/api";
function ManageRequest() {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [actionType, setActionType] = useState("approve");
  const [filters, setFilters] = useState({
    status: "all",
    user_category: "all",
    search: ""
  });
  useEffect(() => {
    fetchAllRequests();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [filters, allRequests]);
  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/requests');
      console.log("All requests:", res.data);
      setAllRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert("Failed to fetch requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...allRequests];
    if (filters.status !== "all") {
      filtered = filtered.filter(req => req.status === filters.status);
    }
    if (filters.user_category !== "all") {
      filtered = filtered.filter(req => req.user_category === filters.user_category);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(req => req.user_name && req.user_name.toLowerCase().includes(searchLower) || req.c_id && req.c_id.toString().includes(searchLower) || req.s_id && req.s_id.toString().includes(searchLower) || req.j_id && req.j_id.toString().includes(searchLower) || req.e_id && req.e_id.toString().includes(searchLower) || req.t_id && req.t_id.toString().includes(searchLower) || req.i_id && req.i_id.toString().includes(searchLower) || req.reason && req.reason.toLowerCase().includes(searchLower));
    }
    setFilteredRequests(filtered);
  };
  const getUniqueCategories = () => {
    return [...new Set(allRequests.map(req => req.user_category).filter(Boolean))];
  };
  const openActionModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminResponse("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminResponse("");
  };
  const handleApproveReject = async () => {
    if (!selectedRequest) return;
    if (actionType === "reject" && !adminResponse.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    try {
      const payload = {
        status: actionType === "approve" ? "approved" : "rejected",
        admin_response: adminResponse.trim() || null
      };
      console.log("Updating request:", {
        category: selectedRequest.user_category,
        id: selectedRequest.id,
        payload
      });
      const res = await api.put(`/requests/request/${selectedRequest.user_category}/${selectedRequest.id}`, payload);
      alert(`Request ${actionType === "approve" ? "approved" : "rejected"} successfully!`);
      fetchAllRequests();
      closeModal();
    } catch (error) {
      console.error("Error updating request:", error);
      alert(error.response?.data?.message || "Failed to update request");
    }
  };
  const getStatusBadge = status => {
    const styles = {
      pending: {
        background: '#fef3c7',
        color: '#92400e'
      },
      approved: {
        background: '#d1fae5',
        color: '#065f46'
      },
      rejected: {
        background: '#fee2e2',
        color: '#991b1b'
      }
    };
    return <span style={{
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      ...styles[status]
    }}>
        {status.toUpperCase()}
      </span>;
  };
  const getRequestDetails = req => {
    switch (req.user_category) {
      case "college":
        let collegeChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          collegeChanges.push(`Program: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_year_block && req.new_year_block !== req.old_year_block) {
          collegeChanges.push(`Year/Block: ${req.old_year_block || 'N/A'} → ${req.new_year_block}`);
        }
        return collegeChanges.length > 0 ? collegeChanges.join(', ') : 'No changes specified';
      case "senior":
        let seniorChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          seniorChanges.push(`Strand: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_gradelevel && req.new_gradelevel !== req.old_gradelevel) {
          seniorChanges.push(`Grade: ${req.old_gradelevel || 'N/A'} → ${req.new_gradelevel}`);
        }
        if (req.new_section && req.new_section !== req.old_section) {
          seniorChanges.push(`Section: ${req.old_section || 'N/A'} → ${req.new_section}`);
        }
        return seniorChanges.length > 0 ? seniorChanges.join(', ') : 'No changes specified';
      case "junior":
        let juniorChanges = [];
        if (req.new_program && req.new_program !== req.old_program) {
          juniorChanges.push(`Grade: ${req.old_program || 'N/A'} → ${req.new_program}`);
        }
        if (req.new_section && req.new_section !== req.old_section) {
          juniorChanges.push(`Section: ${req.old_section || 'N/A'} → ${req.new_section}`);
        }
        return juniorChanges.length > 0 ? juniorChanges.join(', ') : 'No changes specified';
      case "elementary":
        if (req.new_section && req.new_section !== req.old_section) {
          return `Section: ${req.old_section || 'N/A'} → ${req.new_section}`;
        }
        return 'No changes specified';
      case "teacher":
        if (req.new_teacherlevel && req.new_teacherlevel !== req.old_teacherlevel) {
          return `Level: ${req.old_teacherlevel || 'N/A'} → ${req.new_teacherlevel}`;
        }
        return 'No changes specified';
      case "instructor":
        if (req.new_instructorlevel && req.new_instructorlevel !== req.old_instructorlevel) {
          return `Level: ${req.old_instructorlevel || 'N/A'} → ${req.new_instructorlevel}`;
        }
        return 'No changes specified';
      default:
        return 'No changes specified';
    }
  };
  const getRequestSummary = () => {
    const total = allRequests.length;
    const pending = allRequests.filter(req => req.status === 'pending').length;
    const approved = allRequests.filter(req => req.status === 'approved').length;
    const rejected = allRequests.filter(req => req.status === 'rejected').length;
    return {
      total,
      pending,
      approved,
      rejected
    };
  };
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const summary = getRequestSummary();
  return <div className="p-[20px] max-w-[1400px] m-[0_auto] bg-[#f5f7fa]">
      <div className="flex justify-between items-center mb-[30px]">
        <h2 className="text-[#1a202c] m-0">Manage Requests</h2>
        <button onClick={fetchAllRequests} disabled={loading} className="p-[8px_16px] bg-[#0b7a3a] text-white border-0 rounded-[6px] text-[14px] font-semibold cursor-pointer">
          ↻ Refresh
        </button>
      </div>

   
      <div className="grid [grid-template-columns:repeat(4,_1fr)] [gap:15px] mb-[30px]">
        <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb]">
          <div className="text-[14px] text-[#718096] mb-[8px]">Total Requests</div>
          <div className="text-[24px] font-bold text-[#2d3748]">{summary.total}</div>
        </div>
        
        <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb]">
          <div className="text-[14px] text-[#718096] mb-[8px]">Pending</div>
          <div className="text-[24px] font-bold text-[#d69e2e]">{summary.pending}</div>
        </div>
        
        <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb]">
          <div className="text-[14px] text-[#718096] mb-[8px]">Approved</div>
          <div className="text-[24px] font-bold text-[#38a169]">{summary.approved}</div>
        </div>
        
        <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb]">
          <div className="text-[14px] text-[#718096] mb-[8px]">Rejected</div>
          <div className="text-[24px] font-bold text-[#e53e3e]">{summary.rejected}</div>
        </div>
      </div>

      
      <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb] mb-[20px]">
        <div className="grid [grid-template-columns:repeat(3,_1fr)] [gap:15px]">
          <div>
            <label className="block text-[14px] font-semibold mb-[6px] text-[#4a5568]">Status</label>
            <select value={filters.status} onChange={e => setFilters({
            ...filters,
            status: e.target.value
          })} className="w-full p-[10px] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] bg-white text-black">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-[6px] text-[#4a5568]">User Category</label>
            <select value={filters.user_category} onChange={e => setFilters({
            ...filters,
            user_category: e.target.value
          })} className="w-full p-[10px] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] bg-white text-black">
              <option value="all">All Categories</option>
              {getUniqueCategories().map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-[6px] text-[#4a5568]">Search</label>
            <input type="text" placeholder="Search by name, ID, or reason..." value={filters.search} onChange={e => setFilters({
            ...filters,
            search: e.target.value
          })} className="w-full p-[10px] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] bg-white text-black" />
          </div>
        </div>
      </div>

 
      <div className="bg-white p-[20px] rounded-[8px] [border:1px_solid_#e5e7eb] text-black">
        {loading ? <div className="text-center p-[40px]">
            <p>Loading requests...</p>
          </div> : filteredRequests.length === 0 ? <div className="text-center p-[40px] text-[#718096]">
            <p>No requests found matching your filters.</p>
          </div> : <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full [border-collapse:collapse]">
              <thead>
                <tr className="[border-bottom:2px_solid_#e2e8f0]">
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Date</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">User</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Category</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Changes</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Reason</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Status</th>
                  <th className="p-[12px] text-left font-semibold text-[13px] text-[#4a5568]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, index) => <tr key={req.id || index} className="[border-bottom:1px_solid_#e2e8f0]">
                    <td className="p-[12px] text-[13px]">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="p-[12px] text-[13px]">
                      <div className="font-medium">{req.user_name || 'Unknown'}</div>
                      <div className="text-[12px] text-[#718096]">
                        ID: {req.c_id || req.s_id || req.j_id || req.e_id || req.t_id || req.i_id || 'N/A'}
                      </div>
                    </td>
                    <td className="p-[12px] text-[13px] capitalize">
                      {req.user_category}
                    </td>
                    <td className="p-[12px] text-[13px]">
                      <div>{getRequestDetails(req)}</div>
                    </td>
                    <td className="p-[12px] text-[13px] max-w-[200px]">
                      <div className="max-h-[60px] overflow-y-auto pr-[5px]">
                        {req.reason || 'No reason provided'}
                      </div>
                    </td>
                    <td className="p-[12px]">
                      {getStatusBadge(req.status)}
                      {req.reviewed_at && <div className="text-[11px] text-[#718096] mt-[4px]">
                          {formatDate(req.reviewed_at)}
                        </div>}
                    </td>
                    <td className="p-[12px]">
                      <div className="flex [gap:8px]">
                        {req.status === 'pending' && <>
                            <button onClick={() => openActionModal(req, 'approve')} className="p-[6px_12px] bg-[#38a169] text-white border-0 rounded-[4px] text-[12px] cursor-pointer">
                              Approve
                            </button>
                            <button onClick={() => openActionModal(req, 'reject')} className="p-[6px_12px] bg-[#e53e3e] text-white border-0 rounded-[4px] text-[12px] cursor-pointer">
                              Reject
                            </button>
                          </>}
                        {req.status !== 'pending' && <span className="text-[12px] text-[#718096]">
                            {req.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>}
                      </div>
                      {req.admin_response && <div className="text-[11px] text-[#4a5568] mt-[4px] max-w-[200px]">
                          <strong>Response:</strong> {req.admin_response}
                        </div>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

     
      {showModal && selectedRequest && <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,_0,_0,_0.5)] flex items-center justify-center [z-index:1000]">
          <div className="bg-white p-[30px] rounded-[8px] w-[500px] max-w-[90%] [border:1px_solid_#e5e7eb]">
            <h3 className="mb-[20px] text-[#1a202c]">
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            <div className="mb-[20px] text-black">
              <p><strong>User:</strong> {selectedRequest.user_name || 'Unknown'}</p>
              <p><strong>Category:</strong> {selectedRequest.user_category}</p>
              <p><strong>Changes:</strong> {getRequestDetails(selectedRequest)}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            </div>

            {actionType === 'reject' && <div className="mb-[20px]">
                <label className="block mb-[8px] font-semibold text-[#4e5c74]">
                  Reason for Rejection (Required)
                </label>
                <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)} placeholder="Explain why this request is being rejected..." rows={4} className="w-full p-[10px] rounded-[6px] [border:1px_solid_#cbd5e0] text-[14px] text-black bg-white" />
              </div>}

            <div className="flex justify-end [gap:10px]">
              <button onClick={closeModal} className="p-[10px_20px] bg-[#e2e8f0] text-[#4a5568] border-0 rounded-[6px] text-[14px] cursor-pointer">
                Cancel
              </button>
              <button onClick={handleApproveReject} disabled={actionType === 'reject' && !adminResponse.trim()} style={{
            padding: '10px 20px',
            background: actionType === 'approve' ? '#38a169' : '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: actionType === 'reject' && !adminResponse.trim() ? 'not-allowed' : 'pointer'
          }}>
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export default ManageRequest;
