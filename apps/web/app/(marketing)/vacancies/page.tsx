"use client";

import React, { useState } from "react";
import { Mail, Briefcase, Truck, ArrowRight } from "lucide-react";
import ApplyModal from "./ApplyModal";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function VacanciesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState("");
  const t = useT();

  const handleApplyClick = (subject: string) => {
    setModalSubject(subject);
    setIsModalOpen(true);
  };

  return (
    <main className="max-w-5xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8 text-slate-800">
      <ApplyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultSubject={modalSubject} 
      />

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
          {t("Looking for Your Next Opportunity?")}
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          {t("Submit your CV today and we'll connect you with employers seeking qualified talent.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* General Vacancies */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Briefcase className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">{t("General Vacancies")}</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {t("Looking for employment? Submit your CV to be considered for current and future opportunities across various roles in our organization and partner network.")}
          </p>
          <button
            onClick={() => handleApplyClick("General Employment Inquiry")}
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
          >
            {t("Submit Your CV")} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>

        {/* Driver Vacancies */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Truck className="w-7 h-7 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">{t("Driver Vacancies")}</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {t("Are you a professional driver looking for your next job? Submit your CV today and we'll connect you with employers seeking qualified drivers.")}
          </p>
          <button
            onClick={() => handleApplyClick("Driver Application")}
            className="inline-flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
          >
            {t("Submit Your CV")} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>

      {/* CTA Sections */}
      <div className="bg-zinc-950 rounded-[2.5rem] p-8 md:p-14 text-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("How Can We Help You?")}</h2>
          <p className="text-slate-400">{t("Choose the option that best describes you.")}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left mb-12">
          {/* Option 1 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-emerald-400">{t("Looking for Employment?")}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("Send us your CV and we'll consider you for current and future opportunities.")}
            </p>
            <button 
              onClick={() => handleApplyClick("General Employment Inquiry")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-emerald-300 transition-colors mt-2 group cursor-pointer"
            >
              {t("Submit Your CV")}
              <ArrowRight className="w-4 h-4 transition-transform rtl:-scale-x-100 group-hover:rtl:-translate-x-1 group-hover:translate-x-1" />
            </button>
          </div>
          
          {/* Option 2 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-emerald-400">{t("Driver Seeking Employment?")}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("Send us your CV and we help connect you with transport companies looking for qualified drivers.")}
            </p>
            <button 
              onClick={() => handleApplyClick("Driver Application")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-emerald-300 transition-colors mt-2 group cursor-pointer"
            >
              {t("Submit Your CV")}
              <ArrowRight className="w-4 h-4 transition-transform rtl:-scale-x-100 group-hover:rtl:-translate-x-1 group-hover:translate-x-1" />
            </button>
          </div>
          
          {/* Option 3 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-emerald-400">{t("Need Drivers?")}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("Transport Company Looking for Drivers? Send us your requirements, and we'll help connect you with suitable driver candidates.")}
            </p>
            <button 
              onClick={() => handleApplyClick("Transport Company Requesting Drivers")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-emerald-300 transition-colors mt-2 group cursor-pointer"
            >
              {t("Email Us Your Requirements")}
              <ArrowRight className="w-4 h-4 transition-transform rtl:-scale-x-100 group-hover:rtl:-translate-x-1 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Mail className="w-5 h-5 text-slate-500" />
          <span className="text-slate-300">{t("Send Email to:")}</span>
          <a href="mailto:carrers@smatway.com" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-lg" dir="ltr">
            carrers@smatway.com
          </a>
        </div>
      </div>
    </main>
  );
}
