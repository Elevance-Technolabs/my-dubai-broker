"use client";

import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { Images, X } from "lucide-react";

interface PropertyGalleryProps {
  images: string[];
}

const PropertyGallery = ({ images }: PropertyGalleryProps) => {
  const [showAll, setShowAll] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showAll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAll]);

  // Ensure we have at least 5 images, fill with placeholders if needed
  const displayImages = [...images];
  while (displayImages.length < 5) {
    displayImages.push("/images/placeholder.jpg");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 h-[400px] md:h-[600px] gap-2">
        {/* Main large image */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <img
            src={displayImages[0]}
            alt="Property Main View"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side grid */}
        <div className="hidden md:block col-span-1 row-span-1 relative group">
          <img
            src={displayImages[1]}
            alt="Property View 2"
            className="w-full h-full object-cover transition-transform duration-500"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative group">
          <img
            src={displayImages[2]}
            alt="Property View 3"
            className="w-full h-full object-cover transition-transform duration-500"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative group">
          <img
            src={displayImages[3]}
            alt="Property View 4"
            className="w-full h-full object-cover transition-transform duration-500"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative group">
          <img
            src={displayImages[4]}
            alt="Property View 5"
            className="w-full h-full object-cover transition-transform duration-500"
          />
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <Button
          variant="outlineWhite"
          className="bg-light text-slate-900 border-none rounded-sm hover:bg-white hover:scale-105 shadow-md backdrop-blur-sm"
          onClick={() => setShowAll(true)}
        >
          View all photos
        </Button>
      </div>

      {/* Full Gallery Modal */}
      {showAll && (
        <div className="fixed inset-0 z-100 bg-white overflow-y-auto">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-canela text-slate-900">Property Photos</h2>
            <button
              onClick={() => setShowAll(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
          </div>

          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={img}
                    alt={`Property Photo ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
