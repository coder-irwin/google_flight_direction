'use client';

import { Sparkles, TrendingDown, TrendingUp, Info, Activity, ShieldAlert } from 'lucide-react';

interface PriceTierDetail {
  carrierType: 'low-cost' | 'standard' | 'premium';
  airline: string;
  basePrice: number;
  baggageFee: number;
  seatSelectionFee: number;
  mealIncluded: boolean;
  totalEstimatedCost: number;
  amenities: string[];
}

interface PriceAnalyticsProps {
  analytics: {
    dealScore: number;
    cheapestTier: PriceTierDetail;
    premiumTier: PriceTierDetail;
    priceTrend: 'rising' | 'falling' | 'stable';
    loungeAvailability: {
      hasLounge: boolean;
      loungeName?: string;
      entryCost?: number;
    };
  };
}

export default function PriceAnalytics({ analytics }: PriceAnalyticsProps) {
  const { dealScore, cheapestTier, premiumTier, priceTrend, loungeAvailability } = analytics;

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-500 animate-pulse" size={20} />
          <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">AI Price & Flight Analytics</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100/50">
          <Activity size={12} />
          <span>Score: {dealScore}/100</span>
        </div>
      </div>

      {/* Side-by-Side Comparisons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Low-Cost Tier */}
        <div className="bg-gray-50/70 hover:bg-gray-50 border border-gray-100/60 p-3 rounded-xl flex flex-col gap-2 transition-all">
          <span className="text-[10px] uppercase font-bold text-gray-400">Budget Carrier</span>
          <h4 className="font-semibold text-gray-700 text-xs truncate">{cheapestTier.airline}</h4>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-gray-800">₹{cheapestTier.totalEstimatedCost}</span>
            <span className="text-[9px] text-gray-400">est. total</span>
          </div>
          <div className="text-[9px] text-gray-500 space-y-1 mt-1 border-t border-gray-200/50 pt-2">
            <div>Baggage Fee: ₹{cheapestTier.baggageFee}</div>
            <div>Meals: Not included</div>
          </div>
        </div>

        {/* Premium Luxury Tier */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 hover:from-indigo-50/80 border border-indigo-100/40 p-3 rounded-xl flex flex-col gap-2 transition-all">
          <span className="text-[10px] uppercase font-bold text-indigo-500">Luxury Premium</span>
          <h4 className="font-semibold text-indigo-900 text-xs truncate">{premiumTier.airline}</h4>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-indigo-950">₹{premiumTier.totalEstimatedCost}</span>
            <span className="text-[9px] text-indigo-500">all-inclusive</span>
          </div>
          <div className="text-[9px] text-indigo-600/90 space-y-1 mt-1 border-t border-indigo-200/30 pt-2">
            <div>Baggage: 30kg Incl.</div>
            <div>Meals: Gourmet hot meal</div>
          </div>
        </div>
      </div>

      {/* Travel Trend & Lounge Insights */}
      <div className="flex flex-col gap-2 bg-gray-50/40 border border-gray-100/40 p-3 rounded-xl text-xs">
        <div className="flex items-center justify-between text-gray-600">
          <span className="flex items-center gap-1.5 font-medium text-gray-500">
            <Info size={14} className="text-blue-500" />
            Price Trend
          </span>
          <span className={`flex items-center gap-1 font-bold ${
            priceTrend === 'falling' ? 'text-green-600' : priceTrend === 'rising' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {priceTrend === 'falling' ? <TrendingDown size={14} /> : priceTrend === 'rising' ? <TrendingUp size={14} /> : null}
            {priceTrend === 'falling' ? 'Price dropping (Book soon!)' : priceTrend === 'rising' ? 'Price surging' : 'Stable prices'}
          </span>
        </div>

        {loungeAvailability.hasLounge && (
          <div className="flex items-center gap-2 border-t border-gray-100/80 pt-2 mt-1 text-indigo-950">
            <ShieldAlert size={14} className="text-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-indigo-800">
              Lounge Available: <span className="underline">{loungeAvailability.loungeName}</span> (₹{loungeAvailability.entryCost})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
