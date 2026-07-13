"use client";

import { Page, PageHeader, Reveal } from "@/app/dashboard/_Components/ui";
import { CarIcon } from "@/app/dashboard/_Components/Icons";

export default function RequestCharterPage() {
  return (
    <Page>
      <PageHeader 
        title="Charter Service" 
        description="Request a charter service for cars, vans, minibuses, buses, ferries, and trains."
        icon={<CarIcon className="w-5 h-5 text-emerald-500" />} 
      />

      <Reveal className="w-full">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-10 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need a Charter?</h2>
          
          <p className="text-[15px] text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Please send us an E-Mail to <a href="mailto:charter@smatway.com" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">charter@smatway.com</a> indicating the type of charter you need (e.g., Vehicle Type, Location, Date & Time).
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-xl mx-auto text-left">
             <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-4">What happens next?</h3>
             <ul className="text-[13px] text-slate-600 space-y-3">
               <li className="flex items-start gap-3">
                 <span className="text-emerald-500 mt-0.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                 </span>
                 We will send your message to all registered charter providers.
               </li>
               <li className="flex items-start gap-3">
                 <span className="text-emerald-500 mt-0.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                 </span>
                 The operators will review your request and make a quote.
               </li>
               <li className="flex items-start gap-3">
                 <span className="text-emerald-500 mt-0.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                 </span>
                 Everything is handled manually by Smatway Admins to ensure security and quality.
               </li>
             </ul>
          </div>
          
          <p className="text-[12px] text-slate-400 italic mt-8">
            *Important: Traveller and Charter Operator must not communicate directly.
          </p>
        </div>
      </Reveal>
    </Page>
  );
}
