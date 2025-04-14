// components/Hero.tsx
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Hero: React.FC = () => {
  return (
    <section className="py-12 md:py-20 bg-white overflow-hidden relative">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <motion.div
          className="lg:w-1/2 mb-10 lg:mb-0 pr-0 lg:pr-16"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full mb-4">
            A SaaS Product Solution
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Optimize your business operations with an{" "}
            <span className="text-orange-500">all-in-one</span> Solution
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Drongo is SaaS Application for Invoicing, Pro Account, Spend &
            Expenses Management and Accounting automation.
          </p>
          <motion.a
            href="#"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-md font-medium hover:bg-orange-600 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Free Trial
          </motion.a>
        </motion.div>

        <motion.div
          className="lg:w-1/2 relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="relative z-10">
            <motion.div
              className="bg-white rounded-lg shadow-xl p-2 relative"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <Image
                src="/image1.webp"
                alt="Drongo Dashboard"
                width={500}
                height={500}
                className="rounded-md w-full"
              />
              <div className="absolute top-0 right-0 -mr-4 -mt-4 bg-orange-100 text-orange-500 px-3 py-1 rounded-full text-sm font-medium">
                Customer Invoicing
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-10 -left-10 bg-white p-3 rounded-lg shadow-lg flex items-center"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="mr-3 bg-green-100 p-2 rounded-full">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Instant Payments</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-5 top-1/2 bg-white p-3 rounded-lg shadow-lg"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="flex items-center">
                <div className="text-lg font-bold text-gray-900 mr-1">$500</div>
                <div className="text-xs text-green-500">+12% this month</div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-5 -right-5 bg-gray-900 text-white p-3 rounded-lg shadow-lg"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span className="text-sm">Pay Invoice</span>
              </div>
            </motion.div>
          </div>

          <div className="absolute -z-10 top-1/2 right-1/4 w-64 h-64 bg-green-50 rounded-full filter blur-3xl opacity-30"></div>
          <div className="absolute -z-10 bottom-1/4 left-1/3 w-40 h-40 bg-orange-50 rounded-full filter blur-3xl opacity-40"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
