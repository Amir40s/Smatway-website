"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { searchTransports, createBooking, getTransporterProfile } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/currencies";
import { countryName } from "@/lib/countries";
import { formatTransportType } from "@/lib/utils";
import {
  SearchIcon, CarIcon, MapPinIcon, CalendarIcon, ChevronDownIcon,
  UsersIcon, ArrowRightIcon, XIcon, StarIcon, SparklesIcon,
  CheckCircleIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  PrimaryButton, SurfaceCard, spring, RouteTimeline,
} from "@/app/dashboard/_Components/ui";

const transportTypes = [
  { label: "All types", value: "All" },
  { label: "Car", value: "CAR" },
  { label: "Van", value: "VAN" },
  { label: "Minibus", value: "MINIBUS" },
  { label: "Bus", value: "BUS" },
  { label: "Ferry", value: "FERRY" },
  { label: "Train", value: "TRAIN" },
] as const;

export default function SearchRidesPage() {
  const [depCountry, setDepCountry] = useState("");
  const [depCity, setDepCity] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destCity, setDestCity] = useState("");
  const [transportType, setTransportType] = useState<(typeof transportTypes)[number]["value"]>("All");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = date ? new Date(`${date}T00:00:00`) : null;
  const isPastDate = !!selectedDate && selectedDate < today;

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user?.country) {
          const full = countryName(user.country);
          setDepCountry(full);
          setDestCountry(full);
        }
        setDate(new Date().toISOString().split("T")[0]);
      } catch {}
    })();
  }, []);

  async function handleSearch() {
    if (isPastDate) {
      setError("Past dates are unavailable. Pick today or a future date.");
      setResults(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await searchTransports({
        departureCountry: depCountry?.trim() || undefined,
        departureCity: depCity?.trim() || undefined,
        destinationCountry: destCountry?.trim() || undefined,
        destinationCity: destCity?.trim() || undefined,
        transportType: transportType !== "All" ? transportType : undefined,
        date: date || undefined,
      });
      setResults(data);
    } catch {
      setError("Failed to search routes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      {/* Hero search */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 text-white p-6 md:p-10 mb-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-400/20 rounded-full px-2.5 py-1 mb-5">
              <SparklesIcon className="w-3 h-3" />
              Trusted transporters
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 max-w-2xl">
              Where are you headed?
            </h1>
            <p className="text-sm md:text-[15px] text-slate-300 max-w-md mb-8">
              Search verified routes across cities and book a seat in seconds.
            </p>

            {/* Search grid */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <Field label="From Country" icon={<MapPinIcon className="w-4 h-4" />}>
                  <input
                    type="text"
                    placeholder="e.g. Nigeria"
                    value={depCountry}
                    onChange={(e) => setDepCountry(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none font-medium mt-1"
                  />
                </Field>

                <Field label="From City" icon={<MapPinIcon className="w-4 h-4" />}>
                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={depCity}
                    onChange={(e) => setDepCity(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none font-medium mt-1"
                  />
                </Field>

                <Field label="To Country" icon={<MapPinIcon className="w-4 h-4" />}>
                  <input
                    type="text"
                    placeholder="e.g. Ghana"
                    value={destCountry}
                    onChange={(e) => setDestCountry(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none font-medium mt-1"
                  />
                </Field>

                <Field label="To City" icon={<MapPinIcon className="w-4 h-4" />}>
                  <input
                    type="text"
                    placeholder="e.g. Accra"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none font-medium mt-1"
                  />
                </Field>

                <Field label="Departure" icon={<CalendarIcon className="w-4 h-4" />} error={isPastDate}>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full bg-transparent text-sm focus:outline-none font-medium mt-1 ${isPastDate ? "text-rose-600" : "text-zinc-900"}`}
                  />
                </Field>

                <Field label="Type" icon={<CarIcon className="w-4 h-4" />}>
                  <div className="relative mt-1">
                    <select
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value as any)}
                      className="w-full bg-transparent text-sm text-zinc-900 focus:outline-none font-medium appearance-none cursor-pointer pr-6"
                    >
                      {transportTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </Field>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                {error && <p className="text-[12px] text-red-600 flex-1">{error}</p>}
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="ml-auto inline-flex items-center gap-2 bg-zinc-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                      />
                      Searching
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-4 h-4" />
                      Find rides
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Results */}
      {loading ? (
        <SkeletonList count={3} />
      ) : results === null ? (
        <Reveal>
          <EmptyState
            title="Start your search"
            description="Enter your departure and destination above to find available routes from verified transporters."
            icon={<SearchIcon className="w-6 h-6" />}
          />
        </Reveal>
      ) : results.length === 0 ? (
        <Reveal>
          <EmptyState
            title="No routes found"
            description="Try widening your search, switching dates, or picking a different transport type."
            icon={<MapPinIcon className="w-6 h-6" />}
          />
        </Reveal>
      ) : (
        <>
          <Reveal className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-zinc-950">
              {results.length} {results.length === 1 ? "route" : "routes"} found
            </p>
            <p className="text-[11px] text-slate-500">Sorted by earliest departure</p>
          </Reveal>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 gap-3"
          >
            {results.map((transport) => (
              <TransportCard key={transport.id} transport={transport} />
            ))}
          </motion.div>
        </>
      )}
    </Page>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, icon, children, error = false }: { label: string; icon?: React.ReactNode; children: React.ReactNode; error?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white px-3 py-2.5 transition-colors hover:border-slate-300 ${error ? "border-rose-300 bg-rose-50/40" : "border-slate-200"}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Transport card ───────────────────────────────────────────────────────────
function TransportCard({ transport }: { transport: any }) {
  const [booking, setBooking] = useState(false);
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState<any>(null);
  const [error, setError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  async function handleBook() {
    setBooking(true);
    setError("");
    try {
      const result = await createBooking({ transportId: transport.id, seatsBooked: seats });
      setBooked(result);
    } catch (e: any) {
      setError(e?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  async function openTransporterProfile() {
    setLoadingProfile(true);
    try {
      const data = await getTransporterProfile(transport.transporter.id);
      setProfile(data);
      setShowProfile(true);
    } finally {
      setLoadingProfile(false);
    }
  }

  const dep = new Date(transport.departureDateTime);
  const maxReach = new Date(transport.maxReachDateTime);
  const vehicle = transport.vehicle;
  const rating = Number(transport.transporter?.averageRating || 0);
  const rides = transport.transporter?.totalCompletedRides || 0;

  return (
    <SurfaceCard>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Vehicle image */}
          <div className="sm:w-28 h-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
            {vehicle?.imageUrl ? (
              <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <CarIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Route & transporter */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusPill tone="emerald">{formatTransportType(vehicle?.transportType || "ROUTE")}</StatusPill>
              <span className="text-[11px] text-slate-400">
                {vehicle?.model || "—"} · {vehicle?.plateNumber || "N/A"}
              </span>
            </div>
            <div className="mt-3 mb-4">
              <RouteTimeline
                departureCity={`${transport.departureCity}, ${countryName(transport.departureCountry)}`}
                departureAddress={transport.departureAddress}
                destinationCity={`${transport.destinationCity}, ${countryName(transport.destinationCountry)}`}
                destinationAddress={transport.destinationAddress}
                stops={transport.stops}
              />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {dep.toLocaleDateString()} · {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                {transport.availableSeats} seats left
              </span>
              <span className="text-slate-400">
                Arrives by {maxReach.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Transporter mini */}
            <button
              onClick={openTransporterProfile}
              className="inline-flex items-center gap-2 mt-3 rounded-full bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 transition-colors"
            >
              <Avatar className="h-5 w-5 rounded-full">
                {transport.transporter?.profileImageUrl && (
                  <AvatarImage src={transport.transporter.profileImageUrl} alt={transport.transporter.name} />
                )}
                <AvatarFallback className="text-[9px] bg-zinc-950 text-white">
                  {transport.transporter?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-semibold text-zinc-950">
                {transport.transporter?.name || "Unknown"}
              </span>
              <span className="text-[10px] text-slate-400">· {rides} rides</span>
            </button>
          </div>

          {/* Book */}
          <div className="flex flex-row sm:flex-col items-end sm:items-end justify-between gap-3 sm:min-w-[160px] sm:border-l sm:border-slate-100 sm:pl-5">
            <div className="text-right">
              <p className="text-xl font-semibold text-zinc-950 tabular-nums leading-tight">
                {formatPrice(transport.price, transport.currency)}
              </p>
              <p className="text-[10px] text-slate-400">per seat</p>
            </div>
            {booked ? (
              <Link
                href={`/dashboard/traveler/booking/${booked.id}`}
                className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 hover:text-emerald-800"
              >
                <CheckCircleIcon className="w-3.5 h-3.5" />
                View booking
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={transport.availableSeats}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-12 text-center rounded-lg border border-slate-200 px-1 py-1.5 text-sm font-semibold tabular-nums"
                />
                <button
                  onClick={handleBook}
                  disabled={booking || transport.availableSeats === 0}
                  className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-[0.98]"
                >
                  {booking ? "..." : "Book"}
                </button>
              </div>
            )}
            {error && <p className="text-[10px] text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      {/* Transporter profile modal */}
      <AnimatePresence>
        {showProfile && (
          <TransporterProfileModal
            loading={loadingProfile}
            profile={profile}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </SurfaceCard>
  );
}

// ─── Transporter profile modal ────────────────────────────────────────────────
function TransporterProfileModal(props: { loading: boolean; profile: any; onClose: () => void }) {
  // Render via a portal on document.body so ancestor `transform`/`filter`/`will-change`
  // containing blocks (e.g. the parent SurfaceCard uses motion transforms) don't trap
  // our `position: fixed` overlay inside the route row — which was making it render as
  // an inline box over one card instead of a full-viewport modal.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<TransporterProfileModalInner {...props} />, document.body);
}

function TransporterProfileModalInner({ loading, profile, onClose }: { loading: boolean; profile: any; onClose: () => void }) {
  // Lock body scroll while the modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-zinc-950">Transporter profile</p>
          <button onClick={onClose} className="text-slate-400 hover:text-zinc-900 p-1 -m-1">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading profile...</div>
        ) : profile ? (
          <>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-white shadow-sm">
                  {profile.profileImageUrl && <AvatarImage src={profile.profileImageUrl} alt={profile.name} />}
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-lg font-semibold">
                    {profile.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-[16px] font-semibold text-zinc-950">{profile.name}</h2>
                  <p className="text-[11px] text-slate-500">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-100 border-y border-slate-100">
              <ProfileStat label="Completed" value={profile.totalCompletedRides || 0} />
              <ProfileStat label="Vehicles" value={profile.vehicleCount || 0} />
            </div>

          </>
        ) : (
          <div className="p-10 text-center text-sm text-red-600">Failed to load profile</div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ProfileStat({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="p-5 text-center">
      <div className="flex items-center justify-center gap-1">
        {accent && <StarIcon className="w-4 h-4 text-amber-500 fill-current" />}
        <p className={`text-xl font-semibold tabular-nums ${accent ? "text-amber-600" : "text-zinc-950"}`}>
          {value}
        </p>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">{label}</p>
    </div>
  );
}
