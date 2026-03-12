// shows current world records

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAthletes } from '../api/athletes'; // Adjust path as needed

interface Record {
  event: string;
  time: string;
  athlete: string;
  athleteSlug: string;
  country: string;
  flag: string;
  date: string;
  location: string;
}


async function getAthleteSlug(athleteName: string): Promise<string | null> {
  try {
    const response = await getAthletes({ q: athleteName, limit: 1 });
    if (response?.athletes && response.athletes.length > 0) {
      return response.athletes[0].slug;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch slug for ${athleteName}:`, error);
    return null;
  }
}

// Use it to update records with slugs
async function enrichRecordsWithSlugs(records: Record[]): Promise<Record[]> {
  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const slug = await getAthleteSlug(record.athlete);
      return {
        ...record,
        athleteSlug: slug || null,// record.athlete.toLowerCase().replace(/\s+/g, '-'), // Fallback
      };
    })
  );
  return enrichedRecords;
}

const MENS_RECORDS: Record[] = [
  { event: '50m Freestyle', time: '20.91', athlete: 'César Cielo', athleteSlug: 'cesar-cielo', country: 'Brazil', flag: '🇧🇷', date: '2009-12-18', location: 'São Paulo, Brazil' },
  { event: '100m Freestyle', time: '46.80', athlete: 'Pan Zhanle', athleteSlug: 'pan-zhanle', country: 'China', flag: '🇨🇳', date: '2024-07-31', location: 'Paris, France' },
  { event: '200m Freestyle', time: '1:42.00', athlete: 'Paul Biedermann', country: 'Germany', flag: '🇩🇪', date: '2009-07-28', location: 'Rome, Italy' },
  { event: '400m Freestyle', time: '3:40.07', athlete: 'Paul Biedermann', country: 'Germany', flag: '🇩🇪', date: '2009-07-26', location: 'Rome, Italy' },
  { event: '800m Freestyle', time: '7:32.12', athlete: 'Zhang Lin', country: 'China', flag: '🇨🇳', date: '2009-07-29', location: 'Rome, Italy' },
  { event: '1500m Freestyle', time: '14:31.02', athlete: 'Sun Yang', country: 'China', flag: '🇨🇳', date: '2012-08-04', location: 'London, UK' },
  { event: '50m Backstroke', time: '22.22', athlete: 'Kliment Kolesnikov', country: 'Russia', flag: '🇷🇺', date: '2021-11-21', location: 'Kazan, Russia' },
  { event: '100m Backstroke', time: '51.60', athlete: 'Thomas Ceccon', country: 'Italy', flag: '🇮🇹', date: '2022-08-13', location: 'Rome, Italy' },
  { event: '200m Backstroke', time: '1:51.92', athlete: 'Aaron Peirsol', country: 'USA', flag: '🇺🇸', date: '2009-07-31', location: 'Rome, Italy' },
  { event: '50m Breaststroke', time: '25.95', athlete: 'Adam Peaty', country: 'Great Britain', flag: '🇬🇧', date: '2017-07-25', location: 'Budapest, Hungary' },
  { event: '100m Breaststroke', time: '56.88', athlete: 'Adam Peaty', country: 'Great Britain', flag: '🇬🇧', date: '2019-07-21', location: 'Gwangju, South Korea' },
  { event: '200m Breaststroke', time: '2:05.95', athlete: 'Zac Stubblety-Cook', country: 'Australia', flag: '🇦🇺', date: '2022-05-21', location: 'Budapest, Hungary' },
  { event: '50m Butterfly', time: '22.27', athlete: 'Nicholas Santos', country: 'Brazil', flag: '🇧🇷', date: '2018-12-16', location: 'Hangzhou, China' },
  { event: '100m Butterfly', time: '49.45', athlete: 'Caeleb Dressel', country: 'USA', flag: '🇺🇸', date: '2021-07-31', location: 'Tokyo, Japan' },
  { event: '200m Butterfly', time: '1:50.73', athlete: 'Kristóf Milák', country: 'Hungary', flag: '🇭🇺', date: '2019-07-24', location: 'Gwangju, South Korea' },
  { event: '200m Individual Medley', time: '1:54.00', athlete: 'Ryan Lochte', country: 'USA', flag: '🇺🇸', date: '2011-07-28', location: 'Shanghai, China' },
  { event: '400m Individual Medley', time: '4:03.84', athlete: 'Michael Phelps', country: 'USA', flag: '🇺🇸', date: '2008-08-10', location: 'Beijing, China' },
];

const WOMENS_RECORDS: Record[] = [
  { event: '50m Freestyle', time: '23.67', athlete: 'Sarah Sjöström', country: 'Sweden', flag: '🇸🇪', date: '2017-07-29', location: 'Budapest, Hungary' },
  { event: '100m Freestyle', time: '51.71', athlete: 'Sarah Sjöström', country: 'Sweden', flag: '🇸🇪', date: '2017-07-23', location: 'Budapest, Hungary' },
  { event: '200m Freestyle', time: '1:52.85', athlete: 'Federica Pellegrini', country: 'Italy', flag: '🇮🇹', date: '2009-07-29', location: 'Rome, Italy' },
  { event: '400m Freestyle', time: '3:56.40', athlete: 'Katie Ledecky', country: 'USA', flag: '🇺🇸', date: '2016-08-07', location: 'Rio de Janeiro, Brazil' },
  { event: '800m Freestyle', time: '8:04.79', athlete: 'Katie Ledecky', country: 'USA', flag: '🇺🇸', date: '2016-08-12', location: 'Rio de Janeiro, Brazil' },
  { event: '1500m Freestyle', time: '15:20.48', athlete: 'Katie Ledecky', country: 'USA', flag: '🇺🇸', date: '2018-05-16', location: 'Indianapolis, USA' },
  { event: '50m Backstroke', time: '26.98', athlete: 'Liu Xiang', country: 'China', flag: '🇨🇳', date: '2018-10-26', location: 'Budapest, Hungary' },
  { event: '100m Backstroke', time: '57.33', athlete: 'Kaylee McKeown', country: 'Australia', flag: '🇦🇺', date: '2023-07-28', location: 'Fukuoka, Japan' },
  { event: '200m Backstroke', time: '2:03.35', athlete: 'Kaylee McKeown', country: 'Australia', flag: '🇦🇺', date: '2023-07-28', location: 'Fukuoka, Japan' },
  { event: '50m Breaststroke', time: '29.30', athlete: 'Benedetta Pilato', country: 'Italy', flag: '🇮🇹', date: '2021-05-15', location: 'Budapest, Hungary' },
  { event: '100m Breaststroke', time: '1:04.13', athlete: 'Lilly King', country: 'USA', flag: '🇺🇸', date: '2017-07-25', location: 'Budapest, Hungary' },
  { event: '200m Breaststroke', time: '2:17.55', athlete: 'Tatjana Schoenmaker', country: 'South Africa', flag: '🇿🇦', date: '2021-07-30', location: 'Tokyo, Japan' },
  { event: '50m Butterfly', time: '24.43', athlete: 'Sarah Sjöström', country: 'Sweden', flag: '🇸🇪', date: '2014-07-05', location: 'Borås, Sweden' },
  { event: '100m Butterfly', time: '55.48', athlete: 'Sarah Sjöström', country: 'Sweden', flag: '🇸🇪', date: '2016-08-07', location: 'Rio de Janeiro, Brazil' },
  { event: '200m Butterfly', time: '2:01.81', athlete: 'Liu Zige', country: 'China', flag: '🇨🇳', date: '2009-10-21', location: 'Jinan, China' },
  { event: '200m Individual Medley', time: '2:06.12', athlete: 'Kaylee McKeown', country: 'Australia', flag: '🇦🇺', date: '2023-07-28', location: 'Fukuoka, Japan' },
  { event: '400m Individual Medley', time: '4:26.36', athlete: 'Katie Ledecky', country: 'USA', flag: '🇺🇸', date: '2016-06-26', location: 'Omaha, USA' },
];

export function RecordsPage() {
  const [gender, setGender] = useState<'mens' | 'womens'>('mens');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrichedMensRecords, setEnrichedMensRecords] = useState<Record[]>([]);
  const [enrichedWomensRecords, setEnrichedWomensRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const mensWithSlugs = await enrichRecordsWithSlugs(MENS_RECORDS);
      const womensWithSlugs = await enrichRecordsWithSlugs(WOMENS_RECORDS);
      setEnrichedMensRecords(mensWithSlugs);
      setEnrichedWomensRecords(womensWithSlugs);
      setLoading(false);
    })();
  }, []);

  const currentRecords = gender === 'mens' ? enrichedMensRecords : enrichedWomensRecords;
  
  const filteredRecords = currentRecords.filter(r =>
    r.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.athlete.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
    
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">World Records</h1>
          </div>
          <p className="text-slate-400">
            Current long course (50m) world records in competitive swimming
          </p>
        </div>

        {/* Tabs and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Gender Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setGender('mens')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                gender === 'mens'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Men's Records
            </button>
            <button
              onClick={() => setGender('womens')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                gender === 'womens'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              Women's Records
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search events, athletes, countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No records found matching your search</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <motion.tr
                      key={record.event}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">{record.event}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-amber-400 font-mono text-lg">
                          {record.time}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{record.flag}</span>
                          <div>
                            {record.athleteSlug ? (
                              <Link
                                to={`/athletes/${record.athleteSlug}`}
                                className="text-white font-medium hover:text-cyan-400 transition-colors cursor-pointer"
                              >
                                {record.athlete}
                              </Link>
                            ) : (
                              <div className="relative group inline-block">
                                <span className="text-white font-medium cursor-not-allowed">
                                  {record.athlete}
                                </span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950 text-slate-300 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700">
                                  Profile not available
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                </div>
                              </div>
                            )}
                            <div className="text-slate-400 text-sm">{record.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {record.location}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>All times are from Long Course Meters (LCM) competitions • Updated regularly</p>
        </div>
      </div>
    </div>
  );
}
