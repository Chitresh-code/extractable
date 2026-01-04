import { GalleryVerticalEnd } from "lucide-react";
import { Link } from "react-router-dom";
import { RegisterForm } from "./RegisterForm";

export const Register: React.FC = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Info panel on the left */}
      <div className="bg-muted relative hidden lg:block order-2 lg:order-1">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-90" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white space-y-6 max-w-md">
            <h2 className="text-4xl font-bold">Get Started with Extractable</h2>
            <p className="text-lg text-blue-100">
              Join Extractable and start transforming your documents into
              structured data in minutes.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    Highly Accurate Extraction
                  </h3>
                  <p className="text-sm text-blue-50">
                    Multi-pass validation ensures precise table extraction from
                    your PDFs and images.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    Cost-Effective Solution
                  </h3>
                  <p className="text-sm text-blue-50">
                    Affordable pricing with transparent costs. No hidden fees or
                    surprise charges.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    Multiple Export Formats
                  </h3>
                  <p className="text-sm text-blue-50">
                    Download your extracted data as JSON, CSV, or Excel -
                    whatever works for your workflow.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Easy to Use</h3>
                  <p className="text-sm text-blue-50">
                    Simple, intuitive interface. No technical expertise required
                    - just upload and extract.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Form on the right */}
      <div className="flex flex-col gap-4 p-6 md:p-10 order-1 lg:order-2">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Extractable
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
};
