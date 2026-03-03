import React, { useState } from 'react';
import { X } from 'lucide-react';

const legalContent = {
    'Terms & Conditions': `VehicleeCare is a technology-driven platform designed to connect vehicle owners with verified service providers including garages, parking operators, EV charging stations, auto stores, car wash centers, and roadside assistance partners. By accessing, browsing, or using our website or mobile application, you agree to comply with these Terms & Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, you should discontinue use of the platform immediately.\n\nUsers are responsible for providing accurate, complete, and up-to-date information while creating an account or booking a service. Any misuse of the platform, including fraudulent bookings, false complaints, payment manipulation, abuse of partners, or unlawful activities, may result in immediate suspension or permanent termination of the account. VehicleeCare reserves the right to verify user details and refuse service at its sole discretion.\n\nBusiness partners listing their services on VehicleeCare must ensure that all required licenses, permits, certifications, and insurance documents are valid and compliant with local laws. Partners are solely responsible for the quality, safety, pricing transparency, and timely delivery of their services. VehicleeCare acts only as an intermediary marketplace and does not directly control or supervise the execution of services unless explicitly stated.\n\nAll payments made through the platform may include applicable service charges, convenience fees, and taxes as per Indian regulations. Pricing displayed on the platform may vary based on demand, availability, or partner policies. VehicleeCare is not responsible for disputes related to workmanship, service outcomes, or damages caused during service execution, though we may assist in facilitating resolution where possible.\n\nVehicleeCare reserves the right to modify these Terms & Conditions at any time. Continued use of the platform after updates constitutes acceptance of the revised terms. These terms shall be governed and interpreted in accordance with the laws of India, and any disputes shall fall under the jurisdiction of Indian courts.`,
    'Privacy Policy': `At VehicleeCare, protecting user privacy is a top priority. We collect personal information including name, contact number, email address, location data, vehicle details, device information, IP address, and payment-related information to ensure smooth booking and service coordination. This information allows us to connect users with nearby service providers, process payments securely, and improve overall platform performance.\n\nPersonal data is used strictly for operational purposes such as account management, booking confirmation, customer support, service updates, promotional offers (where consent is provided), fraud prevention, and analytics to enhance user experience. We may use anonymized data for research, reporting, and business optimization.\n\nVehicleeCare may share necessary information with verified service partners to complete bookings, with secure payment gateways to process transactions, and with regulatory authorities if legally required. We do not sell, rent, or trade personal information to third parties for marketing purposes.\n\nWe implement reasonable administrative, technical, and physical safeguards to protect user data against unauthorized access, misuse, or disclosure. However, no digital platform can guarantee absolute security. Users are responsible for maintaining confidentiality of their account credentials.\n\nUsers have the right to access, update, or request deletion of their personal information subject to legal and contractual obligations. Requests may be submitted through our official support channels.`,
    'Refund Policy': `VehicleeCare aims to maintain fairness and transparency in refund handling. Refunds may be considered in situations where a service provider fails to deliver the booked service, cancels without valid reason, significantly deviates from the agreed service scope, or when a technical issue leads to duplicate or incorrect billing.\n\nRefund eligibility is assessed after reviewing booking details, communication records, and partner responses. VehicleeCare may request supporting documents, images, or evidence to evaluate claims. Partial refunds may be issued if services were partially delivered.\n\nRefunds are generally not applicable for completed services that meet the described scope, dissatisfaction due to subjective preferences, delays caused by external factors beyond reasonable control, or user no-shows. Cancellation charges, platform fees, or payment gateway fees may be non-refundable depending on circumstances.\n\nApproved refunds are processed within 5–10 business days to the original payment method. Processing timelines may vary depending on banking institutions or payment providers.`,
    // 'Cancelation Policy': `Users may cancel bookings prior to the scheduled service time through the platform. Early cancellations may qualify for a full or partial refund depending on the service type and partner policy. Cancellations made shortly before the service time may incur a cancellation fee to compensate partners for lost time and operational costs.\n\nIn cases where a service provider cancels a confirmed booking, users may be eligible for a full refund or alternative booking assistance. VehicleeCare monitors partner cancellation behavior and may impose penalties, temporary suspension, or permanent removal for repeated or unjustified cancellations.\n\nVehicleeCare reserves the right to cancel bookings in situations involving suspected fraud, safety concerns, inaccurate information, pricing errors, or force majeure events such as natural disasters, government restrictions, or technical outages.`,
    'Cookie Policy': `VehicleeCare uses cookies and similar tracking technologies to enhance website functionality, improve user experience, analyze traffic patterns, and ensure secure login sessions. Cookies help us remember user preferences, speed up navigation, and provide personalized content relevant to location and service history.\n\nWe may use both session cookies (temporary) and persistent cookies (stored for a longer duration). Third-party analytics tools may also place cookies to help us understand platform performance and user engagement trends.\n\nUsers can manage or disable cookies through their browser settings. However, disabling cookies may affect certain features such as login sessions, booking functionality, or personalized recommendations. By continuing to use our platform, you consent to our use of cookies in accordance with this policy.`
};

const Footer = () => {
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: '' });

    const openModal = (title) => {
        setModalConfig({ isOpen: true, title, content: legalContent[title] });
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        document.body.style.overflow = 'auto';
    };

    return (
        <footer className="border-t border-slate-100 py-10 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 grayscale opacity-60">
                    <span className="font-semibold ">VehicleeCare</span>
                    <span className="text-[16px] font-semibold ">BUSINESS</span>
                    <span className="text-[15px] mb-1 hidden sm:inline"> | </span>
                    <span className="text-[14px]">All rights reserved.</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] font-medium text-slate-500">
                    {Object.keys(legalContent).map((policyTitle) => (
                        <button
                            key={policyTitle}
                            onClick={() => openModal(policyTitle)}
                            className="hover:text-blue-600 transition-colors focus:outline-none"
                        >
                            {policyTitle}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legal Modal Overlay */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                        aria-hidden="true"
                    ></div>

                    <div className="bg-white rounded-[2rem] shadow-2xl w-full text-justify max-w-5xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-center p-6 md:p-8 border-b border-slate-100 relative">
                            <h2 className="text-2xl font-bold text-[#011023] uppercase text-center tracking-tight">{modalConfig.title}</h2>
                            <button
                                onClick={closeModal}
                                className="absolute right-6 md:right-8 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 md:p-8 overflow-y-auto flex-1">
                            <div className="space-y-3 -mt-5 text-sm md:text-base text-slate-600 leading-relaxed text-justify">
                                {modalConfig.content.split('\n\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
