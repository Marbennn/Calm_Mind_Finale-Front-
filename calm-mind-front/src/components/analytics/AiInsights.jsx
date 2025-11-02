import React from 'react';
import Card from '../HoverCard';

export default function AiInsights({ weeklyStress, stressChange, mostStressfulDay, recommendation }) {
  const isStressIncreased = stressChange > 0;

  return (
    <Card className="w-full px-6 py-4 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span role="img" aria-label="AI">🤖</span>
          AI Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <div className="flex items-start gap-2">
            <div className="text-sm">
              <div className="text-gray-600 dark:text-gray-400">Weekly Average Stress</div>
              <div className="font-semibold text-lg">
                {weeklyStress}%
                <span className={`ml-2 text-sm ${isStressIncreased ? 'text-red-500' : 'text-green-500'}`}>
                  {isStressIncreased ? '↑' : '↓'}{Math.abs(stressChange)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="text-sm">
              <div className="text-gray-600 dark:text-gray-400">Most Stressful Day</div>
              <div className="font-semibold text-lg">{mostStressfulDay}</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="text-sm">
              <div className="text-gray-600 dark:text-gray-400">AI Recommendation</div>
              <div className="font-semibold">{recommendation}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}