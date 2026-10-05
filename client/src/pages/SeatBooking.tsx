import React, { useState, useEffect } from 'react';
import {
  Armchair,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Monitor,
  VolumeX,
  Sparkles,
  Calendar,
  AlertCircle,
  X,
  Trash2,
  RefreshCw,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SeatZone, Seat, UserSeatBooking } from '../types';

export const SeatBooking: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<SeatZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ZONE-A');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [myBookings, setMyBookings] = useState<UserSeatBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time Slot Selection state
  const [selectedSlotDuration, setSelectedSlotDuration] = useState<number>(2); // hours
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');

  const TIME_SLOTS = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  const fetchSeatsAndBookings = async () => {
    try {
      setLoading(true);
      const [seatsRes, myRes] = await Promise.allSettled([
        api.get('/bookings/seats'),
        user ? api.get('/bookings/my') : Promise.resolve({ data: { bookings: [] } }),
      ]);

      if (seatsRes.status === 'fulfilled' && seatsRes.value.data.success) {
        setZones(seatsRes.value.data.zones || []);
      }

      if (myRes.status === 'fulfilled' && myRes.value.data?.bookings) {
        setMyBookings(myRes.value.data.bookings || []);
      }
    } catch (err: any) {
      console.error('Fetch seats error:', err);
      setErrorMessage('Could not load real-time seat status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatsAndBookings();
  }, [user]);

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleSeatClick = (seat: Seat) => {
    if (seat.isOccupied) return;
    setSelectedSeat(seat);
    setErrorMessage(null);
    setBookingSuccessMsg(null);
  };

  const handleConfirmReservation = async () => {
    if (!selectedSeat) return;
    if (!user) {
      setErrorMessage('Please log in with your student or faculty credentials to reserve a study seat.');
      return;
    }

    try {
      setBookingLoading(true);
      setErrorMessage(null);

      const today = new Date();
      const [hours, mins] = selectedStartTime.split(':').map(Number);
      const startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, mins);
      const endDateTime = new Date(startDateTime.getTime() + selectedSlotDuration * 3600 * 1000);

      const res = await api.post('/bookings/seats', {
        seatCode: selectedSeat.seatCode,
        roomType: activeZone.roomType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (res.data.success) {
        setBookingSuccessMsg(`Seat ${selectedSeat.seatCode} reserved for ${selectedSlotDuration} hours!`);
        setSelectedSeat(null);
        await fetchSeatsAndBookings();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to reserve seat. Please try another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      await api.delete(`/bookings/seats/${bookingId}`);
      await fetchSeatsAndBookings();
    } catch (err: any) {
      setErrorMessage('Failed to cancel seat reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  const getZoneIcon = (roomType: string) => {
    switch (roomType) {
      case 'Silent Study':
        return <VolumeX className="w-5 h-5 text-emerald-500" />;
      case 'Group Discussion':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'Digital Lab':
        return <Monitor className="w-5 h-5 text-purple-500" />;
      default:
        return <Armchair className="w-5 h-5 text-brand-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-brand-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase mb-4 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Live Library Floor Plan
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Smart Study Seat & Room Reservation
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Reserve individual silent carrels, collaborative group cubicles, or dual-monitor research workstations with instant confirmation.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {bookingSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold">{bookingSuccessMsg}</p>
          </div>
          <button onClick={() => setBookingSuccessMsg(null)} className="p-1 text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Seat Grid and Booking Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Floor Map & Interactive Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Zone Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {zones.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <button
                  key={zone.id}
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    setSelectedSeat(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {getZoneIcon(zone.roomType)}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        zone.availableSeats > 5
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {zone.availableSeats} Free
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{zone.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{zone.roomType}</p>
                </button>
              );
            })}
          </div>

          {/* Interactive Seat Floor Map */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  {activeZone?.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeZone?.description}
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600" />
                  <span className="text-slate-600 dark:text-slate-400">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600" />
                  <span className="text-slate-600 dark:text-slate-400">Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-brand-600 border border-brand-700 ring-2 ring-brand-300" />
                  <span className="text-slate-600 dark:text-slate-400">Selected</span>
                </div>
              </div>
            </div>

            {/* Front Desk / Entrance Visual Anchor */}
            <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border border-dashed border-slate-300 dark:border-slate-700">
              🚪 Library Floor Entrance / Quiet Zone
            </div>

            {/* Seat Grid Map */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
                <span className="text-sm">Refreshing floor status...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 py-4">
                {activeZone?.seats.map((seat) => {
                  const isSelected = selectedSeat?.seatCode === seat.seatCode;
                  const isOccupied = seat.isOccupied;

                  return (
                    <button
                      key={seat.seatCode}
                      onClick={() => handleSeatClick(seat)}
                      disabled={isOccupied}
                      title={
                        isOccupied
                          ? `${seat.seatCode} (Occupied by ${seat.bookedBy?.name || 'Student'})`
                          : `${seat.seatCode} (Click to select)`
                      }
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? 'bg-brand-600 border-brand-700 text-white shadow-lg ring-4 ring-brand-500/30 scale-105 z-10'
                          : isOccupied
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-500 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 hover:border-emerald-400 hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <Armchair
                        className={`w-6 h-6 mb-1 ${
                          isSelected
                            ? 'text-white'
                            : isOccupied
                            ? 'text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform'
                        }`}
                      />
                      <span className="text-[11px] font-bold">
                        {seat.seatCode.split('-').pop()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Zone Amenities */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-center mr-2">
                Zone Features:
              </span>
              {activeZone?.features.map((feat, i) => (
                <span
                  key={i}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Reservation Booking Panel & My Bookings */}
        <div className="space-y-6">
          {/* Reservation Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              Reservation Details
            </h3>

            {selectedSeat ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-brand-600 dark:text-brand-400">
                      Selected Seat
                    </span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedSeat.seatCode}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{activeZone.name}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* Start Time Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Start Time
                  </label>
                  <select
                    value={selectedStartTime}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        Today at {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Booking Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 4].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setSelectedSlotDuration(hours)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedSlotDuration === hours
                            ? 'bg-brand-600 border-brand-700 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {hours} {hours === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmReservation}
                  disabled={bookingLoading}
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Reserving Seat...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Seat Booking
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-400 space-y-2">
                <Armchair className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">
                  Click on any available green seat in the floor plan to configure your reservation.
                </p>
              </div>
            )}
          </div>

          {/* User's Active Bookings Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
              <span>My Active Reservations</span>
              <span className="text-xs font-normal text-slate-400">
                {myBookings.filter((b) => b.status === 'ACTIVE').length} active
              </span>
            </h3>

            {myBookings.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                You have no upcoming seat bookings.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {myBookings.map((b) => {
                  const isActive = b.status === 'ACTIVE';
                  const isCancelling = cancellingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {b.seatCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                            {b.roomType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={isCancelling}
                          title="Cancel Reservation"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking;
