import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Customers Love Dealio
            </h2>
            <p className="text-gray-600 mb-10">
              We&lsquo;re honored to provide the modern invoicing digitization
              for some of the most exciting organizations in the world.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-lg md:text-xl font-medium text-gray-900 mb-6">
                &quot;Dealio has played a crucial role in scaling, building out
                and evolving our go-to-market model. It allows my team to easily
                stay on top of everything.&quot;
              </blockquote>

              <div className="flex items-center">
                <div className="mr-4">
                  <Image
                    src="https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Rachel Islam"
                    width={64}
                    height={64}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Rachel Islam</div>
                  <div className="text-gray-500 text-sm">
                    Director of Operations, Dealio & App
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:w-1/2 flex flex-col justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              &quot;Dealio has not only simplified my invoicing tasks but has
              also elevated the professionalism of my business. I highly
              recommend Dealio to any entrepreneur or business owner looking for
              an efficient and user-friendly invoicing solution.&quot;
            </h3>

            <div className="flex items-center mt-6">
              <Image
                src="https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Rachel Islam"
                width={64}
                height={64}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <div className="font-medium text-gray-900">Rachel Islam</div>
                <div className="text-gray-500 text-sm">
                  Director of Operations, Dealio & App
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
