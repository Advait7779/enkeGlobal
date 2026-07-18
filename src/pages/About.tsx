import { CheckCircle, Award, Users, Globe } from "lucide-react";
import Logo from "../../public/RequiredImages/Logo.jpeg";

export default function About() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-emerald-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            About eNKe Global Enterprises
          </h1>
          <p className="text-xl text-emerald-100">
            Leading supplier of industrial equipment since 2024
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Enke Global enterprises is the Nigeria based company, situated at
              Sango Ogun state, supplying quality industrial spares, imported
              directly from OEM across the Globe. Our major customers are from
              Printing & Packaging industries in Africa.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              We are keeping stock of items imported from{" "}
              <strong> Germany, Italy, USA, SA & India</strong>. All material
              regularly purchased direct from OEM and authorised dealers only,
              for reliability and best quality. Most Important- We offer in
              local currency which is more convenient to customers.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Technical Support- We can support technically for Flexible
              Packaging Industry for diagnosis, trouble-shooting, part selection
              and retro fitting. We would like to have business relationship
              with you and work for your venture. <br />
              <strong>We are available 24x7</strong>
            </p>
          </div>
          <div className="rounded-lg overflow-hidden">
            <img
              src={Logo}
              alt="Industrial equipment"
              className="w-full h-screen object-cover"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-12 mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-emerald-700 text-white p-4 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Quality Assured
              </h3>
              <p className="text-gray-600">
                All products meet international quality standards and
                certifications
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-700 text-white p-4 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Expert Team
              </h3>
              <p className="text-gray-600">
                Knowledgeable staff ready to help with technical support and
                advice
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-700 text-white p-4 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Wide Distribution
              </h3>
              <p className="text-gray-600">
                Nationwide presence with an efficient delivery network.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-700 text-white p-4 rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Trusted Partner
              </h3>
              <p className="text-gray-600">
                Three of experience serving thousands of satisfied clients
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-l-4 border-blue-500 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Integrity
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We operate with honesty and transparency in all our business
                dealings, ensuring fair pricing and genuine products.
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-500 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Innovation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We stay at the forefront of industry trends, continually
                updating our product range with the latest technology.
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-500 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Excellence
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We strive for excellence in every aspect of our business, from
                product quality to customer service.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-200 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Get in touch with our team to discuss your industrial equipment
            needs
          </p>
          <a
            href="/contact"
            className="bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium text-lg hover-bg-blue transition-colors inline-block"
          >
            Contact Us Today
          </a>
        </div>
      </div>
    </main>
  );
}
