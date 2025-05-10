import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import heroBackgroundImage from '../../assets/secondpic.avif';
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon, // <<< ENSURE THIS IS IMPORTED (it was, but good to double check)
  CogIcon,
  ChatBubbleLeftRightIcon, // This was in the original import list but not used in features/benefits; can be removed if not needed elsewhere
  LightBulbIcon,
  ChartBarIcon,
  HeartIcon, // Main Brand Icon
  UserPlusIcon, // Added for "How It Works" section
  DocumentTextIcon // Added for "How It Works" section
} from '@heroicons/react/24/outline';

// It's generally better to put keyframes and animation utility classes in your global CSS (e.g., index.css)
// For this example, I'll keep them here for self-containment, but advise moving them.
const animationStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
  .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
  .animate-scaleIn { animation: scaleIn 0.7s ease-out forwards; }

  /* Staggered delays (can be applied via style prop or utility classes) */
  .delay-100 { animation-delay: 0.1s !important; }
  .delay-200 { animation-delay: 0.2s !important; }
  .delay-300 { animation-delay: 0.3s !important; }
  .delay-400 { animation-delay: 0.4s !important; }
  .delay-500 { animation-delay: 0.5s !important; }
  .delay-700 { animation-delay: 0.7s !important; }
  .delay-1000 { animation-delay: 1s !important; }

  .hero-bg-gradient {
    background: linear-gradient(145deg, #1e3a8a 0%, #3b0764 100%); /* Deep Blue to Deep Purple */
  }
  .feature-card-hover {
    transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
  }
  .feature-card-hover:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  }
  .testimonial-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const LandingPage = () => {
  const currentYear = new Date().getFullYear();

  // Intersection Observer for animations
  const observerRefs = useRef([]);
  const addToRefs = (el) => {
    if (el && !observerRefs.current.includes(el)) {
      observerRefs.current.push(el);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            entry.target.classList.remove('opacity-0', 'translate-y-5', 'scale-95');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observerRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observerRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const initialAnimationClasses = "opacity-0 transform translate-y-5 scale-95 transition-all duration-700 ease-out";

  const features = [
    {
      icon: UserGroupIcon,
      title: "Holistic Patient Care",
      description: "Centralized patient records, history, and communication tools for comprehensive care.",
      color: "indigo"
    },
    {
      icon: CalendarDaysIcon,
      title: "Smart Scheduling",
      description: "Intuitive appointment booking, staff schedule management, and automated reminders.",
      color: "sky"
    },
    {
      icon: CurrencyDollarIcon, // This icon should now be defined
      title: "Seamless Billing",
      description: "Integrated billing, payment tracking, and financial reporting for operational clarity.",
      color: "emerald"
    },
    {
      icon: CogIcon,
      title: "Operational Efficiency",
      description: "Streamlined workflows for admissions, treatments, and staff assignments.",
      color: "purple"
    },
  ];

  const benefits = [
    { title: "Enhanced Patient Experience", description: "Reduced wait times, better communication, and personalized care.", icon: HeartIcon },
    { title: "Improved Staff Productivity", description: "Automated tasks and easy access to information empower your team.", icon: LightBulbIcon },
    { title: "Data-Driven Decisions", description: "Comprehensive analytics and reporting for informed hospital management.", icon: ChartBarIcon },
    { title: "Secure & Compliant", description: "Built with data security and healthcare regulations in mind.", icon: ShieldCheckIcon },
  ];

  return (
    <>
      <style>{animationStyles}</style>
      <div className=" text-slate-800 antialiased overflow-x-hidden">
        {/* Navbar */}
        <nav className="bg-[#f0f8ff] backdrop-blur-xl shadow-md fixed w-full z-50 top-0 transition-all duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="text-3xl font-extrabold text-[#3498db] flex items-center group">
                <HeartIcon className="w-9 h-9 mr-2.5 text-[#3498db] group-hover:text-purple-500 transition-transform duration-300 group-hover:scale-110" />
                <span className="group-hover:text-purple-600 transition-colors duration-300">CareConnect</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Link
                  to="#features"
                  className="hidden md:inline-block text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Features
                </Link>
                <Link
                  to="#how-it-works"
                  className="hidden md:inline-block text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  to="/login"
                  className="cta-button-primary bg-[#3498db] hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
                >
                  Staff Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className=" text-black/50  pt-40 pb-28 md:pt-48 md:pb-36 relative">
          <div className="absolute inset-0 opacity-50 bg-cover bg-center"  style={{ backgroundImage: `url(${heroBackgroundImage})` }}></div>
          <div className="container mx-auto px-6 text-center relative z-10">
            <h1 ref={addToRefs} className={`${initialAnimationClasses} text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 leading-tight delay-100`}>
              The Future of Healthcare Management, <span className="block">Simplified.</span>
            </h1>
            <p ref={addToRefs} className={`${initialAnimationClasses} text-lg sm:text-xl text-black/50 mb-12 max-w-3xl mx-auto delay-300`}>
              CareConnect HMS empowers medical professionals with an intuitive.
            </p>
            <div ref={addToRefs} className={`${initialAnimationClasses} delay-500 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6`}>
              <Link
                to="/login"
                className="cta-button-primary bg-white text-indigo-700 font-bold py-3.5 px-10 rounded-lg text-lg shadow-xl hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-500 w-full sm:w-auto"
              >
                Access Portal
              </Link>
              <Link
                to="#features"
                className="cta-button-primary bg-transparent hover:bg-white/20 text-white font-semibold py-3.5 px-10 rounded-lg text-lg border-2 border-white w-full sm:w-auto"
              >
                Learn More <ArrowRightIcon className="inline-block h-5 w-5 ml-2"/>
              </Link>
            </div>
          </div>
        </header>

        {/* Benefits Section */}
        <section id="benefits" className=" bg-[#f0f8ff] py-20 md:py-28 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 md:mb-20">
              <h2 ref={addToRefs} className={`${initialAnimationClasses} text-3xl md:text-4xl font-bold text-slate-800 mb-3`}>Transform Your Practice</h2>
              <p ref={addToRefs} className={`${initialAnimationClasses} text-slate-600 max-w-xl mx-auto delay-200`}>
                Experience tangible benefits that drive better outcomes and operational excellence.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  ref={addToRefs}
                  className={`${initialAnimationClasses} delay-${(index + 1) * 100} bg-white p-8 rounded-xl shadow-lg text-center feature-card-hover`}
                >
                  <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-6 shadow-md`}>
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section (Detailed) */}
        <section id="features" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 md:mb-20">
              <h2 ref={addToRefs} className={`${initialAnimationClasses} text-3xl md:text-4xl font-bold text-slate-800 mb-3`}>Powerful Features, Intuitively Designed</h2>
              <p ref={addToRefs} className={`${initialAnimationClasses} text-slate-600 max-w-xl mx-auto delay-200`}>
                Our system is packed with tools to cover every aspect of hospital management.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  ref={addToRefs}
                  className={`${initialAnimationClasses} delay-${(index + 1) * 200} flex items-start space-x-6 p-6 rounded-lg hover:bg-slate-50 transition-colors`}
                >
                  <div className={`flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-[#3498db] text-white shadow-sm`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-1.5">{feature.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-[#f0f8ff] py-20 md:py-28 bg-slate-100">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 md:mb-20">
                    <h2 ref={addToRefs} className={`${initialAnimationClasses} text-3xl md:text-4xl font-bold text-slate-800 mb-3`}>Simple Steps to Efficiency</h2>
                    <p ref={addToRefs} className={`${initialAnimationClasses} text-slate-600 max-w-xl mx-auto delay-200`}>
                        Our system simplifies complex hospital workflows into manageable steps.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[
                        { title: "Register & Schedule", description: "Easily onboard patients and manage appointments for all staff.", icon: UserPlusIcon, delay: 100 },
                        { title: "Manage Care & Treatments", description: "Doctors and nurses access records, log treatments, and coordinate care.", icon: DocumentTextIcon, delay: 300 },
                        { title: "Bill & Report", description: "Streamline billing, track payments, and generate insightful reports.", icon: ChartBarIcon, delay: 500 }
                    ].map((step, index) => (
                        <div key={step.title} ref={addToRefs} className={`${initialAnimationClasses} delay-${step.delay} bg-white p-8 rounded-xl shadow-lg feature-card-hover`}>
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#3498db] text-white mb-6 shadow-md">
                                <step.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">{index + 1}. {step.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Call to Action Section */}
        <section ref={addToRefs} className={`${initialAnimationClasses} py-24 md:py-32 hero-gradient text-white`}>
          <div className="container mx-auto px-6 text-center">
            <ShieldCheckIcon className="h-16 w-16 text-[#3498db] mx-auto mb-6 "/>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-black">Secure, Reliable, and Ready for Your Hospital</h2>
            <p className="text-black max-w-2xl mx-auto mb-10 text-lg">
              Invest in a system that grows with you and prioritizes data security and ease of use.
            </p>
            <Link
              to="/login"
              className="cta-button-secondary bg-[#3498db] text-white font-bold py-4 px-12 rounded-lg text-xl shadow-xl hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              Get Started Today
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#1a237e] text-slate-400 py-16">
          <div className="container mx-auto px-6 text-center">
            <div className="mb-6">
                <Link to="/" className="text-2xl font-bold text-[#3498db] flex items-center justify-center group">
                    <HeartIcon className="w-8 h-8 mr-2.5 text-[[#3498dd]] group-hover:text-[[#3498dd]] transition-colors" />
                    <span className="group-hover:text-[#3498dd] transition-colors text-[#3498db]">CareConnect HMS</span>
                </Link>
            </div>
            <div className="flex justify-center space-x-6 mb-6">
                <a href="#features" className="hover:text-indigo-300 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-indigo-300 transition-colors">How It Works</a>
                <a href="#" className="hover:text-indigo-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-indigo-300 transition-colors">Terms of Service</a>
            </div>
            <p className="text-sm">&copy; {currentYear} CareConnect HMS. All rights reserved.</p>
            <p className="text-xs mt-2">Streamlining Healthcare, One Click at a Time.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
