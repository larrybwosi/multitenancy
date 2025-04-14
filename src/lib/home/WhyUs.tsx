import React from 'react';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hover: {
    y: -5,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.3
    }
  }
};

const FinancialManagementUI = () => {
  return (
    <div className="bg-gray-50 min-h-screen w-full p-4 md:p-8">
      {/* Features Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-orange-400 font-medium text-sm md:text-base mb-2">Our Features</h2>
            <h3 className="text-gray-700 text-xl md:text-2xl font-semibold mb-8 max-w-md">
              Powerful Features to Simplify Your Financial Management
            </h3>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            {/* Features List */}
            <div className="w-full md:w-2/5 space-y-6">
              <motion.div 
                variants={itemVariants}
                className="flex gap-3"
              >
                <div className="text-orange-400 bg-orange-100 rounded p-2 h-8 w-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Customer Invoicing</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Create and send professional invoices in seconds. Get paid online, track expenses, and get paid faster. Design simplifies the invoicing process, so you can focus on running your business.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex gap-3"
              >
                <div className="text-orange-400 bg-orange-100 rounded p-2 h-8 w-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Pro Account</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Powerful banking features like deposits, cards, and payouts.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex gap-3"
              >
                <div className="text-orange-400 bg-orange-100 rounded p-2 h-8 w-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Spend & Expenses Management</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Capture, analyze, and easily verify, approve, and process reimbursements.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex gap-3"
              >
                <div className="text-orange-400 bg-orange-100 rounded p-2 h-8 w-8 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Accounting Automation</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Build custom workflows and automate accounting tasks.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Invoice Preview */}
            <motion.div 
              variants={itemVariants}
              className="w-full md:w-3/5 mt-8 md:mt-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="bg-orange-50 p-6 rounded-xl relative">
                <motion.div 
                  className="bg-white rounded-lg shadow-sm p-4 max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-orange-500 font-semibold text-sm">Invoice #7</div>
                      <div className="text-gray-700 font-bold text-xl">$130.00</div>
                    </div>
                    <motion.div 
                      className="bg-orange-500 text-white p-2 rounded-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                    </motion.div>
                  </div>

                  <hr className="my-4 border-gray-200" />

                  <div className="mb-6 space-y-1">
                    <div className="text-gray-400 text-xs">Items</div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Website Design</span>
                      <span className="text-gray-700 font-medium">$130.00</span>
                    </div>
                  </div>

                  <motion.div 
                    className="flex justify-end"
                    whileHover={{ scale: 1.05 }}
                  >
                    <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm">Send Invoice</button>
                  </motion.div>
                </motion.div>

                {/* UI Elements on the right */}
                <motion.div 
                  className="absolute right-2 top-6 hidden md:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div 
                    className="bg-white p-2 rounded-md shadow-sm mb-2 w-24"
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="h-4 w-full bg-orange-100 rounded mb-1"></div>
                    <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                  </motion.div>
                  <motion.div 
                    className="bg-white p-2 rounded-md shadow-sm w-24"
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  >
                    <div className="h-4 w-full bg-orange-100 rounded mb-1"></div>
                    <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-orange-400 font-medium text-sm md:text-base mb-2">Why Dealio?</h2>
            <h3 className="text-gray-700 text-xl md:text-2xl font-semibold mb-10 max-w-md">
              Pioneering the Future of Payments and Finance with Cutting-Edge Technology
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm"
              whileHover="hover"
              variants={cardVariants}
            >
              <div className="bg-purple-100 w-10 h-10 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h4 className="text-purple-600 text-sm font-medium mb-2">All-in-one platform</h4>
              <p className="text-gray-600 text-sm">
                Gain an productivity with extensive features and capabilities to manage finances accurately, stay aligned with regulation.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm"
              whileHover="hover"
              variants={cardVariants}
            >
              <div className="bg-blue-100 w-10 h-10 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
                </svg>
              </div>
              <h4 className="text-blue-600 text-sm font-medium mb-2">Integration with best market tools</h4>
              <p className="text-gray-600 text-sm">
                Open banking, electronic registers, documents and OCR end AI all integrated right under our customer&apos;s control.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm"
              whileHover="hover"
              variants={cardVariants}
            >
              <div className="bg-green-100 w-10 h-10 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <h4 className="text-green-600 text-sm font-medium mb-2">Scalable solution</h4>
              <p className="text-gray-600 text-sm">
                Constantly able to keep our product up to date with a clear attention to customers and the relevance of state-of-the-art technology.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default FinancialManagementUI;