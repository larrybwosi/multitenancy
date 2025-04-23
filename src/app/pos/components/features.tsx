import React, { useState, useEffect } from 'react';
import { Globe, Zap, PieChart } from 'lucide-react';

const DealioFeatures = () => {
  const [animateSection, setAnimateSection] = useState(false);
  
  useEffect(() => {
    setAnimateSection(true);
  }, []);

  const features = [
    {
      icon: <Zap className="h-12 w-12 text-purple-500" />,
      title: "All-in-one Platform",
      description: "Gain POS productivity with innovative features and intuitive user experience in one place. Stay aligned with regulations."
    },
    {
      icon: <PieChart className="h-12 w-12 text-blue-500" />,
      title: "Integration with best market tools",
      description: "Gain productivity with innovative features and intuitive user experience in one place. Stay aligned with regulations."
    },
    {
      icon: <Globe className="h-12 w-12 text-green-500" />,
      title: "Scalable solution",
      description: "Continually strive to keep our product up to date with a clear roadmap and startup spirit with the assurance of state-of-the-art technology."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg">
      <div className={`transition-opacity duration-1000 ${animateSection ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-center mb-12">
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Why Dealio?</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Pioneering the Future of Payments and Finance with Cutting-Edge Technology
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center text-center transition-all duration-700 transform ${
                animateSection 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="mb-4 bg-gray-50 p-4 rounded-full">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button 
            className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
              animateSection ? 'translate-y-0 opacity-100 hover:scale-105' : 'translate-y-10 opacity-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            Get Started with Dealio
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealioFeatures;