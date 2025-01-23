import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, MessageCircle, TrendingUp, 
  Users, Sparkles, NotebookPen, CheckCircle, Megaphone
} from 'lucide-react';
import KlaowtReply from '../../images/KlaowtReply.svg';
import KlaowtFollow from '../../images/KlaowtFollow.svg';
import KlaowtTrend from '../../images/KlaowtTrending.svg';
import BlueskyLogo from '../../images/bluesky-logo.svg';
import KlaowtTour01 from '../../images/klaowt-quick-tour-images_01.png';
import KlaowtTour02 from '../../images/klaowt-quick-tour-images_02.png';
import KlaowtTour03 from '../../images/klaowt-quick-tour-images_03.png';
import KlaowtTour04 from '../../images/klaowt-quick-tour-images_04.png';
import KlaowtTour05 from '../../images/klaowt-quick-tour-images_05.png';

interface QuickTourFocusedProps {
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: React.ReactNode;
  image: string;
  icon: React.ReactNode;
  bgColor: string;
}

export function QuickTourFocused({ onClose }: QuickTourFocusedProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      title: "Welcome to Klaowt! 👋",
      description: (
        <div className="space-y-2">
          <p>Grow organic relationships faster on Bluesky <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-4 h-4" />.</p>
          <p>Klaowt gives you the most effective way to engage and grow your audience without spending hours endlessly scrolling.</p>
        </div>
      ),
      image: KlaowtTour01,
      icon: <Megaphone className="w-6 h-6 text-white" />,
      bgColor: "from-blue-500 to-indigo-600"
    },
    {
      title: "Start in Focused-Mode 🎯",
      description: (
        <div className="space-y-2">
          <p>Enjoy a distraction-free experience when you use Klaowt in focused-mode</p> 
            
          <p>Get your 45min daily engagement plan and start building a daily posting habit.</p>

        </div>
      ),
      image: KlaowtTour02,
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      bgColor: "from-purple-500 to-pink-600"
    },
    {
      title: "Discover Top Creators 🌟",
      description: (
        <div className="space-y-2">
          <p>Use Klaowt in browser-mode to find the right feeds & top creators in your niche.</p>
          <p>Dive into "Feed Insights" for trending posts & key creators to follow.</p>
        </div>
      ),
      image: KlaowtTour03,
      icon: <Users className="w-6 h-6 text-white" />,
      bgColor: "from-green-500 to-teal-600"
    },
    {
      title: "Turn Comments to Posts ✨",
      description: (
        <div className="space-y-2">
      <p>Turn your thoughtful comments into standalone posts with 1-click.</p>
	  <p>Use Klaowt to repurpose your old comments on days you're struggling to find new ideas.</p>
        </div>
      ),
       image: KlaowtTour04,
      icon: <NotebookPen className="w-6 h-6 text-white" />,
      bgColor: "from-orange-500 to-red-600"
    },
    {
      title: "Unlock Your Growth 🔐",
      description: (
        <div className="space-y-2">
          <p>Klaowt is the most effective way to grow genuine long-term relationships on Bluesky.</p> <p>No more endless scrolling!</p>
          <div className="flex items-center justify-left mt-4">
            <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-blue-500 text-sm font-medium">Let's start growing!</span>
          </div>
        </div>
      ),
      image: KlaowtTour05,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      bgColor: "from-blue-500 to-purple-600"
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="bg-white rounded-2xl w-full shadow-lg">
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2">
          {/* Content */}
          <div className="p-8 space-y-6">
            <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-r ${currentTourStep.bgColor}`}>
              {currentTourStep.icon}
            </div>
            
            <h2 className="text-lg font-bold">{currentTourStep.title}</h2>
            <div className="text-gray-600 text-sm space-y-4">
              {currentTourStep.description}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                {Array.from({ length: tourSteps.length }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentStep === index 
                        ? 'bg-blue-500 w-4' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex relative items-center space-x-4">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>
                )}
                
                {currentStep < tourSteps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <span className="text-sm">Next</span>
                    <ChevronRight className="w-5 h-5 text-sm ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center px-2 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <span className="text-sm">Start</span>
                    <ChevronRight className="w-5 h-5 text-sm ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative bg-gray-50 rounded-r-2xl overflow-hidden">
            <img
              src={currentTourStep.image}
              alt="Feature preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
