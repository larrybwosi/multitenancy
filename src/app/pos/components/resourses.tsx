import React, { useState } from "react";
import { ArrowRight, Clock, Calendar, Construction } from "lucide-react";
import { motion } from "framer-motion";

const DealioResourceLibrary = () => {
  const [activeTab, setActiveTab] = useState("Article");

  const resourceCards = [
    {
      id: 1,
      image:
        "https://cdn.sanity.io/images/7rkl59hi/production/6cb9644f1097655ee6403c787d01b5f95125ce3d-1024x1024.jpg?fm=webp&q=75&auto=format",
      title: "Building out and evolving our go-to-market model.",
      type: "Article",
      size: "large",
    },
    {
      id: 2,
      image:
        "https://cdn.sanity.io/images/7rkl59hi/production/90692709b593f4ddb6765bf69aab47f46e78b1b1-1339x905.jpg?fm=webp&q=75&auto=format",
      title: "5 Tips for Collecting and Managing Organizational Knowledge",
      type: "Article",
      size: "small",
    },
    {
      id: 3,
      image:
        "https://cdn.sanity.io/images/7rkl59hi/production/268227fc15ce6649987521cc372b9e77cff78583-1360x768.png?fm=webp&q=75&auto=format",
      title: "You Can Lead Better Team Meetings",
      type: "Article",
      size: "small",
    },
    {
      id: 4,
      image:
        "https://cdn.sanity.io/images/7rkl59hi/production/d355b7754e20f32b88357ca13a52473550a9389e-1248x832.png?fm=webp&q=75&auto=format",
      title: "Beyond & Beyond: Selling Payment Experiences That Sell More",
      type: "Article",
      size: "small",
    },
  ];

  const roadmapItems = [
    {
      id: 1,
      title: "Analytics Dashboard",
      description: "Advanced user behavior tracking and visualization tools",
      date: "Q2 2025",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Mobile App Integration",
      description: "Seamless connection between web and mobile platforms",
      date: "Q3 2025",
      status: "Planning",
    },
    {
      id: 3,
      title: "AI-Powered Recommendations",
      description: "Smart content suggestions based on user behavior",
      date: "Q4 2025",
      status: "Research",
    },
  ];

  const getContent = () => {
    switch (activeTab) {
      case "Article":
        return resourceCards;
      case "Roadmap":
        return roadmapItems;
      case "Documentation":
        return "coming-soon";
      default:
        return filteredResources;
    }
  };

  const contentToDisplay = getContent();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: { type: "spring", stiffness: 400 },
    },
    tap: { scale: 0.95 },
  };

  const imageHoverVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto p-6 bg-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Dealio Resource Library</h1>
        <p className="text-gray-600">
          Unlock your marketing automation powers with Dealio&apos;s helpful
          library of resources.
        </p>
      </motion.div>

      <motion.div
        className="flex justify-center space-x-2 mb-8"
        variants={itemVariants}
      >
        {["Article", "Roadmap", "Documentation"].map((tab) => (
          <motion.button
            key={tab}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === tab
                ? "bg-black text-white font-medium"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === "Article" && (
        <motion.div className="mb-10">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-2"
            variants={containerVariants}
          >
            {/* Large card (first item) */}
            {contentToDisplay.length > 0 && (
              <motion.div
                className="md:col-span-1 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all relative"
                variants={itemVariants}
                whileHover="hover"
              >
                <div className="relative h-80 md:h-full overflow-hidden">
                  <motion.img
                    src={contentToDisplay[0].image}
                    alt={contentToDisplay[0].title}
                    className="w-full h-full object-cover"
                    variants={imageHoverVariants}
                  />
                  <div className="absolute bottom-0 left-0 p-4 bg-white bg-opacity-90 w-full">
                    <div className="text-orange-500 text-sm font-medium mb-2">
                      {contentToDisplay[0].type}
                    </div>
                    <h3 className="font-bold text-lg">
                      {contentToDisplay[0].title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Gap between left and right columns */}
            <div className="hidden md:block"></div>

            {/* Right column with small cards */}
            <div className="md:col-span-1 space-y-4">
              {contentToDisplay.slice(1, 4).map((resource, index) => (
                <motion.div
                  key={resource.id}
                  className="flex bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  variants={itemVariants}
                  whileHover="hover"
                >
                  <motion.div className="w-1/3 relative overflow-hidden">
                    <motion.img
                      src={resource.image}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      variants={imageHoverVariants}
                    />
                  </motion.div>
                  <div className="w-2/3 p-4">
                    <div className="text-orange-500 text-sm font-medium mb-1">
                      {resource.type}
                    </div>
                    <h3 className="font-medium text-sm md:text-base">
                      {resource.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "Roadmap" && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {roadmapItems.map((item) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all p-6 border-l-4 border-orange-500"
              variants={itemVariants}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 300 },
              }}
            >
              <div className="flex items-center mb-4">
                <Calendar size={20} className="text-orange-500 mr-2" />
                <span className="text-gray-600 font-medium">{item.date}</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center text-sm">
                <Clock size={16} className="text-blue-500 mr-2" />
                <span className="text-blue-500 font-medium">{item.status}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === "Documentation" && (
        <motion.div
          className="mb-10 flex justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg overflow-hidden shadow-md p-10 text-center max-w-lg w-full"
            variants={itemVariants}
            whileHover={{
              y: -5,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <motion.div
              className="bg-white rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
              whileHover={{ rotate: 10, scale: 1.05 }}
            >
              <Construction size={32} className="text-orange-500" />
            </motion.div>
            <h3 className="font-bold text-2xl mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              Our documentation center is currently under development.
              We&apos;re working hard to bring you comprehensive guides and
              resources.
            </p>
            <motion.button
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md inline-flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Get Notified</span>
              <ArrowRight size={16} className="ml-2" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      <motion.div className="flex justify-center mt-8" variants={itemVariants}>
        <motion.button
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center space-x-2"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <span>See All Resources</span>
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default DealioResourceLibrary;
