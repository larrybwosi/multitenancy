// components/Partners.tsx
import React from "react";
import { motion } from "framer-motion";

const partners = [
  { name: "Swan", logo: "/partners/swan.svg" },
  { name: "Mindee", logo: "/partners/mindee.svg" },
  { name: "Lex", logo: "/partners/lex.svg" },
  { name: "Bridge", logo: "/partners/bridge.svg" },
  { name: "GoCardless", logo: "/partners/gocardless.svg" },
];

const Partners: React.FC = () => {
  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center text-xl text-gray-500 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Partnership with innovative tools
        </motion.h2>

        <motion.div
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="grayscale hover:grayscale-0 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-8 md:h-10"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;
