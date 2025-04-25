'use client';
import { signIn } from '@/lib/auth/authClient';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import {use} from 'react';

type Params = Promise<{slug: string}>;
type SearchParams = Promise<{[key: string]: string | string[] | undefined}>;
 
const SigninPage = (props: {params: Params; searchParams: SearchParams}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const searchParams = use(props.searchParams)
  const callbackURL = searchParams?.callbackUrl as string | undefined;
  const router = useRouter();

  const slides = [
    {
      image:
        'https://cdn.sanity.io/images/7rkl59hi/production/d8ea510f70826369e9f7eb1b9c65bae870cdaf0c-1024x1024.jpg?fm=webp&q=75&auto=format',
      title: 'Financial Management Made Easy',
      description: 'Track expenses, send invoices, and manage your finances all in one place.',
    },
    {
      image:
        'https://cdn.sanity.io/files/13g5zfv2/production/3822a51b37a72cc60cd1a71995dd68e9ede80714.jpg?fm=webp&q=75&auto=format',
      title: 'Secure Payments',
      description: 'Process payments securely and get paid faster with multiple payment options.',
    },
    {
      image:
        'https://cdn.sanity.io/images/7rkl59hi/production/4656d361b31088139ec195fe751b64ea6d359c63-1360x768.png?fm=webp&q=75&auto=format',
      title: 'Business Insights',
      description: 'Get valuable insights into your business with detailed analytics and reports.',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {data, error} = await signIn.email({
        email,
        password,
        rememberMe,
        callbackURL
      });

      if (error) {
        throw error;
      }

      toast.success(`Welcome back ${data.user.name}`, {
        description: 'You have been logged in successfully.',
      });

      router.push('/user-profile');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Error', {
        description: 'Failed to log in. Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({provider: 'google'});

      router.push('/user-profile');
    } catch (error) {
      console.error('Error with Google sign in:', error);
      toast.error('Error', {
        description: 'Failed to sign in with Google. Please try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Image Carousel Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
          style={{transform: `translateX(-${currentSlide * 100}%)`}}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full h-full relative">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-600/90 to-orange-900/90 mix-blend-multiply"></div>
              <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: `url(${slide.image})`}}></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
                <h2 className="text-3xl font-bold mb-4 text-center">{slide.title}</h2>
                <p className="text-lg text-center max-w-md">{slide.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-6' : 'bg-white/50'
              }`}
            ></button>
          ))}
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-20">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-7 h-7 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-700">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Welcome back! Please enter your details.</p>
        </div>

        <div className="mt-8 max-w-md w-full mx-auto">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Google Sign In Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex justify-center items-center gap-3 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent py-2.5 px-4 text-sm font-medium text-white shadow-sm bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <a href="/signup" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;