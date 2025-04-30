import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Warehouse, Users, ShoppingCart, Truck, ArrowRight, Boxes, ChartBar, Award, Clock } from 'lucide-react';
import Image from 'next/image';

// Feature data
const features = [
  {
    id: 'warehousing',
    title: 'Warehousing & Stock Tracking',
    description:
      'Take control of your inventory with our advanced warehousing solution. Track stock levels in real-time, set automatic reorder points, and generate comprehensive reports to optimize your inventory management. Our intelligent forecasting helps you predict demand cycles, reducing overstock and stockouts.',
    image:
      'https://cdn.sanity.io/images/7rkl59hi/production/3b0ad0e28068da8d4b6b1fddb3078aab859a0af3-1024x1024.jpg?fm=webp&q=75&auto=format',
    imagePosition: 'left',
    icon: Warehouse,
    benefits: [
      { text: 'Real-time inventory tracking', icon: Boxes },
      { text: 'Automated stock alerts', icon: Clock },
      { text: 'Comprehensive analytics', icon: ChartBar },
    ],
  },
  {
    id: 'supplier',
    title: 'Supplier Management',
    description:
      'Strengthen relationships with your suppliers through our integrated management system. Automate purchase orders, track deliveries, and manage contracts all in one place. Our communication tools ensure you stay connected with suppliers, while performance analytics help you identify your most reliable partners.',
    image:
      'https://cdn.sanity.io/images/7rkl59hi/production/051309e7ad9d998e8f70f329ac10932d204dc185-1024x1024.jpg?fm=webp&q=75&auto=format',
    imagePosition: 'right',
    icon: Truck,
    benefits: [
      { text: 'Streamlined purchase orders', icon: ShoppingCart },
      { text: 'Supplier performance metrics', icon: ChartBar },
      { text: 'Contract management', icon: Award },
    ],
  },
  {
    id: 'pos',
    title: 'Powerful POS System',
    description:
      'Process transactions quickly and securely with our intuitive point-of-sale system. Supporting both online and offline operations, our POS integrates seamlessly with inventory and customer management. Customize receipt templates, apply discounts with ease, and access detailed sales analytics to drive business growth.',
    image:
      'https://cdn.sanity.io/images/7rkl59hi/production/339b951356c97bc928568d343b4dc7644ca84713-1024x1024.jpg?fm=webp&q=75&auto=format',
    imagePosition: 'left',
    icon: ShoppingCart,
    benefits: [
      { text: 'Online & offline functionality', icon: Award },
      { text: 'Customizable interface', icon: Users },
      { text: 'Integrated payment processing', icon: ChartBar },
    ],
  },
  {
    id: 'user',
    title: 'User Management with Tasks',
    description:
      'Empower your team with role-based access control and comprehensive task management. Assign responsibilities, track check-ins, and monitor performance through intuitive dashboards. Real-time notifications keep everyone updated, while built-in communication tools foster collaboration across departments.',
    image:
      'https://cdn.sanity.io/images/7rkl59hi/production/611aa73439faa321b9101934a06d17c099902d9f-1360x768.png?fm=webp&q=75&auto=format',
    imagePosition: 'right',
    icon: Users,
    benefits: [
      { text: 'Task assignment & tracking', icon: Clock },
      { text: 'Role-based permissions', icon: Award },
      { text: 'Team performance analytics', icon: ChartBar },
    ],
  },
];

// Individual Feature Component
const FeatureItem = ({ feature, index }: { feature: any; index: number }) => {
  const controls = useAnimation();
  const benefitsControls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.15,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
      benefitsControls.start(i => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.6 + i * 0.1, duration: 0.5 },
      }));
    }
  }, [controls, benefitsControls, inView]);

  // Content animations
  const contentVariants = {
    hidden: {
      opacity: 0,
      x: feature.imagePosition === 'left' ? -50 : 50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  // Image animations
  const imageVariants = {
    hidden: {
      opacity: 0,
      x: feature.imagePosition === 'left' ? 50 : -50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        delay: 0.2,
      },
    },
  };

  const IconComponent = feature.icon;

  return (
    <div
      ref={ref}
      className={`flex flex-col lg:flex-row items-center w-full py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 xl:px-16 ${
        index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* Content Section */}
      <motion.div
        className="w-full lg:w-1/2 mb-8 lg:mb-0 lg:px-4 xl:px-8"
        initial="hidden"
        animate={controls}
        variants={contentVariants}
      >
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 rounded-full bg-indigo-100 mb-3 sm:mb-0 sm:mr-4 inline-flex items-center justify-center">
            <IconComponent size={24} className="text-indigo-600" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{feature.title}</h3>
        </div>
        <div className="w-16 sm:w-20 h-1 bg-indigo-500 mb-4 sm:mb-6"></div>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{feature.description}</p>

        {/* Benefits List */}
        <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
          {feature.benefits.map((benefit, i) => {
            const BenefitIcon = benefit.icon;
            return (
              <motion.div
                key={i}
                className="flex items-center"
                custom={i}
                initial={{ opacity: 0, y: 20 }}
                animate={benefitsControls}
              >
                <div className="p-1.5 sm:p-2 rounded-full bg-purple-50 mr-2 sm:mr-3">
                  <BenefitIcon size={16} className="text-purple-600" />
                </div>
                <span className="text-sm sm:text-base text-gray-700">{benefit.text}</span>
              </motion.div>
            );
          })}
        </div>

        <button className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center group shadow-lg">
          Learn More
          <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </motion.div>

      {/* Image Section */}
      <motion.div
        className="w-full lg:w-1/2 px-4 sm:px-6 lg:px-4 xl:px-8"
        initial="hidden"
        animate={controls}
        variants={imageVariants}
      >
        <div className="rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300 border-4 border-purple-100">
          <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96">
            <Image
              src={feature.image}
              alt={feature.title}
              fill
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdgJc2ZXXZgAAAABJRU5ErkJggg=="
              className="object-cover"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-700/20"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main Features Section Component
const FeaturesSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 via-indigo-50 to-purple-50 w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5 pointer-events-none"
        aria-hidden="true"
      ></div>

      {/* Section Header */}
      <div
        className="container mx-auto pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-6 text-center relative"
        ref={ref}
      >
        <motion.div initial="hidden" animate={controls} variants={headerVariants}>
          <span className="inline-block px-3 sm:px-4 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            Streamline Your Operations
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Powerful Features For Your Business
          </h2>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-6 sm:mb-8"></div>
          <p className="text-lg sm:text-xl text-gray-700 max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto">
            Everything you need to manage your business efficiently in one integrated platform
          </p>

          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 22L3 10h6V2h6v8h6z"></path>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Features List */}
      <div className="container mx-auto">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className={index % 2 === 0 ? 'bg-white/50 backdrop-blur-sm' : 'bg-indigo-50/30 backdrop-blur-sm'}
          >
            <FeatureItem feature={feature} index={index} />
          </div>
        ))}
      </div>

    </section>
  );
};

export default FeaturesSection;
