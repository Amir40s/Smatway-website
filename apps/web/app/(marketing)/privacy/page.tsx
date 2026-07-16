import React from "react";
import { Trans } from "@/components/Trans";

export const metadata = {
  title: "Privacy Policy - SmatWay",
  description: "Privacy Policy for the SmatWay Platform.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
        <Trans tKey="legal.privacy.policy" />
      </h1>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.1.introduction" /></h2>
          <p className="mb-4">Welcome to SmatWay Booking Platform, "we".</p>
          <p className="mb-4">
            Smatwayt Booking is an online transportation booking marketplace that enables users to search, compare, and book transportation services, including cars, taxis, buses, ferries, trains, and other transport services offered by independent transportation providers.
          </p>
          <p className="mb-4">
            We are committed to protecting your personal data and processing it transparently and securely in accordance with the General Data Protection Regulation laws.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our website, mobile applications, and related services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.2.data.controller" /></h2>
          <p className="mb-2">The controller responsible for processing your personal data is:</p>
          <address className="not-italic">
            <strong>SmatWay Booking Ltd</strong><br/>
            Registered Address: Plot 8, Providence Street, Lekki Phase 1, Lagos State, Nigeria<br/>
            Email: info@smatway.com<br/>
            Phone: +2349137507161<br/>
            Company Registration Number: 9579402<br/>
            VAT Number: [VAT Number]
          </address>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.3.personal.data.we.collect" /></h2>
          
          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.1.account.information" /></h3>
          <p className="mb-2">When you register an account, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Full name</li>
            <li>E-Mail address</li>
            <li>Phone number</li>
            <li>Password (stored in encrypted form)</li>
            <li>Date of birth (where required)</li>
            <li>Country of residence</li>
            <li>Preferred language</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.2.booking.information" /></h3>
          <p className="mb-2">When making a reservation, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Departure and destination locations</li>
            <li>Travel dates and times</li>
            <li>Passenger names</li>
            <li>Passenger contact information</li>
            <li>Passenger nationality (where legally required)</li>
            <li>Number of passengers</li>
            <li>Booking reference numbers</li>
            <li>Special assistance requirements</li>
            <li>Luggage information</li>
            <li>Seat preferences</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.3.payment.information" /></h3>
          <p className="mb-2">For booking payments, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Billing address</li>
            <li>Payment method details</li>
            <li>Transaction records</li>
            <li>Refund information</li>
          </ul>
          <p className="mb-4 text-sm text-slate-500">Payment card details are generally processed directly by certified payment service providers and are not stored on our servers.</p>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.4.transport.provider.information" /></h3>
          <p className="mb-2">For transport operators and partners, we may collect:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Company information</li>
            <li>Business registration details</li>
            <li>Tax information</li>
            <li>Contact information</li>
            <li>Licensing and regulatory documentation</li>
            <li>Bank account information for payouts</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.5.communications" /></h3>
          <p className="mb-2">We may collect information contained in:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Customer support requests</li>
            <li>E-Mail correspondence</li>
            <li>Chat messages</li>
            <li>Reviews and ratings</li>
            <li>Feedback submissions</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.6.technical.information" /></h3>
          <p className="mb-2">We automatically collect:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>IP address</li>
            <li>Device identifiers</li>
            <li>Browser type</li>
            <li>Operating system</li>
            <li>Access logs</li>
            <li>Usage analytics</li>
            <li>Cookies and similar technologies</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.3.7.location.information" /></h3>
          <p className="mb-2">Where enabled by users, we may collect location information to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Display nearby transportation options</li>
            <li>Improve booking accuracy</li>
            <li>Facilitate travel services</li>
            <li>Prevent fraud and misuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.4.purposes.of.processing" /></h2>
          <p className="mb-2">We process personal data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage user accounts</li>
            <li>Process and manage bookings</li>
            <li>Provide transportation reservation services</li>
            <li>Confirm bookings and issue tickets</li>
            <li>Facilitate communication between travelers and transport providers</li>
            <li>Process payments, refunds, and payouts</li>
            <li>Verify identities when required</li>
            <li>Provide customer support</li>
            <li>Detect fraud and unauthorized activity</li>
            <li>Improve platform functionality</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
            <li>Send service-related notifications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.5.legal.basis.for.processing" /></h2>
          <p className="mb-4">We process personal data under the following legal bases:</p>
          
          <h3 className="font-semibold text-zinc-900 mb-1"><Trans tKey="legal.performance.of.a.contract" /></h3>
          <p className="mb-4">To provide booking and reservation services requested by users.</p>
          
          <h3 className="font-semibold text-zinc-900 mb-1"><Trans tKey="legal.legal.obligations" /></h3>
          <p className="mb-4">To comply with transportation, accounting, tax, consumer protection, and regulatory requirements.</p>

          <h3 className="font-semibold text-zinc-900 mb-1"><Trans tKey="legal.legitimate.interests" /></h3>
          <p className="mb-4">For fraud prevention, platform security, service improvement, analytics, and business operations.</p>

          <h3 className="font-semibold text-zinc-900 mb-1"><Trans tKey="legal.consent" /></h3>
          <p>For marketing communications, optional location tracking, and non-essential cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.6.sharing.personal.data" /></h2>
          <p className="mb-4">We may share personal data with:</p>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.transport.providers" /></h3>
          <p className="mb-2">To fulfill bookings, we may share necessary passenger information with Car and taxi operators, Bus companies, Ferry operators, Railway operators, and Other transportation partners.</p>
          <p className="mb-2">Shared information may include:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Passenger names</li>
            <li>Contact information</li>
            <li>Booking details</li>
            <li>Travel itinerary information</li>
          </ul>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.payment.providers" /></h3>
          <p className="mb-4">We share payment-related information with payment processors and financial institutions for secure transaction processing.</p>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.technology.providers" /></h3>
          <p className="mb-2">We may share information with trusted service providers that assist with Cloud hosting, Customer support, Analytics, Communication services, and Security monitoring.</p>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.government.and.regulatory.authorities" /></h3>
          <p className="mb-2">Where legally required, we may disclose personal data to Courts, Law enforcement agencies, Transportation authorities, Tax authorities, and Regulatory bodies.</p>

          <h3 className="font-semibold text-zinc-900 mb-2"><Trans tKey="legal.business.transfers" /></h3>
          <p className="mb-2">Personal data may be transferred in connection with a merger, acquisition, restructuring, or sale of business assets.</p>
          <p className="font-semibold">We do not sell personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.7.international.transfers" /></h2>
          <p className="mb-2">Transportation bookings may involve operators located in different countries. Where personal data is transferred, we implement appropriate safeguards, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Standard Contractual Clauses</li>
            <li>Adequacy decisions</li>
            <li>Other lawful transfer mechanisms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.8.data.retention" /></h2>
          <p className="mb-2">We retain personal data only for as long as necessary to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Fulfill bookings</li>
            <li>Provide customer support</li>
            <li>Meet legal obligations</li>
            <li>Resolve disputes</li>
            <li>Prevent fraud</li>
          </ul>
          <p>Financial and transaction records may be retained for periods required under Nigerian tax and accounting laws.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.9.user.rights" /></h2>
          <p className="mb-2">Under GDPR, users have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Access personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion</li>
            <li>Restrict processing</li>
            <li>Object to processing</li>
            <li>Receive data in portable format</li>
            <li>Withdraw consent</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p>Requests may be submitted to: <strong>info@smatway.com</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.10.security" /></h2>
          <p className="mb-2">We implement appropriate technical and organizational measures, including:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Encryption of sensitive data</li>
            <li>Secure transmission protocols (SSL/TLS)</li>
            <li>Access controls</li>
            <li>Monitoring and logging</li>
            <li>Vulnerability management</li>
            <li>Secure payment integrations</li>
          </ul>
          <p>While we strive to protect personal data, no system can guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.11.cookies" /></h2>
          <p className="mb-2">We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Maintain user sessions</li>
            <li>Remember preferences</li>
            <li>Improve website performance</li>
            <li>Analyze traffic</li>
            <li>Deliver relevant content</li>
          </ul>
          <p>Users may manage cookie preferences through browser settings and our cookie consent platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.12.marketing.communications" /></h2>
          <p className="mb-2">Users may receive service-related communications necessary for booking management. Marketing communications will only be sent where legally permitted or with user consent.</p>
          <p>Users may unsubscribe at any time through account settings or E-Mail links.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.13.reviews.and.ratings" /></h2>
          <p className="mb-2">Users may submit reviews and ratings regarding transportation services. Submitted reviews may be publicly displayed on the Platform.</p>
          <p>Users should avoid including sensitive personal information in publicly visible reviews.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.14.children.s.privacy" /></h2>
          <p className="mb-2">Our services are intended for persons aged 18 years or older unless local laws permit otherwise.</p>
          <p>We do not knowingly collect personal data from children without appropriate legal basis.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.15.changes.to.this.privacy.policy" /></h2>
          <p className="mb-2">We may update this Privacy Policy periodically. Updated versions will be published on the Platform with a revised effective date.</p>
          <p>Material changes may be communicated through E-Mail or platform notifications.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3"><Trans tKey="legal.16.contact.us" /></h2>
          <p className="mb-2">For privacy-related inquiries, requests, or complaints, please contact:</p>
          <address className="not-italic">
            <strong>Smatway Booking Ltd</strong><br/>
            info@smatway.com
          </address>
        </section>
      </div>
    </main>
  );
}
