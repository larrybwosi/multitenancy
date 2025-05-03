// components/Navbar.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MotionDiv, MotionNav } from "../motion";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MotionNav
      className="sticky top-0 z-50 bg-white shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Image src="/logo-icon.png" alt="Dealio" width={100} height={80} className="w-fit h-10" />
          <span className="ml-2 text-xl font-bold text-orange-500">Dealio</span>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-700 hover:text-orange-500">
            Home
          </a>
          <div className="relative group">
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 flex items-center"
            >
              Features <span className="ml-1">▾</span>
            </a>
          </div>
          <div className="relative group">
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 flex items-center"
            >
              Resources <span className="ml-1">▾</span>
            </a>
          </div>
          <a href="#" className="text-gray-700 hover:text-orange-500">
            Our Offers
          </a>
          <a href="#" className="text-gray-700 hover:text-orange-500">
            About
          </a>
          <a href="#" className="text-gray-700 hover:text-orange-500">
            Pricing
          </a>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <a href="/login" className="text-orange-500 hover:text-orange-600">
            Log In
          </a>
          <a
            href="/signup"
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition duration-300"
          >
            Get Started
          </a>
        </div>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <MotionDiv
          className="md:hidden bg-white py-4 px-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col space-y-3">
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              Features
            </a>
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              Resources
            </a>
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              Our Offers
            </a>
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-orange-500 py-2">
              Pricing
            </a>
            <div className="pt-2 flex flex-col space-y-3">
              <a
                href="/login"
                className="text-orange-500 hover:text-orange-600 py-2"
              >
                Log In
              </a>
              <Link
                href="/signup"
                className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300 text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </MotionDiv>
      )}
    </MotionNav>
  );
};

export default Navbar;
