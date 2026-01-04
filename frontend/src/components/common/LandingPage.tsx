import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const LandingPage: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return null // Don't show landing page if user is logged in
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Extractable
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-6 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            AI-Powered Table Extraction
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Extract Tables from
            </span>
            <br />
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              PDFs & Images
            </span>
            <br />
            <span className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Instantly
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your PDFs and images into structured data with AI-powered table extraction.
            Get accurate, formatted results in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Why Choose Extractable?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to extract structured data from documents
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900">Lightning Fast</h3>
            <p className="text-slate-600 leading-relaxed">
              Extract tables from PDFs and images in seconds with our AI-powered pipeline. No more manual data entry.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900">Highly Accurate</h3>
            <p className="text-slate-600 leading-relaxed">
              Multi-pass validation ensures you get the most accurate table extraction results with context-aware processing.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900">Multiple Formats</h3>
            <p className="text-slate-600 leading-relaxed">
              Export your data as JSON, CSV, or Excel - whatever format works best for your workflow.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 lg:px-8 py-24 bg-linear-to-br from-slate-50 to-blue-50/50 rounded-3xl my-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A simple 5-step process to extract structured data
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto relative">
          {[
            { num: 1, title: 'Upload', desc: 'Upload your PDF or image files' },
            { num: 2, title: 'Extract', desc: 'AI extracts tables automatically' },
            { num: 3, title: 'Validate', desc: 'Multi-pass validation ensures accuracy' },
            { num: 4, title: 'Refine', desc: 'Final consolidation and refinement' },
            { num: 5, title: 'Download', desc: 'Get your structured data' },
          ].map((step, idx) => (
            <div key={step.num} className="text-center relative">
              <div className="mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto font-bold text-xl shadow-lg">
                  {step.num}
                </div>
              </div>
              {idx < 4 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-linear-to-r from-blue-600/50 to-indigo-600/50 -z-10" />
              )}
              <h3 className="font-bold text-lg mb-2 text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 lg:px-8 py-24 text-center">
        <div className="max-w-3xl mx-auto bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-16 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of users extracting tables with Extractable
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 md:mb-0">
              Extractable
            </div>
            <div className="text-sm text-slate-600">
              &copy; 2024 Extractable. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
