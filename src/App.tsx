import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Layout, LogIn, LogOut, UserSearch, Radio, MessageCircle, BarChart2, Activity, KeyRound, ChevronDown, ChevronUp} from 'lucide-react';
import { Bookmark } from 'lucide-react';
import { CircleChevronUp } from 'lucide-react';
import { Handshake } from 'lucide-react';
import { BookmarkCheck } from 'lucide-react';
import { Megaphone } from 'lucide-react';
import { Podcast } from 'lucide-react';
import { Volume2 } from 'lucide-react';
import { LoginModal } from './components/LoginModal';
import { GrowAudienceModal } from './components/profile/GrowAudienceModal';
import { FeedsGrid } from './components/FeedsGrid';
import ProfilePanel from './components/profile/ProfilePanel';
import { CreateFeedComponent } from './components/feeds/CreateFeedComponent';
import { useAuthStore } from './auth';
import { useFeeds } from './hooks/useFeeds';
import { useSuggestedFeeds } from './hooks/useSuggestedFeeds';
import { useCustomFeeds } from './hooks/useCustomFeeds';
import { Feed } from './types/feed';
import { getPinnedFeeds } from './utils/preferences';
import BlueskyLogo from './images/bluesky-logo.svg';
import KlaowtTrend from './images/KlaowtTrending.svg';
import KlaowtNoshare from './images/KlaowtNoshare.svg';
import KlaowtReply from './images/KlaowtReply.svg';
import KlaowtFollow from './images/KlaowtFollow.svg';
import KlaowtActivity from './images/KlaowtActivity.svg';


function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, logout, agent, setLoginSuccessHandler } = useAuthStore();
  const { feeds: popularFeeds, loading: popularLoading, error: popularError } = useFeeds();
  const { feeds: suggestedFeeds, loading: suggestedLoading, error: suggestedError } = useSuggestedFeeds();
  const { customFeeds, addCustomFeed } = useCustomFeeds();
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [feedType, setFeedType] = useState<'popular' | 'suggested' | 'create' | 'pinned'>('popular');
  const [pinnedFeedUris, setPinnedFeedUris] = useState<Set<string>>(new Set());
const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isGrowModalOpen, setIsGrowModalOpen] = useState(false);
  //const [isAuthenticated, setLoginSuccessHandler] = useAuthStore();

// Set up login success handler
  React.useEffect(() => {
    if (setLoginSuccessHandler) {
      setLoginSuccessHandler(() => {
        setIsGrowModalOpen(true);
      });
    }
  }, [setLoginSuccessHandler]);


  // Fetch pinned feeds when feedType changes to 'pinned'
  React.useEffect(() => {
    async function fetchPinnedFeeds() {
      if (!agent || feedType !== 'pinned') return;
      const pinned = await getPinnedFeeds(agent);
      setPinnedFeedUris(pinned);
    }
    fetchPinnedFeeds();
  }, [agent, feedType]);

const faqData = [
  {
    id: 1,
    question: "What is Klaowt?",
    answer: "Klaowt is your Bluesky engagement optimization tool that helps you grow your audience by finding and engaging only with trending posts and relevant creators without spending all day doomscrolling. Klaowt helps you move beyond simply broadcasting content and empowers you to build real relationships on Bluesky."
  },
  {
    id: 2,
    question: "Do I need a Bluesky account?",
    answer: <>
      {"Yes, you'll need a Bluesky account and app password to start using Klaowt. "} <br/>
<a href="https://bsky.app/settings/app-passwords" className="text-blue-500 underline">Click here</a> to setup your Bluesky App Password. 
      </>
  },
  {
    id: 3,
    question: "How is Klaowt different to Bluesky?",
    answer:"While Bluesky provides the basic tools for posting and engaging, Klaowt instantly presents the content and creators relevant to your niche, saving you significant time and effort. It's designed to help you engage more effectively than you could on your own."
  },
  {
    id: 4,
    question: "What can I try while Klaowt is in Beta?",
    answer:<>{"During our Beta period, you'll get full access to all of Klaowt's core features, allowing you to experience the complete platform and see how it can transform your Bluesky engagement."}</>
  },
  {
    id: 5,
    question: "Is Klaowt safe to use?",
    answer:
      <>
        {"Yes, Klaowt is designed to be safe and compliant with Bluesky's terms of service. We do not automate actions in a way that could be considered spam or bot-like activity. Klaowt simply facilitates genuine engagement by making it easier and more efficient."} <br/><br/> 
        
        {" We emphasize building genuine connections and participating in relevant conversations. We strongly advise against using any automation tools that violate Bluesky's terms."} <br/><br/> 
          
        {"During our Beta period, you'll get full access to all of Klaowt's core features, allowing you to experience the complete platform and see how it can transform your Bluesky engagement."}
      </>
  },
   {
    id: 8,
    question: "Still have Questions?",
    answer:
      <>
        {"No problem, reach out directly to me on Bluesky "} <a href="https://bsky.app/profile/oluadedeji.bsky.social" className="text-blue-500 underline">@oluadedeji.bsky.social</a> 
      </>
  },
  // ... etc for all 8 FAQs
];

  
  const currentFeeds = (() => {
    switch (feedType) {
      case 'suggested':
        return suggestedFeeds;
      case 'pinned': {
        // Filter feeds to show only pinned ones
        const customCategoryFeeds = customFeeds.filter(feed => feed.category === 'Custom');
        const followingFeed = popularFeeds.find(feed => feed.uri === 'following');
        const pinnedFeeds = popularFeeds.filter(feed => 
          feed.uri !== 'following' && pinnedFeedUris.has(feed.uri)
        );
        
        return [
          ...(followingFeed ? [followingFeed] : []),
          ...customCategoryFeeds,
          ...pinnedFeeds
        ].map((feed, index) => ({
          ...feed,
          uniqueId: `${feed.uri}-${index}`
        }));
      }
      case 'create':
        return [];
      default: {
        // Filter and combine feeds by category
        const customCategoryFeeds = customFeeds.filter(feed => feed.category === 'Custom');
        const followingFeed = popularFeeds.find(feed => feed.uri === 'following');
        const otherFeeds = popularFeeds.filter(feed => feed.uri !== 'following');
        
        return [
          ...(followingFeed ? [followingFeed] : []),
          ...customCategoryFeeds,
          ...otherFeeds
        ].map((feed, index) => ({
          ...feed,
          uniqueId: `${feed.uri}-${index}`
        }));
      }
    }
  })();

  const isLoading = (() => {
    switch (feedType) {
      case 'suggested':
        return suggestedLoading;
      case 'pinned':
        return popularLoading;
      default:
        return popularLoading;
    }
  })();

  const error = (() => {
    switch (feedType) {
      case 'suggested':
        return suggestedError;
      case 'pinned':
        return popularError;
      default:
        return popularError;
    }
  })();

  const handleFeedTypeChange = (type: 'popular' | 'suggested' | 'create' | 'pinned') => {
    setFeedType(type);
  };

  const handleCreateFeedComplete = (newFeed?: Feed) => {
    if (newFeed) {
      addCustomFeed(newFeed);
    }
    setFeedType('popular');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-blue-50 to-indigo-75">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/*<Bookmark className="w-8 h-8 p-1.5 font-light fill-white stroke-white bg-gradient-to-r from-blue-400 to-indigo-600 rounded" />*/}
              <Megaphone className="w-8 h-8 p-1.5 font-light stroke-white bg-gradient-to-r from-blue-400 to-indigo-600 rounded" />
              {/*<h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Klaowt!</h1>*/}
              <h1 className="text-xl font-bold bg-blue-500 bg-clip-text text-gray-900">Klaowt</h1>
              {/*<span className="text-gray-800 px-2 bg-yellow-400 rounded font-bold"> beta </span>*/}
            </div>
            <button
              onClick={() => isAuthenticated ? logout() : setIsLoginModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl max-h-7xl mx-auto px-4 py-12">
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-4">Grow Organic Relationships <br/> Faster on Bluesky
              <br/> 
              {/*<span className="text-5xl mt-2">with just 30 mins a day</span>*/}
    </h1> 
            {/*<p className="text-gray-600 font-md mb-8 text-lg">Stop wasting time doomscrolling, comment faster on relevant posts to boost your visibility and grow your audience. </p>*/}
             <p className="text-gray-600 font-md mb-8 text-base">Discover trending posts & engage effortlessly with active profiles in your niche. <br/> Follow relevant creators to build your brand and grow your audience on Bluesky <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-3.5 h-3.5" />  </p>  
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Start for Free 🥳
            </button>
  {/* Start Hero Image */}
  <div className="max-w-4xl mx-auto">
    <img 
      src={KlaowtTrend} 
      alt="Klaowt Analytics Dashboard"
      className="w-full h-auto rounded-lg shadow-lg"
    />
  </div>
        {/*End Hero Image*/}

{/* Start New Section */}
<div className="mt-16 text-center">
  <span className="mb-2 bg-blue-50 text-lg border-1 rounded-full text-blue-600 mt-16"> Here's the Problem . . .😓 </span>
  <h2 className="text-4xl font-bold bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent">
    Building a Bluesky Audience <br/> from Scratch is hard. 
  </h2>
  {/* Start NoShare Image */}
  <div className="max-w-4xl mx-auto">
    <img 
      src={KlaowtNoshare} 
      alt="Bluesky Posts No Engagement"
      className="w-half h-auto rounded-lg "
    />
  </div> {/*End NoShare Image*/}
  

  {/*Start Simple Div Blue Background*/}
  <div className="text-center bg-gradient-to-r from-blue-75 via-blue-50 to-blue-50 text-5xl py-12 rounded-md">
      <span className="mb-2 bg-blue-50 text-lg border-1 rounded-full text-gray-700"> We have the Solution . . .🙌 </span>
<h2 className="text-4xl font-bold mt-10 text-gray-500">
  <>
    Discover{' '}
    <span className="text-blue-500">Klaowt</span>
    {', the only social media support '}
    <br />
    {'you need to nurture relationships on Bluesky '}
        <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-8 h-8 align-middle" />
  </>
</h2>
</div> {/*End Simple Div Blue Background*/}   
</div> {/* End New Section */}   

    {/* Start Features Section */}
<div className="mt-16 px-4 max-w-7xl mx-auto">
  {/*<span className="mb-2 px-2 bg-blue-50 text-lg border border-blue-100 rounded-full text-blue-600 mt-16 mb-5"> Product Overview 🎁</span>*/}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      
    {/* Left Column - Text Content */}
    <div className="space-y-6">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent text-left">
        Boost your visibility and engage seamlessly with viral posts in your niche
      </h3>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Smart Engagement</h4>
            <p className="text-gray-600 text-sm text-left">
              Instantly find viral and trending posts your target audience is engaging with. Quickly join the conversation, boost your visibility, and grow your Bluesky following organically. 
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Real-Time Analytics</h4>
            <p className="text-gray-600 text-sm text-left">
              Stop relying on outdated data. Klaowt's post analytics gives you an instant view of the likes, comments, follows, and other key engagement metrics across the top posts. See what others are engaging with in specific feeds, and engage immediately with each post to grow your network. Track your progress and optimize your approach so that you're seen by more people.
            </p>
          </div>
        </div> 
      </div>
    </div>

    {/* Right Column - Image */}
    <div className="relative">
      <img 
        src={KlaowtReply}
        alt="Klaowt Reply Analytics Features"
        className="rounded-lg shadow-xl"
      />
      <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-6 py-2 rounded-full text-sm">
        Real-time insights
      </div>
    </div> {/*End - 1st Feature Section*/}

  {/* Left Column - Image */}
    <div className="relative">
      <img 
        src={KlaowtFollow}
        alt="Klaowt Influencer Follow"
        className="rounded-lg shadow-xl"
      />
      <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-6 py-2 rounded-full text-sm">
        Influencer Finder
      </div>
    </div>
    
 {/* Right Column - Text Content */}
    <div className="space-y-6">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent text-left">
        No more doomscrolling, connect with key influencers instantly
      </h3>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <KeyRound className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Unlock Creators</h4>
            <p className="text-gray-600 text-sm text-left">
              Gain instant access to a curated list of top creators and content contributors in your specific area of interest. Find your tribe without wasting time scrolling endlessly. 
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Podcast className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Influencer Suggestions</h4>
            <p className="text-gray-600 text-sm text-left">
              Discover new influencers and expand your reach by connecting with relevant accounts suggested to you by Klaowt. Grow your audience effortlessly through top creators you're already engaging with. 
            </p>
          </div>
        </div>
      </div>
    </div> {/*End - 2nd Feature Section*/}

    {/* Left Column - Text Content */}
    <div className="space-y-6">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent text-left">
        Prime your audience and boost your Bluesky reach with our Pre-Post activity tracker. 
      </h3>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Activity Pulse</h4>
            <p className="text-gray-600 text-sm text-left">
              Don't post and ghost. Use our hourly activity tracker to ensure you've been engaging with your audience, building relationships, and fostering a true sense of community.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Handshake className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-left">Relationship Builder</h4>
            <p className="text-gray-600 text-sm text-left">
              Get more from every post with Klaowt. Connect easily with relevant creators and influencers. Like, comment, and follow interesting accounts before and after sharing your content. Track your activity with the Engagement Meter.
            </p>
          </div>
        </div> 
      </div>
    </div>

    {/* Right Column -- Image */}
    <div className="relative">
      <img 
        src={KlaowtActivity}
        //src={KlaowtTrend}
        alt="Klaowt Activity Features"
        className="rounded-lg shadow-xl"
      />
      <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-6 py-2 rounded-full text-sm">
        Engagement Meter
      </div>
    </div> {/*End - 3rd Feature Section*/}
    
  </div>
</div>
{/* End Features Section*/}
        
{/* Start FAQ Section */}
<div className="mt-16 px-4 max-w-7xl mx-auto">
  {/*<span className="mb-2 px-2 bg-blue-50 text-lg border border-blue-100 rounded-full text-blue-600">FAQ 🤔</span>*/}
  <h2 className="text-4xl font-bold mt-4 mb-8 bg-gradient-to-r from-black via-blue-500 to-indigo-500 bg-clip-text text-transparent">
    Frequently Asked Questions
  </h2>
  
  {/*<div className="space-y-4 px-60">*/}
  <div className="space-y-4 px-4 sm:px-6 md:px-12 lg:px-60">
 
    {faqData.map((faq) => (
      <div key={faq.id} className="rounded-xl overflow-hidden">
        <button
          onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
          className="flex items-center justify-between w-full p-4 text-left bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <span className="text-lg font-semibold">{faq.question}</span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${
              activeFaq === faq.id ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div 
          className={`transition-all duration-500 ease-in-out ${
            activeFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <p className="p-4 text-gray-600 bg-blue-50 text-sm text-left">{faq.answer}</p>
        </div>
      </div>
    ))}
  </div>
</div>
{/*End - FAQ Frequently Asked Questions*/}   

{/*Start Simple Call to Action*/}
  <div className="text-center text-5xl py-12 rounded-md">
<h2 className="text-4xl font-bold mt-10 text-gray-500">
  <>
    Ready to{' '}
    <span className="text-blue-500">Grow your Audience</span>
    {' on Bluesky? '}
        <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-8 h-8 align-middle" />
  </>
</h2>

</div> {/*End Call to Action*/}              

    <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Get Started for Free 🥳
            </button>

{/* Start Footer - Full Foot Breakdown */}

<footer className="mt-24 border-t border-gray-300 text-left">
  <div className="max-w-7xl mx-auto px-4 py-12">
    <div className="grid grid-cols-4 gap-8">
      {/* Company Info */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          {/*<Megaphone className="w-6 h-6 text-blue-500" />*/}
          <Megaphone className="w-8 h-8 p-1.5 font-light stroke-white bg-gradient-to-r from-blue-400 to-indigo-600 rounded" />
          <span className="font-bold text-xl">Klaowt</span>
        </div>
        <p className="text-sm text-left text-gray-600">
         The smart solution for audience builders on Bluesky <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-3 h-3 align-middle" />.
        </p> 
        <div className="flex space-x-4">
          {/* Social links */}
        </div>
      </div>

      {/* Product Links */}
      <div>
        <h3 className="font-semibold mb-4">Product</h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li>Features</li>
          <li>Pricing</li>
          <li>Beta Access</li>
          <li>Roadmap</li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="font-semibold mb-4">Resources</h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li>Blog</li>
          <li>Documentation</li>
          <li>Support</li>
          <li>FAQ</li>
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
          <li>Cookie Policy</li>
        </ul>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>© 2024 Klaowt.com All rights reserved.</p>
        <div className="flex space-x-6">
          <span>Made with ❤️ for the Bluesky community</span>
          <a href="https://bsky.app/profile/oluadedeji.bsky.social" className="text-blue-500 hover:text-blue-600">
            @oluadedeji.bsky.social
          </a>
        </div>
      </div>
    </div>
  </div>
</footer>

                        
</div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading feeds...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProfilePanel onFeedTypeChange={handleFeedTypeChange} />
              </div>
            </div>
            <div className="lg:col-span-3">
              {feedType === 'create' ? (
                <CreateFeedComponent onBack={handleCreateFeedComplete} />
              ) : (
            
                <FeedsGrid
                  title={
                    feedType === 'suggested' ? 'Suggested Feeds' :
                    feedType === 'pinned' ? 'Pinned Feeds' :
                    'Popular Feeds' 
                  }
                  
                  feeds={currentFeeds}
                  selectedFeed={selectedFeed}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      {/*Adding GrowAudienceModal Here*/}
    <GrowAudienceModal 
  isOpen={isGrowModalOpen}
  onClose={() => setIsGrowModalOpen(false)}
/>
      
    </div>
  );
}

export default App;