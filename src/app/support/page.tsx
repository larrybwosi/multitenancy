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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("faq");
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I add a new tenant?",
      answer:
        "To add a new tenant, navigate to the Tenants section in your dashboard and click the 'Add Tenant' button. Fill in the required information including company name, admin contact details, and subscription plan.",
    },
    {
      question: "How do I manage user permissions?",
      answer:
        "User permissions can be managed through the Security settings for each tenant. You can assign roles like Admin, Manager, or User, and customize specific permissions for each role.",
    },
    {
      question: "How do I access billing information?",
      answer:
        "Billing information can be found in the Billing section of your tenant dashboard. Here you can view invoices, update payment methods, and manage your subscription plan.",
    },
    {
      question: "Can I switch between different tenants?",
      answer:
        "Yes, you can easily switch between tenants using the tenant selector in the top navigation bar. This allows you to manage multiple organizations from a single account.",
    },
    {
      question: "How secure is the platform?",
      answer:
        "Our platform uses enterprise-grade security measures including data encryption, regular security audits, and role-based access control. All data is isolated between tenants, and we maintain compliance with industry security standards.",
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

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit support request');
      }

      toast.success("Support request submitted successfully!");
      setContactFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.log(error)
      toast.error("Failed to submit support request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Find answers in our documentation or get in touch with our support team
          </p>
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-4 px-6 pl-12 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <Search
              className="absolute left-4 top-4 text-gray-500"
              size={24}
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
                  No results found for &quot;{searchQuery}&quot;
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
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-8">
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
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
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
              Platform Documentation
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Getting Started Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Quick start guide for setting up your first tenant and understanding core features
                </p>
                <a
                  href="/docs/getting-started"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  Read the guide <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Tenant Management
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn how to effectively manage multiple tenants and their configurations
                </p>
                <a
                  href="/docs/tenant-management"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  View guides <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Security & Compliance
                </h3>
                <p className="text-gray-600 mb-4">
                  Detailed information about our security features and compliance standards
                </p>
                <a
                  href="/docs/security"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  Learn more <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  API Documentation
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete API reference for integrating with our platform
                </p>
                <a
                  href="/docs/api"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  View API docs <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Billing & Subscriptions
                </h3>
                <p className="text-gray-600 mb-4">
                  Understanding billing cycles, invoices, and subscription management
                </p>
                <a
                  href="/docs/billing"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  Read more <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-600 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Best Practices
                </h3>
                <p className="text-gray-600 mb-4">
                  Tips and recommendations for getting the most out of the platform
                </p>
                <a
                  href="/docs/best-practices"
                  className="text-blue-600 font-medium hover:text-blue-700 flex items-center"
                >
                  View guides <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Platform Support</h3>
              <p className="text-gray-300 text-lg">
                We&apos;re here to help you succeed with your multi-tenant application.
              </p>
            </div>
            <div className="md:text-right">
              <h3 className="text-xl font-semibold mb-4">
                Need additional help?
              </h3>
              <button
                onClick={() => handleTabChange("contact")}
                className="bg-white text-gray-900 py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Contact Support Team
              </button>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} Multi-tenant Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
