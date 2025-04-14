// components/Features.tsx
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Features: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features to Simplify Your Financial Management
          </h2>
          <p className="text-gray-600 max-w-2xl">
            Create and send professional invoices effortlessly, ensuring prompt
            payments and improving cash flow.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/image2.jpg"
              alt="Dealio Dashboard Features"
              width={400}
              height={300}
              className="rounded-lg shadow-xl w-[500px]"
            />
          </motion.div>

          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Create and send professional invoices in seconds. Customize
              templates, track...
            </h3>

            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <motion.div
                  key={item}
                  className="flex items-start"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * item }}
                >
                  <div className="bg-orange-100 p-2 rounded-full mr-4 mt-1">
                    <svg
                      className="w-5 h-5 text-orange-500"
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
                    <h4 className="font-medium text-gray-900 mb-1">
                      Professional Invoice Templates
                    </h4>
                    <p className="text-gray-600">
                      Choose from a variety of professional invoice templates or
                      customize your own to match your brand identity.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="#"
              className="inline-flex items-center text-orange-500 font-medium mt-8 hover:text-orange-600 transition-colors"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              See all Features
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
