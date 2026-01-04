import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Upload, Bot, CheckCircle2, Sparkles, Download } from 'lucide-react'

export const LandingPage: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return null // Don't show landing page if user is logged in
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Extractable
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 lg:px-8 pt-16 pb-20 text-center relative">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-linear-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200/50 shadow-sm animate-fade-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>AI-Powered Table Extraction</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight">
            <span className="block bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Extract Tables from{' '}
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                PDFs & Images
              </span>
            </span>
            <span className="block bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Transform unstructured documents into structured data with our advanced AI pipeline.
            <span className="block mt-2 text-lg text-slate-500">
              Get accurate, formatted results in multiple formats - no manual work required.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10">Start Free Trial</span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 font-semibold text-lg shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 lg:px-8 py-24 relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Why Choose Extractable?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to extract structured data from documents
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              gradient: 'from-green-500 to-emerald-600',
              title: 'Cost-Effective',
              description: 'Affordable pricing that scales with your needs. No hidden fees or expensive enterprise plans - just straightforward, transparent pricing.',
            },
            {
              icon: (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              gradient: 'from-blue-500 to-cyan-600',
              title: 'Highly Accurate',
              description: 'Multi-pass validation ensures you get the most accurate table extraction results with context-aware processing and error detection.',
            },
            {
              icon: (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
              gradient: 'from-purple-500 to-pink-600',
              title: 'User-Friendly',
              description: 'Simple, intuitive interface that anyone can use. No technical expertise required - just upload your files and get results.',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group relative bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`w-16 h-16 bg-linear-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 lg:px-8 py-24 relative">
        <div className="bg-linear-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 rounded-3xl p-12 md:p-16 shadow-xl border border-slate-200/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A simple 5-step process to extract structured data
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6 max-w-6xl mx-auto relative">
            {[
              { num: 1, title: 'Upload', desc: 'Upload your PDF or image files', icon: Upload },
              { num: 2, title: 'Extract', desc: 'AI extracts tables automatically', icon: Bot },
              { num: 3, title: 'Validate', desc: 'Multi-pass validation ensures accuracy', icon: CheckCircle2 },
              { num: 4, title: 'Refine', desc: 'Final consolidation and refinement', icon: Sparkles },
              { num: 5, title: 'Download', desc: 'Get your structured data', icon: Download },
            ].map((step, idx) => (
              <div key={step.num} className="text-center relative group">
                <div className="mb-6 relative">
                  <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto font-bold text-2xl shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                    {step.num}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                {idx < 4 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-1 bg-linear-to-r from-blue-600/30 via-indigo-600/30 to-blue-600/30 -z-10 rounded-full" />
                )}
                <h3 className="font-bold text-xl mb-2 text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 lg:px-8 py-24 text-center">
        <div className="max-w-4xl mx-auto relative">
          <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 opacity-20">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
                Start extracting tables from your documents today. Simple, accurate, and affordable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 hover:bg-white/10 transition-all duration-300 font-semibold text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Extractable
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <a href="#" className="hover:text-blue-600 transition-colors duration-200">
                Privacy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors duration-200">
                Terms
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors duration-200">
                Support
              </a>
            </div>
            <div className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} Extractable. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
