import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle, Car } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

export default function BookSlot() {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadCenters();
  }, []);

  useEffect(() => {
    if (selectedCenter && selectedDate) {
      loadSlots();
    }
  }, [selectedCenter, selectedDate]);

  const loadCenters = async () => {
    const res = await api.get('/booking/centers');
    setCenters(res.data.centers);
  };

  const loadSlots = async () => {
    const res = await api.get(`/booking/slots?centerId=${selectedCenter}&date=${selectedDate}`);
    setSlots(res.data.slots);
  };

  const getDateOptions = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      const res = await api.post('/booking/book', { slotId: selectedSlot });
      setBooking(res.data.booking);
      setStep(3);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3 && booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-6">Your driving test has been scheduled.</p>

          <div className="bg-slate-50 rounded-lg p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Booking ID</span>
              <span className="text-sm font-semibold text-primary-900">{booking.booking_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Candidate ID</span>
              <span className="text-sm font-semibold text-primary-900">{booking.candidate_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Test Center</span>
              <span className="text-sm font-semibold text-primary-900">{booking.center_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Date</span>
              <span className="text-sm font-semibold text-primary-900">{formatDate(booking.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Time</span>
              <span className="text-sm font-semibold text-primary-900">{booking.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <span className="badge-success">Confirmed</span>
            </div>
          </div>

          {/* QR-style visual */}
          <div className="w-32 h-32 mx-auto mb-4 bg-primary-900 rounded-xl p-3 grid grid-cols-5 grid-rows-5 gap-0.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-white' : 'bg-primary-700'}`}></div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-6">Show this QR code at the test center (Visual Prototype)</p>

          <button onClick={() => navigate('/applicant')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/applicant')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-primary-900 text-sm">Book Driving Test</span>
          </div>
          <div></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-6">Book Your Driving Test Slot</h1>

        {/* Step 1: Select Center */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" /> Select RTO Test Center
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {centers.map((center) => (
              <button key={center.id} onClick={() => { setSelectedCenter(center.id); setStep(Math.max(step, 1)); }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCenter === center.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <p className="text-sm font-semibold text-primary-900">{center.name}</p>
                <p className="text-xs text-slate-400 mt-1">{center.address}</p>
                <p className="text-xs text-slate-400">Capacity: {center.capacity}/day</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Date & Slot */}
        {selectedCenter && (
          <div className="card p-6 mb-6 animate-fade-in">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" /> Select Date
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {getDateOptions().map((date) => (
                <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedDate === date ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}>
                  {formatDate(date)}
                </button>
              ))}
            </div>

            {selectedDate && slots.length > 0 && (
              <>
                <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" /> Select Time Slot
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <button key={slot.id} onClick={() => { if (slot.status !== 'full') setSelectedSlot(slot.id); }}
                      disabled={slot.status === 'full'}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSlot === slot.id ? 'border-primary-500 bg-primary-50' :
                        slot.status === 'full' ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' :
                        'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-primary-900">{slot.time}</p>
                        <span className={getStatusColor(slot.status)}>{getStatusLabel(slot.status)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {slot.booked_count}/{slot.max_candidates} booked
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedDate && slots.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No slots available for this date.</p>
            )}
          </div>
        )}

        {/* Confirm */}
        {selectedSlot && (
          <div className="animate-fade-in">
            <button onClick={handleBook} disabled={loading} className="btn-primary w-full text-lg py-3">
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
