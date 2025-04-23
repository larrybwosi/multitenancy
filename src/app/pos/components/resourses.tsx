import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const DealioResourceLibrary = () => {
  const [activeTab, setActiveTab] = useState('Article');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const resourceCards = [
    {
      id: 1,
      image: "/image1",
      title: "Building out and evolving our go-to-market model.",
      type: "Article"
    },
    {
      id: 2,
      image: "/image2",
      title: "5 Tips for Collecting and Managing Organizational Knowledge",
      type: "Article"
    },
    {
      id: 3,
      image: "/image3",
      title: "You Can Lead Better Team Meetings",
      type: "Article"
    },
    {
      id: 4,
      image: "/image1",
      title: "Beyond & Beyond: Selling Payment Experiences That Sell More",
      type: "Article"
    }
  ];

  const filteredResources = activeTab === 'All' 
    ? resourceCards 
    : resourceCards.filter(card => card.type === activeTab);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-lg shadow-sm">
      <div className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Dealio Resource Library</h1>
          <p className="text-gray-600">
            Unlock your payment automation powers with Dealio's helpful library of resources.
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          {['Article', 'Roadmap', 'Documentation'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-black text-white font-medium' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((resource, index) => (
            <div 
              key={resource.id} 
              className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute top-0 left-0 bg-orange-500 text-white px-2 py-1 text-xs">
                  {resource.type}
                </div>
                <img 
                  src={resource.image} 
                  alt={resource.title} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 hover:text-orange-500 transition-colors duration-300">
                  {resource.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-300 transform hover:scale-105">
            <span>See All Resources</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealioResourceLibrary;