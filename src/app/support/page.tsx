'use client'
import { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  HelpCircle,
} from "lucide-react";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("faq");
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I reset my password?",
      answer:
        'To reset your password, click on the "Forgot Password" link on the login page. Enter your registered email address, and we will send you a link to create a new password.',
    },
    {
      question: "How can I update my account information?",
      answer:
        'You can update your account information by navigating to the Profile section after logging in. Click on "Edit Profile" to modify your personal details.',
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept various payment methods including credit/debit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. For enterprise customers, we also offer invoice-based payments.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        'To cancel your subscription, go to the Billing section in your account settings. Click on "Manage Subscription" and follow the cancellation process. Please note that refunds are subject to our refund policy.',
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, we take data security very seriously. We use industry-standard encryption protocols and secure servers to protect your information. Our platform is compliant with relevant data protection regulations.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleContactFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would implement your form submission logic
    alert("Support request submitted! We will get back to you soon.");
    setContactFormData({ name: "", email: "", subject: "", message: "" });
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Find answers to frequently asked questions or get in touch with our
            support team
          </p>
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-3 px-4 pl-12 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-4 top-3.5 text-gray-500"
              size={20}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-8">
          <button
            onClick={() => handleTabChange("faq")}
            className={`mr-8 py-4 text-lg font-medium border-b-2 transition-colors ${
              activeTab === "faq"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <HelpCircle className="inline mr-2" size={18} />
            FAQs
          </button>
          <button
            onClick={() => handleTabChange("contact")}
            className={`mr-8 py-4 text-lg font-medium border-b-2 transition-colors ${
              activeTab === "contact"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle className="inline mr-2" size={18} />
            Contact Support
          </button>
          <button
            onClick={() => handleTabChange("resources")}
            className={`py-4 text-lg font-medium border-b-2 transition-colors ${
              activeTab === "resources"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="inline mr-2" size={18} />
            Resources
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "faq" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Frequently Asked Questions
            </h2>

            {searchQuery && filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No results found for "{searchQuery}"
                </p>
                <p className="mt-2 text-gray-600">
                  Try using different keywords or contact our support team
                </p>
                <button
                  onClick={() => handleTabChange("contact")}
                  className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            )}

            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="flex justify-between items-center w-full p-4 text-left bg-white hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">
                      {faq.question}
                    </span>
                    {activeAccordion === index ? (
                      <ChevronUp className="text-gray-500" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-500" size={20} />
                    )}
                  </button>
                  {activeAccordion === index && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Contact Support
              </h2>
              <form onSubmit={handleContactFormSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactFormChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactFormChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactFormData.subject}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={contactFormData.message}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Other Ways to Reach Us
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                    <Mail className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-700">Email</h4>
                    <p className="text-blue-600">support@yourapp.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                    <Phone className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-700">Phone</h4>
                    <p className="text-blue-600">+1 (123) 456-7890</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Monday-Friday, 9AM-6PM EST
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                    <MessageCircle className="text-blue-600" size={20} />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Live Chat
                    </h4>
                    <p className="text-gray-500">
                      Available 24/7 from your dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Support Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  User Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive guide to using all features of the application
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Read the guide →
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Video Tutorials
                </h3>
                <p className="text-gray-600 mb-4">
                  Step-by-step video guides for common tasks and features
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Watch tutorials →
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Knowledge Base
                </h3>
                <p className="text-gray-600 mb-4">
                  Explore articles and guides on specific topics and features
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Browse articles →
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  API Documentation
                </h3>
                <p className="text-gray-600 mb-4">
                  Technical documentation for developers using our API
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  View documentation →
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Community Forum
                </h3>
                <p className="text-gray-600 mb-4">
                  Connect with other users to share tips and get help
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Join discussion →
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-600">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Release Notes
                </h3>
                <p className="text-gray-600 mb-4">
                  Stay up to date with the latest features and improvements
                </p>
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Read updates →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">YourApp Support</h3>
              <p className="text-gray-300">
                We're here to help you make the most of our platform.
              </p>
            </div>
            <div className="md:text-right">
              <h3 className="text-xl font-semibold mb-4">
                Can't find what you need?
              </h3>
              <button
                onClick={() => handleTabChange("contact")}
                className="bg-white text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} YourApp. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
