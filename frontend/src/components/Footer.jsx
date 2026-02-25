import React, { useState } from 'react';
import { Facebook, Instagram, MapPin, X } from 'lucide-react';

const WhatsApp = ({ size = 18, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.232-.298.347-.497.114-.198.057-.371-.028-.543-.085-.173-.768-1.85-1.051-2.533-.277-.665-.562-.575-.772-.585-.198-.01-.424-.012-.65-.012-.227 0-.594.084-.905.424-.311.34-1.189 1.162-1.189 2.835 0 1.673 1.218 3.293 1.388 3.522.17.229 2.398 3.66 5.811 5.132 2.35 1.014 2.83 1.014 3.328.954.497-.06 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const Footer = () => {
    const [policyModal, setPolicyModal] = useState({ isOpen: false, title: '', content: '' });

    const policies = {
        terms: {
            title: "Terms of Service",
            content: `Welcome to VehicleeCare. By accessing or using our website, mobile application, or any related services, you agree to comply with and be bound by these Terms of Service. VehicleeCare provides door-to-door vehicle repair, maintenance, inspection, and related automotive services through certified technicians and partnered service centers. By using our platform, you confirm that you are at least 18 years of age and that all information provided by you is accurate and complete. We reserve the right to refuse service or suspend access if any information is found to be false, misleading, or in violation of applicable laws.

All bookings made through VehicleeCare are subject to availability and confirmation. Service charges, taxes, and any applicable platform or convenience fees will be displayed prior to confirmation. Estimated service times are indicative and may vary depending on the vehicle condition and operational factors. In certain cases, additional repairs may be required after inspection, and revised quotations may be provided for approval before proceeding. Pickup and drop services, where selected, may involve additional charges. We reserve the right to reschedule or cancel bookings due to unforeseen operational reasons, including but not limited to technician availability, weather conditions, or safety concerns.

Payments for services must be made through approved payment methods such as UPI, debit card, credit card, net banking, or any other payment option made available on the platform. Applicable GST and other taxes will be charged in accordance with Indian laws. Digital invoices will be issued upon successful payment. In case of cancellation within the permitted time window, refunds will be processed to the original payment method, subject to applicable cancellation or processing charges. Refund timelines may vary depending on the payment provider’s policies.

Users are responsible for providing accurate vehicle details and ensuring that the vehicle is accessible at the scheduled service time. Customers must remove personal belongings from the vehicle before handing it over for service, as VehicleeCare shall not be responsible for loss or damage to personal items left inside. Users agree to treat service personnel with respect and to refrain from any abusive or unlawful behavior.

VehicleeCare works with third-party partner garages and technicians to deliver services. While we strive to maintain high quality and safety standards, certain services inherently involve mechanical risks. VehicleeCare shall not be liable for indirect, incidental, or consequential damages arising from the use of the services. Our total liability, in any case, shall not exceed the amount paid by the customer for the specific service in question.

All content available on the platform, including logos, branding, design elements, and software, is the intellectual property of VehicleeCare and is protected under applicable laws. Unauthorized copying, reproduction, or misuse of platform content is strictly prohibited. Your use of the platform is also subject to our Privacy Policy, which governs how we collect, use, and protect your personal information in compliance with applicable Indian laws.

VehicleeCare reserves the right to suspend or terminate user accounts in cases of fraudulent activity, misuse of the platform, non-payment, or violation of these Terms. We may update or modify these Terms from time to time, and continued use of the platform after such updates constitutes acceptance of the revised Terms. These Terms shall be governed by the laws of India, and any disputes shall be subject to the jurisdiction of the courts in [Your City, India].`
        },
        privacy: {
            title: "Privacy Policy",
            content: `At VehicleeCare, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you access our website, mobile application, or use our services. By using our platform, you consent to the practices described in this policy.

VehicleeCare collects personal information that you voluntarily provide when creating an account, booking a service, contacting support, or interacting with our platform. This information may include your full name, phone number, email address, vehicle details, service history, billing information, and location data required for pickup and drop services. We may also collect technical data such as IP address, browser type, device information, and usage patterns to improve platform performance and security.

The information collected is used to provide and manage our services, process bookings, communicate service updates, generate invoices, process payments, and improve customer experience. We may use your contact details to send booking confirmations, reminders, service notifications, promotional offers, and important account-related communications. You may opt out of promotional communications at any time.

VehicleeCare may share limited information with trusted third-party partners such as garages, technicians, payment gateways, and logistics providers solely for the purpose of delivering the requested services. We do not sell, rent, or trade your personal information to third parties for marketing purposes. All third-party service providers are required to handle your information securely and in compliance with applicable laws.

We implement reasonable technical and organizational security measures to protect your personal data from unauthorized access, misuse, alteration, or disclosure. However, no online system is completely secure, and while we strive to protect your information, we cannot guarantee absolute security.

Payment transactions are processed through secure third-party payment providers. VehicleeCare does not store full card details or sensitive banking information on its servers. Any financial data shared during payment is encrypted and handled by authorized payment gateways.

We may retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce our agreements. Service history and transaction records may be maintained for operational, tax, or legal compliance purposes under Indian law.

Our platform may contain links to third-party websites or services. VehicleeCare is not responsible for the privacy practices or content of those external platforms. Users are encouraged to review the privacy policies of third-party services before providing personal information.

You have the right to access, update, or request deletion of your personal information, subject to legal and operational requirements. If you wish to modify your data or raise concerns about privacy practices, you may contact us through our official support channels.

VehicleeCare reserves the right to update this Privacy Policy from time to time. Any changes will be posted on this page with the updated date. Continued use of the platform after changes are published constitutes acceptance of the revised policy.

This Privacy Policy is governed by the laws of India, and any disputes arising from it shall be subject to the jurisdiction of the courts in [Your City, India].`
        },
        security: {
            title: "Security",
            content: `At VehicleeCare, we are committed to maintaining the highest standards of security to protect our users, partners, and platform. We implement appropriate technical and organizational measures to safeguard personal information, financial data, and operational systems against unauthorized access, misuse, loss, or alteration. Our systems are designed with security best practices, including encrypted data transmission, secure authentication mechanisms, and restricted administrative access.

All sensitive data transmitted through our platform is protected using industry-standard encryption protocols. We use secure servers and trusted infrastructure providers to host and manage our systems. Access to user data is strictly limited to authorized personnel who require it for operational purposes, and such access is governed by confidentiality obligations and internal security controls.

VehicleeCare does not store full credit or debit card details on its servers. Payment transactions are processed through certified third-party payment gateways that comply with applicable financial security standards. Any financial information entered during payment is encrypted and handled securely by authorized providers.

We continuously monitor our systems for potential vulnerabilities and threats. Security updates, patches, and upgrades are applied regularly to maintain system integrity. In the event of any suspected unauthorized activity, we take immediate steps to investigate and mitigate risks. While we strive to maintain robust security controls, no digital platform can guarantee absolute protection, and users are encouraged to protect their account credentials and avoid sharing passwords with others.

Users are responsible for maintaining the confidentiality of their login credentials and for any activity that occurs under their account. If you suspect unauthorized access to your account, you must notify us immediately so that appropriate action can be taken. We recommend using strong passwords and enabling additional security features where available.

VehicleeCare reserves the right to temporarily suspend access to the platform for maintenance, upgrades, or in response to potential security threats. Our goal is to ensure a safe and reliable environment for all users while continuously improving our security infrastructure.`
        },
        docs: {
            title: "Documentation",
            content: `The Documentation section of VehicleeCare provides detailed information about how our platform operates, how services are delivered, and how users, garages, and partners can effectively use the system. This documentation is intended to guide customers, service partners, franchise owners, and administrators in understanding the features, processes, and policies of the VehicleeCare platform.

Our documentation explains the booking process, service workflow, payment procedures, cancellation policies, refund handling, and service standards. It also includes operational guidelines for garage partners, including service quality requirements, pricing structures, commission models, and compliance expectations. Administrative documentation outlines system configuration, user management, billing settings, and security controls to ensure smooth platform operation.

VehicleeCare may update its documentation periodically to reflect improvements, feature enhancements, policy updates, or regulatory changes. Users and partners are encouraged to review the documentation regularly to stay informed about current procedures and standards. Continued use of the platform indicates acceptance of any updated processes described in the documentation.

All documentation provided by VehicleeCare is for informational purposes only and does not constitute a legally binding agreement unless explicitly stated. In the event of any conflict between documentation and official agreements or Terms of Service, the official agreements shall prevail.

If you require clarification or additional support regarding any part of the documentation, you may contact our support team through the official communication channels provided on the platform.`
        },
        refund: {
            title: "Refund Policy",
            content: `At VehicleeCare, we strive to provide reliable and transparent automotive services. This Refund Policy outlines the terms under which refunds may be issued for bookings made through our platform. By using our services, you agree to the conditions described below.

Refunds may be applicable in cases where a booking is cancelled within the permitted cancellation window, where payment has been made but the service was not delivered, or where a service cannot be fulfilled due to operational constraints. If a customer cancels a booking before the service technician or pickup partner has been assigned, a full refund may be processed. However, cancellations made after assignment, dispatch, or during service execution may attract cancellation or processing charges.

If a service is cancelled by VehicleeCare due to unavailability, safety concerns, or operational reasons, customers will be eligible for a full refund of the amount paid. In cases where partial services have been completed, refunds may be issued proportionately based on the services not rendered. Any platform fees, convenience charges, or applicable taxes may be deducted depending on the stage of service delivery.

Refunds will be processed to the original payment method used at the time of booking. The processing timeline may vary depending on the payment provider, bank policies, or financial institution procedures, and may typically take 5 to 10 business days. VehicleeCare does not have control over external banking delays once a refund has been initiated.

In situations involving service dissatisfaction, customers are encouraged to contact support promptly. Refunds in such cases will be evaluated after reviewing service records, technician reports, and relevant evidence. VehicleeCare reserves the right to approve, partially approve, or decline refund requests if misuse, false claims, or policy violations are detected.

Refunds will not be applicable for completed services where the agreed scope of work has been fulfilled unless a clear service deficiency is established. Additional charges arising from customer-requested modifications, extra repairs approved after inspection, or emergency service upgrades are non-refundable once completed.

VehicleeCare reserves the right to update or modify this Refund Policy at any time. Any changes will be reflected on this page with an updated date. Continued use of our services constitutes acceptance of the revised policy.`
        },
        community: {
            title: "Community Guidelines",
            content: `VehicleeCare is committed to building a respectful, transparent, and trustworthy automotive service community. These Community Guidelines outline the standards of conduct expected from users, garage partners, franchise members, and administrators while interacting on our platform. By using VehicleeCare, you agree to maintain professionalism, honesty, and mutual respect in all communications and transactions.

Users are expected to provide accurate information when booking services, writing reviews, or interacting with service providers. Any misleading, fraudulent, or abusive behavior is strictly prohibited. Harassment, threats, discriminatory remarks, or inappropriate language directed toward staff, partners, or other users will not be tolerated. VehicleeCare reserves the right to suspend or terminate accounts that violate these standards.

Reviews and feedback should reflect genuine service experiences. Posting false reviews, manipulating ratings, or attempting to damage the reputation of a garage or technician without valid reason is considered a violation of community standards. Similarly, garage partners are expected to maintain ethical service practices, provide transparent pricing, and treat customers with professionalism and respect.

VehicleeCare does not permit the use of the platform for unlawful activities, spamming, solicitation, or distribution of harmful content. Users must not attempt to bypass the platform’s systems, interfere with operations, or misuse data obtained through the platform. Any attempt to exploit system vulnerabilities or engage in fraudulent payment activities will result in immediate action.

Our goal is to create a safe and reliable environment where customers can confidently book services and partners can grow their businesses. We encourage open communication and constructive feedback while maintaining courtesy and integrity. VehicleeCare reserves the right to review reported violations and take appropriate action, including warnings, content removal, temporary suspension, or permanent account termination.`
        },
        cookie: {
            title: "Cookie Policy",
            content: `This Cookie Policy explains how VehicleeCare uses cookies and similar tracking technologies when you visit our website or use our platform. By continuing to browse or use our services, you consent to the use of cookies in accordance with this policy.

Cookies are small text files that are stored on your device when you access a website. They help us enhance your browsing experience, remember your preferences, and improve the functionality and performance of our platform. Cookies allow VehicleeCare to recognize returning users, maintain login sessions, and provide a smoother and more personalized user experience.

We use cookies to ensure that essential features of the platform function properly, such as secure login, booking management, and payment processing. These cookies are necessary for the operation of the website and cannot be disabled without affecting core functionality. We may also use performance and analytics cookies to understand how users interact with the platform, which pages are most visited, and how we can improve our services. This information is collected in an aggregated and non-personally identifiable manner.

In some cases, VehicleeCare may use third-party services, such as analytics providers or advertising partners, that place cookies on your device. These third parties may collect information about your browsing behavior in accordance with their own privacy policies. We do not control third-party cookies, but we work only with reputable providers to ensure data protection and security standards are maintained.

You have the option to control or disable cookies through your browser settings. Most web browsers allow you to manage cookie preferences, block certain cookies, or delete stored cookies. However, disabling essential cookies may impact the functionality of the platform and limit certain features, such as booking services or accessing your account.

VehicleeCare may update this Cookie Policy from time to time to reflect changes in technology, regulations, or business practices. Any updates will be posted on this page with the revised date. Continued use of our platform after changes are published constitutes acceptance of the updated policy.`
        },
        careers: {
            title: "Careers",
            content: `At VehicleeCare, we are building the future of automotive services through innovation, transparency, and customer-first thinking. We believe that great service starts with great people, and we are always looking for passionate, driven, and talented individuals who want to make a meaningful impact in the automotive industry. If you are motivated by technology, operational excellence, and customer satisfaction, VehicleeCare offers an environment where your ideas and skills can truly grow.

Our team brings together professionals from diverse backgrounds including automotive expertise, technology development, operations management, customer support, and business strategy. We value integrity, accountability, collaboration, and continuous improvement. At VehicleeCare, every team member plays an important role in delivering reliable and transparent car care solutions to customers across the region.

We offer opportunities across multiple areas such as service operations, garage network management, technical support, digital marketing, software development, customer experience, and franchise expansion. Whether you are an experienced professional or just beginning your career journey, we encourage individuals who are enthusiastic, adaptable, and committed to excellence to join us.

VehicleeCare provides a dynamic and growth-oriented work environment where performance is recognized and innovation is encouraged. We believe in empowering our team members with responsibility, supporting professional development, and fostering a culture of mutual respect and continuous learning.`
        },
        support: {
            title: "Support",
            content: `At VehicleeCare, customer satisfaction is our highest priority. We are committed to providing reliable assistance and timely solutions to ensure a smooth and stress-free service experience. Whether you have questions about a booking, need help with payments, want to modify or cancel a service, or require clarification regarding invoices, our support team is here to assist you.

We understand that vehicle-related concerns can be urgent, and our goal is to respond quickly and efficiently to all inquiries. Our support team is trained to handle booking issues, service updates, refund requests, pickup and drop coordination, and technical platform-related concerns. We strive to resolve queries with transparency and professionalism while keeping you informed at every step.

Customers are encouraged to reach out as soon as they encounter any issue so that we can provide the best possible resolution. For booking-related concerns, please include your booking ID and registered contact details to help us process your request faster. Our team carefully reviews each case to ensure fair and accurate handling of service matters.

VehicleeCare is continuously working to improve support response times and service quality standards. Your feedback plays an important role in helping us enhance our platform and maintain high operational standards.

For assistance, you may contact us at vehicleecare@gmail.com or call our support helpline during working hours. We are here to ensure that your experience with VehicleeCare remains smooth, transparent, and dependable.`
        },
        help: {
            title: "Help Center",
            content: `Welcome to the VehicleeCare Help Center. Our goal is to provide clear guidance and quick solutions to ensure a seamless experience while using our platform. Whether you are booking a service, tracking a technician, managing payments, or reviewing invoices, this section is designed to answer common questions and help you resolve issues efficiently.

VehicleeCare allows customers to book vehicle services in just a few simple steps by selecting their vehicle, choosing the required service, selecting a garage or pickup option, scheduling a convenient time, and confirming payment. Once your booking is confirmed, you will receive updates via email or SMS regarding service status, technician assignment, pickup details, and completion confirmation. If you need to modify or cancel a booking, you can do so within the permitted cancellation window through your account dashboard.

For payment-related queries, our platform supports secure transactions via UPI, debit or credit cards, net banking, and other approved payment methods. All charges, including applicable taxes and platform fees, are displayed before confirmation. Invoices are generated digitally and can be accessed from your booking history. If a refund is applicable, it will be processed to the original payment method in accordance with our Refund Policy.

Customers can track their booking status in real time through their account profile. In case of service delays, rescheduling, or unexpected operational changes, we strive to notify users promptly. If you experience technical issues while using the platform, such as login difficulties or booking errors, we recommend clearing your browser cache or contacting support for assistance.

VehicleeCare is committed to maintaining transparency and quality standards. If you are dissatisfied with any aspect of the service, you may contact our support team with your booking details so that we can investigate and provide a fair resolution. We value customer feedback and continuously work to improve our processes based on user experiences.`
        },
        faq: {
            title: "FAQ's",
            content: `How do I book a service on VehicleeCare?\nYou can book a service by selecting your vehicle, choosing the required service, selecting your preferred garage or pickup option, scheduling a convenient time slot, and confirming your booking through secure payment. Once confirmed, you will receive a booking confirmation via email or SMS.

Can I modify or cancel my booking?\nYes, bookings can be modified or cancelled within the permitted cancellation window. You can manage your booking directly from your account dashboard. Cancellation charges may apply depending on the stage of service.

What payment methods are accepted?\nVehicleeCare accepts UPI, debit and credit cards, net banking, and other approved digital payment methods. All payments are processed securely through trusted payment gateways.

Will I receive an invoice after the service?\nYes, a digital invoice with service details, charges, and applicable GST will be generated and available in your booking history after successful payment.

Is pickup and drop service available?\nPickup and drop services are available in select locations. Additional charges may apply depending on distance and operational availability.

How are service charges calculated?\nService charges are based on the type of vehicle, selected service package, parts required, and applicable taxes. Any additional repairs identified during inspection will be communicated before proceeding.

What if I am not satisfied with the service?\nIf you are dissatisfied with the service, you may contact our support team with your booking details. We will review the matter carefully and work towards a fair resolution in accordance with our policies.

How long does a refund take?\nIf eligible, refunds are processed to the original payment method and may take 5 to 10 business days depending on your bank or payment provider.

Is my personal and payment information secure?\nYes, VehicleeCare uses encrypted connections and secure payment gateways to protect user data. We do not store full card details on our servers.

How can I contact customer support?\nYou can contact our support team by emailing support@vehicleecare.com or calling our helpline during working hours. Please include your booking ID for faster assistance.`
        }
    };

    const openPolicy = (type, e) => {
        e.preventDefault();
        if (policies[type]) {
            setPolicyModal({ isOpen: true, title: policies[type].title, content: policies[type].content });
        } else {
            console.log("Opening policy:", type);
        }
    };

    return (
        <footer className="bg-gradient-to-br from-gray-50 to-blue-50 text-gray-600 py-6 border-t border-white/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-6 text-center -mt-2 gap-10">
                    <div className="text-left">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-[#052558] to-[#527FB0] text-transparent bg-clip-text mb-2">VehicleeCare</h3>
                        <p className="text-justify w-45 text-gray-500 mb-6">Premium quality vehicle service at your doorstep quick and hassle-free.</p>
                        <div className="flex gap-5">
                            <Facebook size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <Instagram size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <WhatsApp size={20} className="pl-1 pb-0.5 text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                            <MapPin size={18} className="text-[#052558] hover:text-[#527FB0] transition-colors cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-3">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Home</li>
                            <li>About Us</li>
                            <li>Services</li>
                            <li>Reviews</li>
                            <li>Contact</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#052558] mb-3">User Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>My Account</li>
                            <li>My Bookings</li>
                            <li>My Payments</li>
                            <li>My Notifications</li>
                            <li>My Service History</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-3">Services</h4>
                        <ul className="space-y-2 text-sm">
                            <li>General Service</li>
                            <li>Engine & Mechanical</li>
                            <li>Inspection & Diagnostics</li>
                            <li>Battery & Charging</li>
                            <li>Roadside Assistance</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-3">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><button onClick={(e) => openPolicy('faq', e)} className="hover:text-gray-900 transition-colors">FAQ's</button></li>
                            <li><button onClick={(e) => openPolicy('careers', e)} className="hover:text-gray-900 transition-colors">Careers</button></li>
                            <li><button onClick={(e) => openPolicy('support', e)} className="hover:text-gray-900 transition-colors">Support</button></li>
                            <li>Locations</li>
                            <li><button onClick={(e) => openPolicy('help', e)} className="hover:text-gray-900 transition-colors">Help Center</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#052558] mb-3 ml-8">For Business
                            <sup className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide ml-1 relative -top-2 cursor-pointer group">
                                BETA
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] normal-case font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center shadow-lg leading-tight">
                                    Our Business section is currently under development, but you may still submit your application.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </sup>
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>Join our team</li>
                            <li>Take a Franchise</li>
                            <li>Charging Stations</li>
                            <li>Dealer Partnership</li>
                            <li>Fleet Maintenance</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-4.5 pt-3.5 border-t border-gray-200 text-sm text-gray-500 flex flex-col md:flex-row justify-center items-center gap-10">
                    <p>&copy; 2026 VehicleeCare. All rights reserved.</p>
                    <div className="flex gap-10 md:gap-10 pt- flex-wrap justify-center">
                        <button onClick={(e) => openPolicy('terms', e)} className="hover:text-gray-600 transition-colors">Terms of Service</button>
                        <button onClick={(e) => openPolicy('privacy', e)} className="hover:text-gray-600 transition-colors">Privacy Policy</button>
                        <button onClick={(e) => openPolicy('security', e)} className="hover:text-gray-600 transition-colors">Security</button>
                        <button onClick={(e) => openPolicy('status', e)} className="hover:text-gray-600 transition-colors">Status</button>
                        <button onClick={(e) => openPolicy('docs', e)} className="hover:text-gray-600 transition-colors">Docs</button>
                        <button onClick={(e) => openPolicy('refund', e)} className="hover:text-gray-600 transition-colors">Refund Policy</button>
                        <button onClick={(e) => openPolicy('community', e)} className="hover:text-gray-600 transition-colors">Community</button>
                        <button onClick={(e) => openPolicy('cookie', e)} className="hover:text-gray-600 transition-colors">Cookie Policy</button>
                    </div>
                </div>
            </div>

            {/* Policy Modal */}
            {policyModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[60vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/80">
                            <h3 className="text-xl font-bold text-[#052558]">{policyModal.title}</h3>
                            <button
                                onClick={() => setPolicyModal({ isOpen: false, title: '', content: '' })}
                                className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-full transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-justify text-gray-600 text-sm leading-relaxed space-y-4">
                            {policyModal.content.split('\n\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
