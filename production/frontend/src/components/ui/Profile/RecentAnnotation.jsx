import { FaRegCheckCircle } from "react-icons/fa";
import { FaImages } from "react-icons/fa6";


export default function RecentAnnotations({ annotations }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recent Annotation Activity</h2>
        <FaImages className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-3">
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex-shrink-0 mt-1">
              <FaRegCheckCircle className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{annotation.imageName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {annotation.category}
                </span>
                <span className="text-xs text-gray-500">{annotation.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium py-2 rounded-lg hover:bg-orange-50 transition-colors">
        View All Annotations →
      </button>
    </div>
  )
}
