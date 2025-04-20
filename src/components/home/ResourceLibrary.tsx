import { motion } from "framer-motion";
import Image from "next/image";

const resources = [
  {
    id: 1,
    title: "5 Tips for Converting and Driving Organizational Efficiency",
    category: "Guide",
    image:
      "https://images.pexels.com/photos/8962476/pexels-photo-8962476.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  },
  {
    id: 2,
    title: "You Can Lead Better Team With Dealio",
    category: "Article",
    image:
      "https://cdn.sanity.io/files/13g5zfv2/production/3822a51b37a72cc60cd1a71995dd68e9ede80714.jpg?fm=webp&q=75&auto=format",
  },
  {
    id: 3,
    title: "Round & Beyond: Selling Through Experiences That Sell More",
    category: "Article",
    image: "https://images.pexels.com/photos/6962994/pexels-photo-6962994.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

const ResourceLibrary: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dealio Resource Library
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Unlock your marketing automation prowess with Dealio&apos;s helpful
            vault of resources.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button className="bg-black text-white px-4 py-2 rounded-md font-medium">
              All Blog
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors">
              Roadmap
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors">
              Documentation
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5 }}
            >
              <Image
                src={resource.image}
                alt={resource.title}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium rounded-full mb-3">
                  {resource.category}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                  {resource.title}
                </h3>
                <a
                  href="#"
                  className="inline-flex items-center text-orange-500 font-medium mt-2 hover:text-orange-600 transition-colors"
                >
                  Read More
                  <svg
                    className="w-4 h-4 ml-1"
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
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="#"
            className="inline-flex items-center bg-orange-50 text-orange-500 px-6 py-3 rounded-md font-medium hover:bg-orange-100 transition-colors"
          >
            See All Resources
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
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ResourceLibrary;
