//
//  NewsFeed.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import parse from 'html-react-parser';
const fake_news = [{
  id: 1,
  title: 'Marchand Eyes Sub-4:00 in 400m IM at Worlds',
  summary: 'The French superstar is reportedly hitting times in practice that suggest the first ever sub-4 minute swim is possible.',
  timeAgo: '2h ago',
  athlete: 'Léon Marchand',
  type: 'Preview',
  color: 'from-blue-600 to-indigo-700'
}, {
  id: 2,
  title: 'McIntosh Sets New Canadian Record in Trials',
  summary: 'Summer McIntosh continues her dominance with a blistering 3:56.08 in the 400m Freestyle, signaling readiness for Budapest.',
  timeAgo: '5h ago',
  athlete: 'Summer McIntosh',
  type: 'Result',
  color: 'from-red-600 to-rose-700'
}, {
  id: 3,
  title: 'Ledecky on Chasing Her 5th Olympic Gold',
  summary: 'In an exclusive interview, Katie Ledecky discusses longevity, training changes, and her mindset heading into another Olympic cycle.',
  timeAgo: '1d ago',
  athlete: 'Katie Ledecky',
  type: 'Interview',
  color: 'from-cyan-600 to-blue-600'
}, {
  id: 4,
  title: 'Dressel Returns to Competition After Break',
  summary: 'Caeleb Dressel looked sharp in his return to the pool at the Pro Swim Series, posting a competitive 50m Free time.',
  timeAgo: '2d ago',
  athlete: 'Caeleb Dressel',
  type: 'Update',
  color: 'from-emerald-600 to-teal-700'
}];
const news = [
      {
        "id": 1,
        "title": "SwimSwam’s Top 100 For 2026: Men’s #10-1",
        "url": "https://swimswam.com/swimswams-top-100-for-2026-mens-10-1/",
        "published_at": "2026-02-10T14:00:37",
        "summary": "<p>By <a href=\"https://swimswam.com/author/jamessutherland/\">James Sutherland</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"480\" src=\"https://www.swimswam.com/wp-content/uploads/2026/01/A62I6805-424x480.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"424\" />Leon Marchand's dominance continued in 2025, highlighted by his stunning world record in the 200 IM, helping land him the #1 spot for the third straight year.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/swimswams-top-100-for-2026-mens-10-1/\">SwimSwam&#8217;s Top 100 For 2026: Men&#8217;s #10-1</a></p>",
        "source": "swimswam"
      },
      {
        "id": 2,
        "title": "2025-26 NCAA Women’s Power Rankings: Pre-Conferences Edition",
        "url": "https://swimswam.com/2025-26-ncaa-womens-power-rankings-pre-conferences-edition/",
        "published_at": "2026-02-10T13:28:30",
        "summary": "<p>By <a href=\"https://swimswam.com/author/seangriffin/\">Sean Griffin</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"428\" src=\"https://www.swimswam.com/wp-content/uploads/2025/03/Claire-Curzan-By-Jack-Spitser-DSC01275-640x428.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Claire Curzan and the Virginia Cavaliers continue to hold strong at #1 in the SwimSwam Power Rankings, as they have done all season.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/2025-26-ncaa-womens-power-rankings-pre-conferences-edition/\">2025-26 NCAA Women’s Power Rankings: Pre-Conferences Edition</a></p>",
        "source": "swimswam"
      },
      {
        "id": 3,
        "title": "What We Learned by Trying a Different Model",
        "url": "https://swimswam.com/what-we-learned-by-trying-a-different-model/",
        "published_at": "2026-02-10T12:00:51",
        "summary": "<p>By <a href=\"https://swimswam.com/author/swimswam/\">SwimSwam</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"480\" src=\"https://www.swimswam.com/wp-content/uploads/2025/06/Chris-Davis-courtesy-of-Chris-Davis-626x480.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"626\" />When there is only one dominant system for youth competition and sanctioning, innovation can slow. There are other options...</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/what-we-learned-by-trying-a-different-model/\">What We Learned by Trying a Different Model</a></p>",
        "source": "swimswam"
      },
      {
        "id": 4,
        "title": "Commit Swimming Introduces Automatic Record Boards",
        "url": "https://swimswam.com/commit-swimming-introduces-automatic-record-boards/",
        "published_at": "2026-02-10T11:00:19",
        "summary": "<p>By <a href=\"https://swimswam.com/author/dandingman/\">Dan Dingman</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"410\" src=\"https://www.swimswam.com/wp-content/uploads/2015/04/Screen-Shot-2015-04-29-at-6.12.13-PM-640x410.png\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Keeping your team's record board up-to-date is now easier than ever. Commit Swimming is excited to roll out our new automated Record Board feature!</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/commit-swimming-introduces-automatic-record-boards/\">Commit Swimming Introduces Automatic Record Boards</a></p>",
        "source": "swimswam"
      },
      {
        "id": 5,
        "title": "Colorado Mesa Eyes Eighth Straight Sweep of RMAC Championships",
        "url": "https://swimswam.com/colorado-mesa-eyes-eighth-straight-sweep-of-rmac-championships/",
        "published_at": "2026-02-10T1003",
        "summary": "<p>By <a href=\"https://swimswam.com/author/swimswam/\">SwimSwam</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"358\" src=\"https://www.swimswam.com/wp-content/uploads/2026/02/Colorado-Mesa-credit-Brandon-Maffitt-640x358.webp\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />The Rocky Mountain Athletic Conference Championshipswill run from Tuesday through Saturday night and will feature nine women's and six men's squads.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/colorado-mesa-eyes-eighth-straight-sweep-of-rmac-championships/\">Colorado Mesa Eyes Eighth Straight Sweep of RMAC Championships</a></p>",
        "source": "swimswam"
      },
      {
        "id": 6,
        "title": "Norwich University Sweeps GNAC Championships for Fourth Straight Season",
        "url": "https://swimswam.com/norwich-university-sweeps-gnac-championships-for-fourth-straight-season/",
        "published_at": "2026-02-10T10:40:47",
        "summary": "<p>By <a href=\"https://swimswam.com/author/swimswam/\">SwimSwam</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"362\" src=\"https://www.swimswam.com/wp-content/uploads/2026/02/Norwich-Athletics-640x362.webp\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />The Cadets combined for 33 event victories across the three-day meet and nearly swept the league’s top individual honors.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/norwich-university-sweeps-gnac-championships-for-fourth-straight-season/\">Norwich University Sweeps GNAC Championships for Fourth Straight Season</a></p>",
        "source": "swimswam"
      },
      {
        "id": 7,
        "title": "2026 Winter Olympic Games: Major Updates, Viral Moments Through Day 4",
        "url": "https://swimswam.com/2026-winter-olympic-games-major-updates-viral-moments-through-day-4/",
        "published_at": "2026-02-10T02:23:13",
        "summary": "<p>By <a href=\"https://swimswam.com/author/nicolemiller/\">Nicole Miller</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"480\" src=\"https://www.swimswam.com/wp-content/uploads/2026/02/scottblair-olympic-738038_1280-640x480.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Team USA claimed its first medals of the 2026 Olympics, while several athletes are reporting that their medals are breaking after wearing them.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/2026-winter-olympic-games-major-updates-viral-moments-through-day-4/\">2026 Winter Olympic Games: Major Updates, Viral Moments Through Day 4</a></p>",
        "source": "swimswam"
      },
      {
        "id": 8,
        "title": "Uros Zivanovic and Zoey Zeller Shine for Tigers at Auburn Invitational",
        "url": "https://swimswam.com/uros-zivanovic-and-zoey-zeller-shine-for-tigers-at-auburn-invitational/",
        "published_at": "2026-02-09T23:58:12",
        "summary": "<p>By <a href=\"https://swimswam.com/author/terin-frodyma/\">Terin Frodyma</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"360\" src=\"https://www.swimswam.com/wp-content/uploads/2024/01/Auburn-Team-Stock-640x360.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Season and lifetime bests flooded the Auburn Invitational, led by Uros Zivanovic’s No. 5 all-time 100 breast and Zoey Zeller entering the top-10.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/uros-zivanovic-and-zoey-zeller-shine-for-tigers-at-auburn-invitational/\">Uros Zivanovic and Zoey Zeller Shine for Tigers at Auburn Invitational</a></p>",
        "source": "swimswam"
      },
      {
        "id": 9,
        "title": "Jakub Poliacik Clocks 8:56.52 VT Program Record in 1000 Free at Virginia Tech Invitational",
        "url": "https://swimswam.com/jakub-poliacik-clocks-856-52-vt-program-record-in-1000-free-at-virginia-tech-invitational/",
        "published_at": "2026-02-09T23:01:14",
        "summary": "<p>By <a href=\"https://swimswam.com/author/terin-frodyma/\">Terin Frodyma</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"427\" src=\"https://www.swimswam.com/wp-content/uploads/2026/02/Jakub-Poliacik-VT-640x427.webp\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Jakub Poliacik broke Virginia Tech’s 1000 free program record while four pool marks fell, highlighting a strong Hokie showing ahead of championship season.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/jakub-poliacik-clocks-856-52-vt-program-record-in-1000-free-at-virginia-tech-invitational/\">Jakub Poliacik Clocks 8:56.52 VT Program Record in 1000 Free at Virginia Tech Invitational</a></p>",
        "source": "swimswam"
      },
      {
        "id": 10,
        "title": "Swimming Australia Also Chooses to Bypass 2026 Youth Olympic Games",
        "url": "https://swimswam.com/swimming-australia-also-chooses-to-bypass-2026-youth-olympic-games/",
        "published_at": "2026-02-09T22:37:33",
        "summary": "<p>By <a href=\"https://swimswam.com/author/braden/\">Braden Keith</a> on <a href=\"https://swimswam.com\">SwimSwam</a></p>\n<p><img alt=\"\" class=\"attachment-large size-large wp-post-image\" height=\"427\" src=\"https://www.swimswam.com/wp-content/uploads/2025/08/Kaylee-McKeown-By-Jack-Spitser-DSC03750-640x427.jpg\" style=\"float: left; margin: 0 15px 15px 0;\" width=\"640\" />Kaylee McKeown won three individual medals and a relay medal at the last edition of the Youth Olympic Games in 2018. Australia won't send swimmers this year.</p>\n<p>Read the full story on <a href=\"https://swimswam.com\">SwimSwam</a>: <a href=\"https://swimswam.com/swimming-australia-also-chooses-to-bypass-2026-youth-olympic-games/\">Swimming Australia Also Chooses to Bypass 2026 Youth Olympic Games</a></p>",
        "source": "swimswam"
      }
    ]

export function NewsFeed() {
  // Helper function to extract plain text from HTML
  const getPlainText = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Helper function to extract image src from HTML
  const getImageSrc = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const img = temp.querySelector('img');
    return img ? img.src : null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Latest News</h2>
      <div className="space-y-4">
        {news.map((item, index) => {
          const imageSrc = getImageSrc(item.summary);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                <Card className="hover:bg-slate-800/80 transition-colors cursor-pointer group overflow-hidden border-slate-800">
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="h-32 sm:h-auto sm:w-48 flex-shrink-0 relative overflow-hidden">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-600" />
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-black/30 backdrop-blur-sm text-white border-none text-[10px]">
                          News
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                          {getPlainText(item.summary)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{item.source}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </a>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
