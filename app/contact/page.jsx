'use client'

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const ContactPage = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16 min-h-[70vh]">
        <div className="max-w-3xl space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-600">
              Contact
            </p>
            <h1 className="text-4xl font-semibold text-gray-800 mt-3">
              We would love to hear from you.
            </h1>
          </div>
          <p className="text-gray-600 leading-7">
            Reach out for support, seller onboarding, or product questions.
          </p>
          <div className="space-y-2 text-gray-700">
            <p>Email: contact@swyftcart</p>
            <p>Phone: +1-234-567-890</p>
            <p>Hours: Monday to Friday, 9:00 AM to 6:00 PM</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
