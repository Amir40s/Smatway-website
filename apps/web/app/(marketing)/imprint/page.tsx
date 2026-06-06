import React from "react";

export const metadata = {
  title: "Imprint - SmatWay",
  description: "Imprint and Company Information for SmatWay.",
};

export default function ImprintPage() {
  return (
    <main className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
        Imprint
      </h1>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <p className="mb-6">Information pursuant to applicable e-commerce and media laws.</p>
          
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Company Information</h2>
          <address className="not-italic space-y-2 mb-6">
            <p><strong>Company Name:</strong> Smatway Booking Ltd</p>
            <p><strong>Legal Form:</strong> Limited</p>
            <p><strong>Registered Address:</strong> Plot 8, Providence Street, Lekki Phase 1, Lagos State, Nigeria</p>
          </address>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Contact</h2>
          <address className="not-italic space-y-2 mb-6">
            <p><strong>Smatway Booking Ltd</strong></p>
            <p>Registered Address: Plot 8, Providence Street, Lekki Phase 1, Lagos State, Nigeria</p>
            <p><strong>Email:</strong> <a href="mailto:info@smatway.com" className="text-emerald-600 hover:underline">info@smatway.com</a></p>
            <p><strong>Website:</strong> <a href="https://www.smatway.com" className="text-emerald-600 hover:underline">www.smatway.com</a></p>
            <p><strong>Phone:</strong> +2349137507161</p>
          </address>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Company Registration</h2>
          <div className="space-y-2 mb-6">
            <p><strong>Registered with:</strong> Corporate Affair Commission of Nigeria</p>
            <p><strong>Registration Number:</strong> 9579402</p>
            <p><strong>VAT Identification Number:</strong> [VAT Number]</p>
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Authorized Representative</h2>
          <div className="space-y-2 mb-6">
            <p>Benjamin Enwegbara</p>
            <p><a href="mailto:info@smatway.com" className="text-emerald-600 hover:underline">info@smatway.com</a></p>
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Regulatory Information</h2>
          <p className="mb-4">
            Where transportation services are provided by independent transport operators, the Platform acts as a booking and marketplace service connecting travellers with transport providers.
          </p>
          <p className="mb-6">
            Transport services are provided by the respective transport operators, who remain solely responsible for the operation of transportation services, compliance with applicable transportation laws, licensing requirements, insurance obligations, and passenger safety.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Liability for Content</h2>
          <p className="mb-6">
            The information provided on this Platform is created with reasonable care. However, we do not guarantee the accuracy, completeness, or timeliness of the information presented.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Liability for External Links</h2>
          <p className="mb-6">
            Our Platform may contain links to third-party websites. We have no control over the content of such websites and assume no responsibility for their content. Responsibility for linked websites lies solely with their respective operators.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Online Dispute Resolution</h2>
          <p className="mb-6">
            If required by applicable law, consumers may have access to online dispute resolution mechanisms or alternative dispute resolution bodies. Information regarding such procedures may be obtained from the relevant consumer protection authorities.
          </p>

          <h2 className="text-xl font-semibold text-zinc-900 mb-3">Contact for Legal Inquiries</h2>
          <div className="space-y-2 mb-8">
            <p>For legal notices, complaints, or regulatory inquiries, please contact:</p>
            <p><strong>Smatway Booking Ltd</strong></p>
            <p><a href="mailto:info@smatway.com" className="text-emerald-600 hover:underline">info@smatway.com</a></p>
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Management Team</h2>
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-zinc-900">Catherine Smith (Strategy & Planning)</p>
              <p className="text-slate-600">Business Strategy, Market Analysis, Product Roadmap, Long-Term Growth Planning</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Johannes Becker (Technical, IT Integration)</p>
              <p className="text-slate-600">Platform Development, IT Infrastructure, Integrations, Cybersecurity, Mobile Apps</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Lola Adeyemi (Human Resources & Administration)</p>
              <p className="text-slate-600">Recruitment, Staff Welfare, Policies, Training, Office Administration</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Aisha Abubakar (Finance & Controlling)</p>
              <p className="text-slate-600">Financial Planning, Budgeting, Reporting, Investor Relations, Controls</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Obinna Chidebelu (Legal & Compliance)</p>
              <p className="text-slate-600">Licensing, Risk Management, Compliance</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Laura Giovanni (Business Development & Expansion)</p>
              <p className="text-slate-600">New Markets, Partnerships, Regional Expansion, Fleet Provider Acquisition</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Benjamin Enwegbara (Corporate Governance & Negotiations)</p>
              <p className="text-slate-600">Governance Frameworks, Leadership, Board Coordination, Internal and External Audit, Ethics, Stakeholder Management</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
