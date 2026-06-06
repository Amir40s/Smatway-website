import React from "react";

export const metadata = {
  title: "Terms of Use and Conditions - SmatWay",
  description: "Terms of Use and Conditions for the SmatWay Platform.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
        Terms of Use and Conditions
      </h1>

      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">SmatWay Platform – Terms of Use & Conditions</h2>
          <p className="mb-4">
            Welcome to <strong>SmatWay</strong>, a digital platform that connects registered <strong>Transporters</strong> and
            <strong> Travellers</strong> for transportation services. By accessing or using the SmatWay platform
            ("Platform"), APP and Services you agree to these <strong>Terms of Use & Conditions</strong> ("Terms"). Please read them carefully.
          </p>
          <p>
            These Terms constitute a legally binding agreement between <strong>SmatWay, Transporters,</strong> and <strong>Travellers</strong> regarding the use of the platform, including the website, mobile application, and all related services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Definitions</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>SmatWay</strong> – The company operating the digital transportation marketplace.</li>
            <li><strong>Transporter</strong> – Any registered individual or company offering transportation services through SmatWay.</li>
            <li><strong>Traveller</strong> – Any registered user who books transportation services through SmatWay.</li>
            <li><strong>Journey</strong> – A scheduled trip announced by a Transporter and booked by a Traveller.</li>
            <li><strong>Fare</strong> – The price set by the Transporter and paid by the Traveller via the Platform or App.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Scope of the Platform</h2>
          <p className="mb-4">SmatWay provides a marketplace that enables:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>Transporters to list trips with departure times, destinations, fares, and availability.</li>
            <li>Travellers to search, compare, and book available transportation services.</li>
          </ul>
          <p>
            SmatWay <strong>does not own or operate vehicles</strong>, nor does it employ transporters or drivers. Each Transporter is an independent service provider.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. Eligibility</h2>
          <p className="mb-2">To use the Platform:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users must be old enough to undertake the journey in accordance with local laws of the place of transportation, or be accompanied by a parent or legal guardian.</li>
            <li>Transporters must provide valid licensing, identification, and vehicle documentation relevant to the place or country they operate.</li>
            <li>Travellers must provide accurate identification and payment information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. Payment Terms</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>All bookings must be paid <strong>online through the SmatWay platform.</strong></li>
            <li>Transporters <strong>must not</strong> collect any cash or charge additional fees outside the platform.</li>
            <li>Any extra luggage fees must be paid <strong>online only, to avoid abuse or attacking the driver during the journey.</strong></li>
            <li>The Transporter will be credited with the fare minus agreed commission, <strong>within 48 hours after successful journey as written in the terms and conditions.</strong> Payment may be delayed if there are issues with payment gateways or the transporter's bank.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">5. Transporter Obligation</h2>
          <p className="mb-4 italic">Our motto is: "Live and let live. Let's make the world a better place for all."</p>
          <p className="mb-4">
            All Transporters agree to strictly follow the rules below. Any violation may result in account suspension, financial penalties, or removal from the platform. For proprietors and transport owners, the platform is designed to make your business more efficient. As your business grows, you are expected to treat your drivers and workers fairly and responsibly.
          </p>
          <h3 className="font-semibold text-zinc-900 mb-2">Rules for Transporters:</h3>
          <p className="mb-2">
            a) Drivers and workers must be paid fairly and in accordance with local laws. Underpayment of drivers or workers will not be tolerated.
          </p>
          <p className="mb-2">
            b) Transporters must provide appropriate resting facilities for drivers and workers. After a long-distance journey exceeding six (6) hours, or before the journey, drivers must be provided with a proper place to rest or sleep. Under no circumstances should a driver sleep inside a vehicle for such a journey, unless the vehicle is equipped with bed-like accommodations that allow the driver to lie down and stretch the legs comfortably.
          </p>
          <p className="mb-4">
            c) Drivers must maintain a clean and neat appearance. Drivers must not consume alcohol while driving and must not consume alcohol for at least one (1) hour before the journey.
          </p>
          <p className="mb-6">
            Members of our team may conduct checks periodically and without prior notice to ensure compliance with these rules. These requirements are intended to promote road safety and reduce accidents.
          </p>

          <h3 className="font-semibold text-zinc-900 mb-2 mt-6">5.1 General Conduct</h3>
          <ol className="list-decimal pl-5 space-y-3 mb-6">
            <li>
              <strong>No Cash or Extra Charges</strong><br/>
              Transporters must not collect cash, request additional payments, or modify the fare once a Traveller has booked online.
            </li>
            <li>
              <strong>Punctual Departure</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>Transporters must depart at the scheduled time.</li>
                <li>A maximum delay of <strong>15 minutes</strong> is allowed.</li>
              </ul>
            </li>
            <li>
              <strong>Roadworthiness</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>Vehicles must have a valid and up-to-date <strong>roadworthy certificate according to the local laws they operate</strong></li>
                <li>Vehicles must be kept clean internally and externally.</li>
              </ul>
            </li>
            <li>
              <strong>Vehicle Safety Checks</strong><br/>
              Before every journey, the Transporter must inspect: Lights, Tires, Brakes, Oil, Water levels, and Any other safety-critical components.
            </li>
            <li>
              <strong>Behaviour Toward Travellers</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>No disrespect, arguing, or aggression.</li>
                <li>Drivers must be <strong>properly dressed and clean.</strong></li>
              </ul>
            </li>
          </ol>

          <h3 className="font-semibold text-zinc-900 mb-2">5.2 Breakdown & Emergency Handling</h3>
          <ol className="list-decimal pl-5 space-y-3 mb-6" start={6}>
            <li>
              <strong>Breakdown Response Time</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>If the vehicle breaks down, the Transporter must repair the issue within <strong>30 minutes.</strong></li>
              </ul>
            </li>
            <li>
              <strong>Alternative Transport (After 30 Minutes)</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>If the vehicle cannot be repaired in 30 minutes, the Transporter must <strong>arrange an alternative vehicle</strong> at their own expense.</li>
              </ul>
            </li>
            <li>
              <strong>Full Refund Requirement (After 60 Minutes)</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>If the journey is delayed <strong>60 minutes</strong> due to breakdown of the vehicle, the Traveller must be refunded <strong>100% of the fare.</strong></li>
              </ul>
            </li>
            <li>
              <strong>No Passenger Abandonment</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>The Transporter must ensure the Traveller boards an alternative transport before leaving to ensure the safety of the traveller.</li>
                <li>Passengers must never be left in unsafe conditions.</li>
              </ul>
            </li>
          </ol>

          <h3 className="font-semibold text-zinc-900 mb-2">5.3 Passenger Management & Safety</h3>
          <ol className="list-decimal pl-5 space-y-3 mb-6" start={10}>
            <li>
              <strong>Ticket Verification</strong><br/>
              The driver must position themselves at the vehicle entrance to check and validate Traveller tickets.
            </li>
            <li>
              <strong>Bag Inspection</strong><br/>
              Carry-on bags should be checked to prevent dangerous items from entering the vehicle.
            </li>
            <li>
              <strong>Luggage Handling</strong>
              <ul className="list-[lower-alpha] pl-5 mt-1 space-y-1">
                <li>All luggage must be placed in the <strong>booth</strong> or designated storage areas.</li>
                <li>No luggage should be accessible to Travellers during the journey for safety reasons.</li>
              </ul>
            </li>
            <li>
              <strong>Excess Luggage</strong><br/>
              Any excess weight or size must be paid for online through the platform.
            </li>
            <li>
              <strong>Arrival Announcement</strong><br/>
              Upon reaching the destination, the driver must clearly announce the arrival and remind Travellers to collect all their belongings.
            </li>
            <li>
              <strong>Supervision at Bag Collection</strong><br/>
              The driver must remain present at baggage retrieval points to prevent loss or theft.
            </li>
            <li>
              <strong>Bag Tagging</strong><br/>
              The Transporter may issue bag tags where necessary for proper identification.
            </li>
            <li>
              <strong>Ensure safe and comfortable seating</strong><br/>
              The number of passengers must not exceed the number of seats officially designated by the vehicle manufacturer. Overloading or squeezing Passengers are strictly prohibited.
            </li>
          </ol>

          <h3 className="font-semibold text-zinc-900 mb-2">5.4 Journey Rules</h3>
          <p className="mb-2">
            The Transporter is permitted at a maximum of five (5) stops in total, whether for passenger pick-ups or rest breaks, unless otherwise authorized by SmatWay.
          </p>
          <p className="mb-2">The Transporter shall not be held responsible for the following:</p>
          <ul className="list-[lower-alpha] pl-5 space-y-1 mb-4">
            <li>Adverse weather conditions that may delay the journey.</li>
            <li>Natural disasters that occur during the journey.</li>
            <li>Delays caused by traffic accidents or heavy road traffic.</li>
            <li>Delays caused by law enforcement or regulatory authorities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">6. Traveller Responsibilities</h2>
          <p className="mb-2">Travellers must:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide accurate information when booking.</li>
            <li>Arrive at pickup points on time.</li>
            <li>Follow all transporters' safety instructions.</li>
            <li>Respect the driver and fellow passengers.</li>
            <li>Comply with luggage limits and safety requirements.</li>
            <li>Comply with local laws and always carry appropriate identification.</li>
            <li>Understand that the transporter may ask a traveler to disembark if he or she causes delays to the journey or if required by local authorities.</li>
            <li>Refrain from inappropriate discussions or conversations that may offend other passengers or pose a safety risk.</li>
            <li>Avoid sharing personal or confidential information with strangers to ensure personal safety.</li>
            <li>Keep the journey as confidential as possible and do not disclose sensitive information to others.</li>
            <li>Respect other travelers' privacy.</li>
            <li>Playing loud music is not allowed because it can make others uncomfortable.</li>
            <li>We understand you what to smell good by using perfume or cologne or fragrance that smells good to you, but some people may be allergic to such. Kindly avoid spraying it while inside the vehicle or train.</li>
            <li>Maintain hygiene at all terms, sanitize and freshen up, when necessary, as undue odor could upset fellow travelers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">7. Prohibited Activities</h2>
          <p className="mb-2">Users shall not:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the platform for fraudulent purposes.</li>
            <li>Engage in violence, threats, or harassment.</li>
            <li>Attempt to bypass SmatWay's payment system.</li>
            <li>Post false information or impersonate others.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">8. SmatWay Rights</h2>
          <p className="mb-2">SmatWay may:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Suspend or terminate accounts violating these Terms.</li>
            <li>Hold payments during investigations.</li>
            <li>Change fares or policies without prior notification.</li>
            <li>Implement safety measures for platform integrity.</li>
            <li>We may disqualify you from using our platform and services or seek legal redress when necessary.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">9. Liability</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>SmatWay acts only as a <strong>marketplace</strong> and is <strong>not liable</strong> for accidents, losses, delays, misconduct, or vehicle conditions.</li>
            <li>Transporters bear full responsibility for compliance with laws, safety, and service quality.</li>
            <li>Travellers accept all inherent travel risks.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">10. Dispute Resolution</h2>
          <p>
            Any disputes between Transporters and Travelers should be resolved directly between the Transporter and the Traveler. Issues that cannot be resolved between the parties may be reported through the SmatWay support system, tellus@smatway.com. SmatWay may, at its discretion, mediate such disputes but is not obligated to reach a resolution.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">11. Modification of Terms</h2>
          <p>
            SmatWay reserves the right to modify these Terms at any time. Continued use of the Platform implies acceptance of updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the country where transportation is performed.<br/>
            SmatWay reserves the right to amend or modify the Terms of Use and Conditions at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">13. Contact Information</h2>
          <p className="mb-1">For questions or support<br/>Email: info@smatway.com</p>
          <p className="mb-1">For complaints<br/>tellus@smatway.com</p>
          <p className="mt-4 text-sm text-slate-500">Last Updated: 06.06.2026</p>
        </section>
      </div>
    </main>
  );
}
