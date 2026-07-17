"use client";

import { useEffect, useState } from "react";
import { MegaphoneIcon, InfoCircleIcon, ClockIcon } from "@/app/dashboard/_Components/Icons";
import { Page, Reveal, PageHeader, EmptyState, SurfaceCard, StatusPill, SkeletonList } from "@/app/dashboard/_Components/ui";
import { getTravelerAnnouncements } from "@/lib/api";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getTravelerAnnouncements();
        setAnnouncements(data);
      } catch (err: any) {
        console.error("Failed to load traveler announcements", err);
        setError(t("Unable to retrieve announcements. Please try again later."));
      } finally {
        setIsLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Page>
      <PageHeader
        kicker={t("From your transporters")}
        title={t("Announcements")}
        subtitle={t("Important updates, route alerts, and notices from transporters you've booked with.")}
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <Reveal>
          <div className="flex gap-3 p-4 rounded-2xl bg-red-50/70 ring-1 ring-red-100 mb-6">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <InfoCircleIcon className="w-4 h-4 text-red-700" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-red-900">{t("Failed to load alerts")}</p>
              <p className="text-[12px] text-red-800/80 mt-0.5">{error}</p>
            </div>
          </div>
        </Reveal>
      ) : announcements.length === 0 ? (
        <EmptyState
          title={t("All quiet for now")}
          description={t("When transporters you've booked with post announcements that affect your trips, they'll appear here.")}
          icon={<MegaphoneIcon className="w-6 h-6" />}
        />
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2">
          {announcements.map((ann, index) => (
            <Reveal key={ann.id} delay={index * 0.05} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[35px] md:-left-[43px] top-1.5 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white ring-4 ring-slate-50 border-2 border-emerald-500 text-emerald-600 shadow-sm shrink-0">
                <MegaphoneIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>

              <SurfaceCard className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* Transporter Avatar */}
                    {ann.transporter?.avatarUrl ? (
                      <img
                        src={ann.transporter.avatarUrl}
                        alt={ann.transporter.name || "Transporter"}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm ring-2 ring-slate-100">
                        {getInitials(ann.transporter?.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {ann.transporter?.name || t("Partner Transporter")}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">{t("Broadcasted update")}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ann.transport ? (
                      <StatusPill tone="blue">
                        {t("Route:")} {ann.transport.departureCity} ➔ {ann.transport.destinationCity}
                      </StatusPill>
                    ) : (
                      <StatusPill tone="emerald">
                        {t("All Assigned Routes")}
                      </StatusPill>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-zinc-950 tracking-tight leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{t("Posted on")} {formatDate(ann.createdAt)}</span>
                </div>
              </SurfaceCard>
            </Reveal>
          ))}
        </div>
      )}
    </Page>
  );
}
