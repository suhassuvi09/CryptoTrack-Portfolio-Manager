import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Search className="h-24 w-24 text-gray-300 dark:text-gray-600" />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg">
                404
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Home className="h-5 w-5" />
              <span>Go to Homepage</span>
            </Link>
            
            <Link
              to="/markets"
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
            >
              <Search className="h-5 w-5" />
              <span>View Markets</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;