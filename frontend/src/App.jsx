import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import DashboardShell from './components/DashboardShell';
import StatsCards from './components/StatsCards';
import BedGrid from './components/BedGrid';
import PatientSidebar from './components/PatientSidebar';
import WardManagement from './components/WardManagement';
import PatientDirectory from './components/PatientDirectory';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

function App() {
  const [beds, setBeds] = useState([]);
  const [queue, setQueue] = useState([]);
  const [socket, setSocket] = useState(null);

  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'ward'

  // Initial Fetch
  useEffect(() => {
    // Connect Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Fetch Data
    fetch(`${API_URL}/beds`)
      .then(res => res.json())
      .then(data => setBeds(data))
      .catch(err => console.error("Failed to fetch beds", err));

    fetch(`${API_URL}/queue`)
      .then(res => res.json())
      .then(data => setQueue(data))
      .catch(err => console.error("Failed to fetch queue", err));

    return () => newSocket.close();
  }, []);

  // Real-time Updates
  useEffect(() => {
    if (!socket) return;

    socket.on('bedUpdate', (updatedBed) => {
      setBeds(prevBeds => {
        const index = prevBeds.findIndex(b => b.id === updatedBed.id);
        if (index !== -1) {
          // Update existing
          return prevBeds.map(b => b.id === updatedBed.id ? updatedBed : b);
        } else {
          // Add new
          return [...prevBeds, updatedBed];
        }
      });
    });

    socket.on('bedRemoved', (bedId) => {
      setBeds(prevBeds => prevBeds.filter(b => b.id !== bedId));
    });

    socket.on('queueUpdate', (newQueue) => {
      setQueue(newQueue);
    });

    return () => {
      socket.off('bedUpdate');
      socket.off('bedRemoved');
    };
  }, [socket]);

  // Smart Assign Handler
  const handleSmartAssign = async (patient) => {
    console.log('handleSmartAssign called with patient:', patient);
    try {
      // Mocking "Needs" based on triage/random for demo
      const needs = patient.triageLevel === 1 ? 'ICU' : 'General';

      const payload = {
        needs: needs,
        urgency: patient.triageLevel <= 2,
        patientId: patient.id
      };
      console.log('Sending assignment request:', payload);

      const res = await fetch(`${API_URL}/beds/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (data.success) {
        // Optimistically remove from queue (or re-fetch queue)
        setQueue(prev => prev.filter(p => p.id !== patient.id));
        alert(`Assigned ${patient.name} to ${data.bed.id} (${data.bed.ward})`);
      } else {
        console.error('Assignment failed:', data.error);
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Assignment failed with exception:", err);
      alert("Error assigning bed: " + err.message);
    }
  };

  // Manual Assign Handler
  const handleManualAssign = async (patient, bedId) => {
    console.log('handleManualAssign called with patient:', patient, 'bedId:', bedId);
    try {
      const payload = {
        needs: 'Manual',
        urgency: false,
        bedId: bedId,
        patientId: patient.id
      };
      console.log('Sending manual assignment request:', payload);

      const res = await fetch(`${API_URL}/beds/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Manual assign response status:', res.status);
      const data = await res.json();
      console.log('Manual assign response data:', data);

      if (data.success) {
        setQueue(prev => prev.filter(p => p.id !== patient.id));
        alert(`Manually Assigned ${patient.name} to ${data.bed.id}`);
      } else {
        console.error('Manual assignment failed:', data.error);
        alert(data.error || 'Assignment Failed');
      }
    } catch (err) {
      console.error('Manual assignment exception:', err);
      alert('Assignment Error: ' + err.message);
    }
  };

  const handleAddPatient = async (patientData) => {
    try {
      const res = await fetch(`${API_URL}/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
    } catch (err) {
      console.error(err);
      alert("Error adding patient");
    }
  };

  const handleRemovePatient = async (id) => {
    if (!confirm("Remove patient from queue?")) return;
    try {
      const res = await fetch(`${API_URL}/queue/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
    } catch (err) {
      console.error(err);
      alert("Error removing patient");
    }
  };

  return (
    <div className="flex bg-medical-50 h-screen overflow-hidden font-sans">
      <DashboardShell currentView={currentView} onViewChange={setCurrentView}>
        {currentView === 'dashboard' ? (
          <>
            <StatsCards beds={beds} queue={queue} />
            <div className="flex gap-6 relative">
              <BedGrid
                beds={beds}
                queue={queue}
                onAssign={handleManualAssign}
              />
            </div>
          </>
        ) : currentView === 'ward' ? (
          <WardManagement beds={beds} />
        ) : (
          <PatientDirectory />
        )}
      </DashboardShell>

      {/* Only show Patient Queue Sidebar on Dashboard View */}
      {currentView === 'dashboard' && (
        <PatientSidebar
          queue={queue}
          beds={beds}
          onAssign={handleSmartAssign}
          onManualAssign={handleManualAssign}
          onAddPatient={handleAddPatient}
          onRemovePatient={handleRemovePatient}
        />
      )}
    </div>
  );
}

export default App;
