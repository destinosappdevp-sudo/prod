import React from "react";

export interface Banner {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  url?: string;
  clientPhone?: string;
  clientEmail?: string;
  cost?: number;
  imageUrl: string;
}

interface BannerListProps {
  banners: Banner[];
}

export default function BannerList({ banners }: BannerListProps) {
  if (!banners.length) {
    return <p>No hay banners registrados.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {banners.map((banner) => (
        <div key={banner.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-40 object-cover rounded mb-2" />
          <h2 className="font-bold text-lg mb-1">{banner.title}</h2>
          <p className="text-sm text-gray-500 mb-1">{banner.startDate} - {banner.endDate}</p>
          {banner.url && <a href={banner.url} className="text-blue-600 text-sm mb-1" target="_blank" rel="noopener noreferrer">{banner.url}</a>}
          <div className="text-xs text-gray-400 mt-auto">
            Cliente: {banner.clientEmail || banner.clientPhone || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
