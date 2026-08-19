import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db, rtdb } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, push, set, onValue } from 'firebase/database';
import axios from 'axios';
import {
  Flame,
  Film,
  Box,
  Video,
  Clapperboard,
  Tv,
  PlayCircle,
  Globe,
  Compass,
  Sparkles,
  Zap,
  Heart,
  Palette,
  Search,
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Users,
  Image as ImageIcon,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Send,
  ListFilter,
  X,
  MessageCircle,
  BookOpen,
  User,
  Layers,
  Trash2
} from 'lucide-react';

// All API calls go through Bot Server proxy — API key never exposed to browser
const BOT_SERVER_URL = 'https://chama-whatsapp-bot-server-5f9b1c87273d.herokuapp.com';
const PROXY_URL = `${BOT_SERVER_URL}/api/proxy`;
const PROXY_SECRET = 'chama_proxy_x9k2m8v3n1';

// Set secret token globally for all axios requests to proxy
const proxyAxios = axios.create({
  headers: { 'X-Proxy-Token': PROXY_SECRET }
});

// Helper: build proxy URL (hides API key)
function apiCall(path, params = {}) {
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${PROXY_URL}?path=${encodeURIComponent(path)}${qs ? '&' + qs : ''}`;
}

// ==========================================
// BROWSER URL SYNC HELPERS (SPA ROUTING)
// ==========================================
function updateBrowserUrl(params = {}, pageTitle = '') {
  const url = new URL(window.location.origin + window.location.pathname);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, val);
    }
  });
  const finalUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
  window.history.pushState(params, '', finalUrl);
  if (pageTitle) document.title = pageTitle;
}

// ==========================================
// ALL 22 SITES CONFIG WITH ANIMATED ICONS
// ==========================================
const SITES = [
  { id: 'all',             label: 'All Sites',        Icon: Flame,        color: '#f97316' },
  { id: 'sinhalasub',      label: 'SinhalaSub',       Icon: Film,         color: '#10b981' },
  { id: 'moviebox',        label: 'MovieBox',         Icon: Box,          color: '#6366f1' },
  { id: 'cinesubz',        label: 'CineSubz',         Icon: Video,        color: '#ec4899' },
  { id: 'baiscope',        label: 'Baiscope',         Icon: Clapperboard, color: '#f59e0b' },
  { id: 'lksub',           label: 'LKSub',            Icon: Tv,           color: '#14b8a6' },
  { id: 'mflix',           label: 'Mflix',            Icon: PlayCircle,   color: '#ef4444' },
  { id: 'subz',            label: 'Subz',             Icon: Layers,       color: '#8b5cf6' },
  { id: 'cineru',          label: 'Cineru',           Icon: Globe,        color: '#0ea5e9' },
  { id: 'piratelk',        label: 'PirateLK',         Icon: Compass,      color: '#64748b' },
  { id: 'cinemx',          label: 'CineMx',           Icon: Sparkles,     color: '#06b6d4' },
  { id: 'animost',         label: 'Animost',          Icon: Zap,          color: '#a855f7' },
  { id: 'animeclub',       label: 'AnimeClub',        Icon: Heart,        color: '#f43f5e' },
  { id: 'sinhalacartoons', label: 'SinhalaCartoons',  Icon: Palette,      color: '#84cc16' },
];

// Top search sites for "All" mode
const ALL_SEARCH_SITES = ['sinhalasub', 'moviebox', 'cinesubz', 'cineru', 'animost', 'baiscope', 'lksub'];

// ==========================================
// HELPERS
// ==========================================
// Known languages dictionary (ISO codes and full names)
const LANG_MAP = {
  en: 'English', eng: 'English', english: 'English',
  si: 'Sinhala', sin: 'Sinhala', sinhala: 'Sinhala',
  ta: 'Tamil', tam: 'Tamil', tamil: 'Tamil',
  hi: 'Hindi', hin: 'Hindi', hindi: 'Hindi',
  te: 'Telugu', tel: 'Telugu', telugu: 'Telugu',
  ml: 'Malayalam', mal: 'Malayalam', malayalam: 'Malayalam',
  ar: 'Arabic', ara: 'Arabic', arabic: 'Arabic',
  es: 'Spanish', spa: 'Spanish', spanish: 'Spanish',
  fr: 'French', fre: 'French', fra: 'French', french: 'French',
  de: 'German', ger: 'German', deu: 'German', german: 'German',
  it: 'Italian', ita: 'Italian', italian: 'Italian',
  pt: 'Portuguese', por: 'Portuguese', portuguese: 'Portuguese',
  ru: 'Russian', rus: 'Russian', russian: 'Russian',
  ja: 'Japanese', jpn: 'Japanese', japanese: 'Japanese',
  ko: 'Korean', kor: 'Korean', korean: 'Korean',
  zh: 'Chinese', chi: 'Chinese', zho: 'Chinese', chinese: 'Chinese',
  id: 'Indonesian', ind: 'Indonesian', indonesian: 'Indonesian',
  th: 'Thai', tha: 'Thai', thai: 'Thai',
  vi: 'Vietnamese', vie: 'Vietnamese', vietnamese: 'Vietnamese',
  tr: 'Turkish', tur: 'Turkish', turkish: 'Turkish',
  ms: 'Malay', may: 'Malay', msa: 'Malay', malay: 'Malay',
  fil: 'Filipino', tl: 'Tagalog', tagalog: 'Tagalog',
  bn: 'Bengali', ben: 'Bengali', bengali: 'Bengali',
  ur: 'Urdu', urd: 'Urdu', urdu: 'Urdu',
  pl: 'Polish', pol: 'Polish', polish: 'Polish',
  nl: 'Dutch', dut: 'Dutch', nld: 'Dutch', dutch: 'Dutch',
  sv: 'Swedish', swe: 'Swedish', swedish: 'Swedish',
  fa: 'Persian', per: 'Persian', fas: 'Persian', persian: 'Persian', farsi: 'Persian'
};

function parseDownloads(rawList = []) {
  if (!Array.isArray(rawList)) return { videos: [], subs: [] };
  const videos = [];
  const subs = [];

  rawList.forEach(d => {
    const url = d.link || d.url || d.direct_link || '';
    const fullName = (d.name || d.title || d.label || '').trim();
    const nameLower = fullName.toLowerCase();
    const qualityField = (d.quality || '').trim().toUpperCase();

    // Detect subtitle entries
    const isSub = qualityField === 'SUB'
      || qualityField === 'SUBTITLE'
      || nameLower.includes('subtitle')
      || nameLower.includes('- srt')
      || nameLower.includes('subtitles -')
      || nameLower.startsWith('sub_')
      || (url && (url.endsWith('.srt') || url.endsWith('.ass') || url.endsWith('.vtt') || url.includes('/sub/')));

    if (isSub) {
      // 1. Check explicit language fields
      let detectedLang = '';
      const explicitLang = (d.language || d.lang || d.sub_lang || d.locale || '').toLowerCase().trim();
      if (explicitLang && LANG_MAP[explicitLang]) {
        detectedLang = LANG_MAP[explicitLang];
      }

      // 2. Extract from fullName (e.g. "English", "Arabic (auto)", "Subtitles - Sinhala via Baiscope", "Sinhala Subtitle")
      if (!detectedLang) {
        // Direct match with name (e.g. "English", "Spanish")
        const nameClean = fullName.replace(/[\(\)\[\]_\-]/g, ' ').trim().toLowerCase();
        for (const [key, val] of Object.entries(LANG_MAP)) {
          const regex = new RegExp(`\\b${key}\\b`, 'i');
          if (regex.test(nameClean)) {
            detectedLang = val;
            break;
          }
        }
      }

      // 3. Extract from URL if still not found (e.g. /sub/avatar_en.srt or /si.srt)
      if (!detectedLang && url) {
        const urlLower = url.toLowerCase();
        for (const [key, val] of Object.entries(LANG_MAP)) {
          if (urlLower.includes(`_${key}.`) || urlLower.includes(`-${key}.`) || urlLower.includes(`/${key}/`)) {
            detectedLang = val;
            break;
          }
        }
      }

      // 4. Extract source (e.g. Baiscope, Cineru, SinhalaSub, LKSubs, CineSubz)
      const viaMatch = fullName.match(/via\s+([\S]+)/i);
      let source = '';
      if (viaMatch) {
        let raw = viaMatch[1].trim().replace(/\/$/, '');
        if (raw.includes('baiscope')) source = 'Baiscope';
        else if (raw.includes('cineru')) source = 'Cineru';
        else if (raw.includes('sinhalasub')) source = 'SinhalaSub';
        else if (raw.includes('cinesubz')) source = 'CineSubz';
        else if (raw.includes('baiscopedownloads')) source = 'BaiscopeDL';
        else if (raw.includes('lksubs')) source = 'LKSubs';
        else if (raw.includes('telegram')) source = 'Telegram';
        else if (raw.includes('google')) source = 'Google Drive';
        else source = raw.split('.')[0];
      }

      // 5. Fallback logic: If from Sri Lankan source or Sinhala subtitle site, default to Sinhala
      if (!detectedLang) {
        if (source || nameLower.includes('sinhala') || nameLower.includes('lk') || nameLower.includes('cineru') || nameLower.includes('baiscope')) {
          detectedLang = 'Sinhala';
        } else {
          // If fullName is a short title (not 'SRT' or 'ZIP' or 'Download')
          const NON_NAMES = ['srt', 'ass', 'sub', 'vtt', '----', 'n/a', 'zip', 'download', 'file', 'movie file', 'movie'];
          if (fullName && !NON_NAMES.includes(nameLower)) {
            detectedLang = fullName;
          } else {
            detectedLang = 'Sinhala';
          }
        }
      }

      const label = source ? `${detectedLang} — ${source}` : `${detectedLang} Subtitle`;
      subs.push({ label, url, lang: detectedLang, source });
      return;
    }

    // Extract quality label
    let qualityLabel = '';
    let sizeLabel = d.size || '';

    if (qualityField && qualityField !== 'N/A') {
      qualityLabel = qualityField;
    } else {
      const qMatch = fullName.match(/(4K|2160p|UHD|FHD\s*1080p|1080p|HD\s*720p|720p|SD\s*480p|480p|360p|HD|SD|FHD)/i);
      qualityLabel = qMatch ? qMatch[1].trim() : 'Auto';
    }

    if (!sizeLabel) {
      const sizeMatch = fullName.match(/\(([\d.]+\s*(?:GB|MB|KB))\)/i);
      if (sizeMatch) sizeLabel = sizeMatch[1];
    }

    qualityLabel = qualityLabel
      .replace(/FHD\s*(1080p)/i, '1080p FHD')
      .replace(/HD\s*(720p)/i, '720p HD')
      .replace(/SD\s*(480p)/i, '480p SD')
      .trim();

    const serverMatch = fullName.match(/via\s+([\w\s]+?)(?:\s*$|\))/i);
    const server = serverMatch ? serverMatch[1].trim() : '';

    videos.push({
      label: qualityLabel,
      size: sizeLabel,
      server,
      url,
      name: fullName
    });
  });

  const seen = new Set();
  const uniqueVideos = videos.filter(v => {
    if (!v.url || seen.has(v.url)) return false;
    seen.add(v.url);
    return true;
  });

  return { videos: uniqueVideos, subs };
}

function formatPhone(raw) {
  let p = raw.replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '94' + p.substring(1);
  return p;
}

function getQualityBadgeColor(label = '') {
  const l = label.toUpperCase();
  if (l.includes('4K') || l.includes('2160')) return '#f97316';
  if (l.includes('1080') || l.includes('FHD')) return '#10b981';
  if (l.includes('720') || l.includes('HD')) return '#3b82f6';
  if (l.includes('480') || l.includes('SD')) return '#8b5cf6';
  return '#6b7280';
}

// ==========================================
// COMPONENTS
// ==========================================

function StarRating({ rating }) {
  const r = parseFloat(rating) || 0;
  const stars = Math.round(r / 2);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= stars ? '#facc15' : 'transparent'}
          color={i <= stars ? '#facc15' : '#475569'}
          style={{ filter: i <= stars ? 'drop-shadow(0 0 4px rgba(250,204,21,0.45))' : 'none' }}
        />
      ))}
      <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px', fontWeight: '700' }}>
        {r > 0 ? `${r}/10` : 'N/A'}
      </span>
    </div>
  );
}

function GenrePill({ genre }) {
  const clean = genre.replace(/[#.]/g, '').trim();
  if (!clean || clean.length < 2) return null;
  return (
    <span style={{
      padding: '4px 12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '20px',
      fontSize: '11px',
      color: '#cbd5e1',
      fontWeight: '600',
      letterSpacing: '0.3px',
      transition: 'all 0.2s'
    }}>{clean}</span>
  );
}

function CastCard({ actor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '76px' }}>
      <img
        src={actor.image || 'https://via.placeholder.com/60x60?text=?'}
        alt={actor.name}
        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        onError={e => e.target.src = 'https://via.placeholder.com/60x60?text=?'}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#e2e8f0', lineHeight: '1.2' }}>{actor.name}</div>
        {actor.role && actor.role !== 'N/A' && (
          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.2' }}>{actor.role}</div>
        )}
      </div>
    </div>
  );
}

function QualityButton({ item, selected, onClick }) {
  const isSelected = selected?.url === item.url;
  const color = getQualityBadgeColor(item.label);
  return (
    <button
      onClick={() => onClick(item)}
      style={{
        padding: '10px 16px',
        borderRadius: '12px',
        border: isSelected ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.08)',
        background: isSelected ? `${color}25` : 'rgba(255,255,255,0.03)',
        color: isSelected ? color : '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center',
        minWidth: '95px',
        flex: '0 0 auto',
        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
        boxShadow: isSelected ? `0 4px 20px ${color}33` : 'none'
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {isSelected && <Sparkles size={12} color={color} />}
        {item.label}
      </div>
      {item.size && <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{item.size}</div>}
    </button>
  );
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  const [query, setQuery] = useState('');
  const [site, setSite] = useState('all');
  const [movies, setMovies] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Detail view
  const [detailMovie, setDetailMovie] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // TV seasons/episodes
  const [tvSeasons, setTvSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [tvEpDownloads, setTvEpDownloads] = useState({ videos: [], subs: [] });
  const [loadingEpDl, setLoadingEpDl] = useState(false);

  // Quality & subtitle
  const [downloads, setDownloads] = useState({ videos: [], subs: [] });
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // Request modal
  const [showRequest, setShowRequest] = useState(false);
  const [phone, setPhone] = useState(() => localStorage.getItem('chama_phone') || '');
  const [sending, setSending] = useState(false);

  // Live tracker
  const [requests, setRequests] = useState([]);
  const [showTracker, setShowTracker] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Gallery lightbox
  const [lightbox, setLightbox] = useState(null);

  // New Arrivals
  const [newMovies, setNewMovies] = useState([]);
  const [loadingNew, setLoadingNew] = useState(false);
  const [visibleCards, setVisibleCards] = useState(new Set());

  const notify = useCallback((type, title, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, title, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ---- RTDB listener ----
  useEffect(() => {
    try {
      onValue(ref(rtdb, 'movie_requests'), snap => {
        const data = snap.val();
        if (data) {
          setRequests(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.createdAt - a.createdAt));
        } else {
          // All records deleted (delivered) — clear queue display
          setRequests([]);
        }
      });
    } catch (_) {}
  }, []);

  // ---- AUTO-FETCH NEW ARRIVALS on mount ----
  useEffect(() => {
    const fetchNewArrivals = async () => {
      setLoadingNew(true);
      try {
        const results = await Promise.all([
          proxyAxios.get(apiCall('/api/v1/movies/sinhalasub/search', { q: '2026' }), { timeout: 10000 })
            .then(r => (r.data?.data || []).slice(0, 6).map(m => ({ ...m, _site: 'sinhalasub' }))).catch(() => []),
          proxyAxios.get(apiCall('/api/v1/movies/moviebox/search', { q: '2026' }), { timeout: 10000 })
            .then(r => (r.data?.data || []).slice(0, 6).map(m => ({ ...m, _site: 'moviebox' }))).catch(() => []),
          proxyAxios.get(apiCall('/api/v1/movies/cinesubz/search', { q: '2026' }), { timeout: 10000 })
            .then(r => (r.data?.data || []).slice(0, 6).map(m => ({ ...m, _site: 'cinesubz' }))).catch(() => []),
        ]);
        const all = results.flat();
        const seen = new Set();
        const unique = all.filter(m => {
          const k = (m.title || '').toLowerCase().trim().substring(0, 30);
          if (!k || seen.has(k)) return false;
          seen.add(k); return true;
        });
        setNewMovies(unique.slice(0, 18));
        unique.slice(0, 18).forEach((_, i) => {
          setTimeout(() => setVisibleCards(prev => new Set([...prev, i])), i * 70);
        });
      } catch (_) {}
      setLoadingNew(false);
    };
    fetchNewArrivals();
  }, []);

  // ---- SEARCH HANDLER WITH URL ROUTING ----
  const handleSearch = useCallback(async (targetSite = site, q = query, pushHistory = true) => {
    const cleanQ = q.trim();
    if (!cleanQ) return;
    setSearching(true);
    setHasSearched(true);
    setMovies([]);
    setDetailMovie(null);
    setDetail(null);

    // Update browser URL (e.g. ?q=spiderman&site=moviebox)
    if (pushHistory) {
      updateBrowserUrl(
        { q: cleanQ, site: targetSite !== 'all' ? targetSite : '' },
        `Search: ${cleanQ} | CHAMA CINE HUB`
      );
    }

    try {
      if (targetSite === 'all') {
        const results = await Promise.all(
          ALL_SEARCH_SITES.map(s =>
            axios.get(apiCall(`/api/v1/movies/${s}/search`, { q: cleanQ }), { timeout: 12000 })
              .then(r => {
                const items = r.data?.data || r.data?.results || (Array.isArray(r.data) ? r.data : []);
                return items.map(item => ({ ...item, _site: s }));
              })
              .catch(() => [])
          )
        );
        const flat = results.flat();
        const seen = new Set();
        const deduped = flat.filter(m => {
          const k = (m.title || '').toLowerCase().trim();
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setMovies(deduped.length ? deduped : flat);
      } else {
        const r = await axios.get(apiCall(`/api/v1/movies/${targetSite}/search`, { q: cleanQ }), { timeout: 12000 });
        const items = r.data?.data || r.data?.results || (Array.isArray(r.data) ? r.data : []);
        setMovies(items.map(i => ({ ...i, _site: targetSite })));
      }
    } catch (e) {
      notify('error', 'Search Failed', e.message);
    } finally {
      setSearching(false);
    }
  }, [site, query, notify]);

  // ---- FETCH DETAIL HANDLER WITH URL ROUTING ----
  const handleMovieClick = useCallback(async (movie, pushHistory = true) => {
    setDetailMovie(movie);
    setDetail(null);
    setDownloads({ videos: [], subs: [] });
    setTvSeasons([]);
    setSelectedSeason(null);
    setSelectedEpisode(null);
    setSelectedQuality(null);
    setSelectedSub(null);
    setTvEpDownloads({ videos: [], subs: [] });
    setLoadingDetail(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetSite = movie._site || (site === 'all' ? 'sinhalasub' : site);
    const movieUrl = movie.link || movie.url || '';
    const isTvType = movie.type === 'tvshows' || movie.type === 'tv' || movieUrl.includes('/tv/');

    // Update browser URL (e.g. ?movie=Spider-Man&site=sinhalasub&url=...)
    if (pushHistory) {
      updateBrowserUrl(
        {
          movie: movie.title || 'Movie',
          site: targetSite,
          url: movieUrl,
          poster: movie.image || movie.poster || '',
          type: movie.type || ''
        },
        `${movie.title || 'Movie'} | CHAMA CINE HUB`
      );
    }

    try {
      let data = {};

      if (targetSite === 'moviebox' && isTvType) {
        const r = await axios.get(apiCall(`/api/v1/movies/moviebox/tv/info`, { q: movieUrl }), { timeout: 15000 });
        data = r.data?.data || r.data || {};
        setTvSeasons(data.seasons || []);
      } else if (targetSite === 'moviebox') {
        const r = await axios.get(apiCall(`/api/v1/movies/moviebox/info`, { q: movieUrl }), { timeout: 15000 });
        data = r.data?.data || r.data || {};
      } else {
        const endpoint = isTvType ? 'tv/info' : 'infodl';
        const r = await axios.get(apiCall(`/api/v1/movies/${targetSite}/${endpoint}`, { q: movieUrl }), { timeout: 15000 });
        data = r.data?.data || r.data || {};
        if (data.seasons) setTvSeasons(data.seasons);
        if (Array.isArray(data.episodes) && data.episodes.length > 0) {
          setTvSeasons([{ label: 'Season 1', episodes: data.episodes }]);
        }
      }

      setDetail(data);

      const parsed = parseDownloads(data.downloads || data.download_links || data.links || []);
      setDownloads(parsed);
      if (parsed.videos.length > 0) setSelectedQuality(parsed.videos[0]);
      if (parsed.subs.length > 0) setSelectedSub(parsed.subs[0]);
    } catch (e) {
      notify('error', 'Detail Fetch Failed', 'Could not load movie details.');
    } finally {
      setLoadingDetail(false);
    }
  }, [site, notify]);

  // ---- BACK BUTTON HANDLER ----
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setDetailMovie(null);
      setDetail(null);
      if (query.trim()) {
        updateBrowserUrl({ q: query.trim(), site: site !== 'all' ? site : '' }, `Search: ${query} | CHAMA CINE HUB`);
      } else {
        updateBrowserUrl({}, 'CHAMA CINE HUB - Direct WhatsApp Movie System');
      }
    }
  }, [query, site]);

  // Refs to avoid popstate re-binding on every keystroke
  const handleSearchRef = useRef();
  const handleMovieClickRef = useRef();
  useEffect(() => {
    handleSearchRef.current = handleSearch;
    handleMovieClickRef.current = handleMovieClick;
  });

  // ---- POPSTATE & INITIAL URL PARSING (Deep Linking) ----
  useEffect(() => {
    const syncStateFromUrl = (isInitial = false) => {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q');
      const siteParam = params.get('site') || 'all';
      const movieTitle = params.get('movie');
      const movieUrl = params.get('url');
      const moviePoster = params.get('poster');
      const movieType = params.get('type');

      if (movieUrl || movieTitle) {
        const item = {
          title: movieTitle || 'Movie',
          link: movieUrl || '',
          url: movieUrl || '',
          image: moviePoster || '',
          _site: siteParam,
          type: movieType || ''
        };
        setDetailMovie(item);
        if (handleMovieClickRef.current) {
          handleMovieClickRef.current(item, false);
        }
      } else if (qParam) {
        setDetailMovie(null);
        setDetail(null);
        setQuery(qParam);
        setSite(siteParam);
        if (handleSearchRef.current) {
          handleSearchRef.current(siteParam, qParam, false);
        }
        document.title = `Search: ${qParam} | CHAMA CINE HUB`;
      } else {
        // Back to home
        setDetailMovie(null);
        setDetail(null);
        setHasSearched(false);
        setMovies([]);
        if (!isInitial) {
          setQuery('');
        }
        document.title = 'CHAMA CINE HUB - Direct WhatsApp Movie System';
      }
    };

    const onPopState = () => syncStateFromUrl(false);
    window.addEventListener('popstate', onPopState);
    syncStateFromUrl(true);

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ---- TV Episode DL fetch ----
  const handleEpisodeSelect = useCallback(async (ep) => {
    setSelectedEpisode(ep);
    setTvEpDownloads({ videos: [], subs: [] });
    setSelectedQuality(null);
    setSelectedSub(null);
    if (!ep?.episode_url) return;

    const targetSite = detailMovie?._site || (site === 'all' ? 'sinhalasub' : site);
    setLoadingEpDl(true);
    try {
      const r = await axios.get(apiCall(`/api/v1/movies/${targetSite}/tv/dl`, { q: ep.episode_url }), { timeout: 15000 });
      const data = r.data?.data || r.data || {};
      const dls = data.downloads || data.download_links || (Array.isArray(data) ? data : []);
      const parsed = parseDownloads(dls);
      setTvEpDownloads(parsed);
      setDownloads(parsed);
      if (parsed.videos.length > 0) setSelectedQuality(parsed.videos[0]);
      if (parsed.subs.length > 0) setSelectedSub(parsed.subs[0]);
    } catch (_) {
      notify('info', 'No Episode Downloads', 'Episode downloads not available for this site.');
    } finally {
      setLoadingEpDl(false);
    }
  }, [detailMovie, site, notify]);

  // ---- SUBMIT REQUEST ----
  const handleSubmitRequest = useCallback(async () => {
    if (!phone.trim()) { notify('error', 'Phone Required', 'Enter your WhatsApp number.'); return; }
    if (!detailMovie) return;

    setSending(true);
    localStorage.setItem('chama_phone', phone);

    try {
      const formattedPhone = formatPhone(phone);
      const targetSite = detailMovie._site || (site === 'all' ? 'sinhalasub' : site);
      const isTv = detailMovie.type === 'tvshows' || detailMovie.type === 'tv' || tvSeasons.length > 0;

      const payload = {
        phone: formattedPhone,
        title: detail?.title || detailMovie.title || 'Movie',
        url: detailMovie.link || detailMovie.url || '',
        poster: detail?.image || detailMovie.image || detailMovie.poster || '',
        site: targetSite,
        isTv,
        season: selectedSeason?.label || 'all',
        episode: selectedEpisode?.episode_name || 'all',
        episodeUrl: selectedEpisode?.episode_url || '',
        quality: selectedQuality?.label || 'best',
        qualityLink: selectedQuality?.url || '',
        subtitleLang: selectedSub?.lang || 'auto',
        subLink: selectedSub?.url || '',
        status: 'pending',
        createdAt: Date.now()
      };

      let sent = false;
      try {
        const res = await axios.post(`${BOT_SERVER_URL}/api/request-movie`, payload, { timeout: 8000 });
        if (res.data?.success) {
          sent = true;
        }
      } catch (err) {
        console.warn('Bot server direct dispatch failed, using fallback:', err.message);
      }

      // ONLY if bot server is unreachable (cold start / offline), fallback to direct DB write
      if (!sent) {
        try {
          const reqId = 'req_' + Date.now();
          await set(ref(rtdb, `movie_requests/${reqId}`), payload);
          sent = true;
        } catch (_) {}
      }

      if (sent) {
        notify('success', 'Request Dispatched!', `"${payload.title}" will be delivered to +${formattedPhone} via WhatsApp!`);
        setShowRequest(false);
      } else {
        notify('error', 'Failed', 'Could not send request. Check server status.');
      }
    } catch (e) {
      notify('error', 'Error', e.message);
    } finally {
      setSending(false);
    }
  }, [phone, detailMovie, detail, site, tvSeasons, selectedSeason, selectedEpisode, selectedQuality, selectedSub, notify]);

  // ---- CLEAR QUEUE HANDLER ----
  const handleClearQueue = useCallback(async () => {
    try {
      await set(ref(rtdb, 'movie_requests'), null);
      setRequests([]);
      notify('success', 'Queue Cleared', 'All queue entries have been cleared.');
    } catch (e) {
      notify('error', 'Failed', 'Could not clear queue: ' + e.message);
    }
  }, [notify]);

  const seasonGroups = tvSeasons.length > 0
    ? tvSeasons
    : detail?.episodes
      ? (() => {
          const groups = {};
          detail.episodes.forEach(ep => {
            const m = ep.episode_name?.match(/^(\d+)\s/);
            if (m) {
              const sMatch = ep.episode_url?.match(/(\d+)x(\d+)/);
              const s = sMatch ? `S${sMatch[1]}` : 'S1';
              if (!groups[s]) groups[s] = { label: s, episodes: [] };
              groups[s].episodes.push(ep);
            }
          });
          return Object.values(groups);
        })()
      : [];

  const activeDownloads = (selectedEpisode ? tvEpDownloads : downloads);

  const isTvContent = detailMovie && (
    detailMovie.type === 'tvshows' ||
    detailMovie.type === 'tv' ||
    seasonGroups.length > 0 ||
    (detailMovie.link || '').includes('/tv/')
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080b0f', color: '#e2e8f0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ---- TOAST WITH ANIMATED ICONS ---- */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.95)' : toast.type === 'error' ? 'rgba(220,38,38,0.95)' : 'rgba(59,130,246,0.95)',
          backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '16px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)', maxWidth: '380px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          animation: 'toastSlide 0.35s cubic-bezier(0.16,1,0.3,1)'
        }}>
          <div style={{ marginTop: '2px' }}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} color="white" />
            ) : toast.type === 'error' ? (
              <XCircle size={20} color="white" />
            ) : (
              <Info size={20} color="white" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>{toast.title}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{toast.msg}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ---- LIGHTBOX ---- */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <img src={lightbox} alt="Gallery" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '14px', objectFit: 'contain', boxShadow: '0 25px 70px rgba(0,0,0,0.8)' }} />
        </div>
      )}

      {/* ---- NAV ---- */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,11,15,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div
          onClick={() => {
            setDetailMovie(null);
            setDetail(null);
            setHasSearched(false);
            setMovies([]);
            setQuery('');
            updateBrowserUrl({}, 'CHAMA CINE HUB - Direct WhatsApp Movie System');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(37,211,102,0.35)',
            position: 'relative'
          }}>
            <Film size={20} color="white" className="anim-float" />
          </div>
          <div>
            <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '0.5px', color: '#f1f5f9' }}>CHAMA CINE HUB</div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', letterSpacing: '1px' }}>DIRECT WHATSAPP DELIVERY</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {detailMovie && (
            <button onClick={handleBack}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '8px 16px', color: '#94a3b8', cursor: 'pointer',
                fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}>
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          )}
          <button onClick={() => setShowTracker(true)} style={{
            background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)',
            borderRadius: '10px', padding: '8px 16px', color: '#25D366', cursor: 'pointer',
            fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s'
          }}>
            <span className="anim-pulse-live" />
            <ListFilter size={15} />
            <span>Queue ({requests.length})</span>
          </button>
        </div>
      </nav>

      {/* ==================== DETAIL VIEW ==================== */}
      {detailMovie && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div className="portal-loader">
                <div className="portal-ring-1" />
                <div className="portal-ring-2" />
                <div className="portal-core" />
              </div>
              <div style={{ color: '#94a3b8', fontWeight: '700', marginTop: '24px', fontSize: '15px' }}>
                Fetching stream sources & download mirrors...
              </div>
            </div>
          ) : detail ? (
            <>
              {/* Hero Banner */}
              <div style={{
                display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px',
                background: 'rgba(255,255,255,0.025)', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)', padding: '28px',
                marginBottom: '24px', backdropFilter: 'blur(20px)'
              }}>
                {/* Poster */}
                <div>
                  <img
                    src={detail.image || detailMovie.image || 'https://via.placeholder.com/220x330?text=No+Poster'}
                    alt={detail.title}
                    style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                    onError={e => e.target.src = 'https://via.placeholder.com/220x330?text=No+Poster'}
                  />
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {isTvContent && (
                      <span style={{
                        background: '#3b82f625', border: '1px solid #3b82f655', color: '#60a5fa',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                      }}>
                        <Tv size={12} /> TV SERIES
                      </span>
                    )}
                    <span style={{
                      background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)',
                      color: '#25D366', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800'
                    }}>
                      {(detailMovie._site || site).toUpperCase()}
                    </span>
                    {detail.quality && detail.quality !== 'N/A' && (
                      <span style={{
                        background: '#f9731622', color: '#fb923c', padding: '4px 12px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '800', border: '1px solid #f9731633',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Sparkles size={11} /> {detail.quality}
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1.25', color: '#f8fafc', margin: 0 }}>
                    {detail.title || detailMovie.title}
                  </h1>

                  {/* Rating + Year + Duration */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {detail.imdb && detail.imdb !== 'N/A' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#facc15', color: '#1a1a1a', fontWeight: '900', fontSize: '11px', padding: '2px 7px', borderRadius: '5px' }}>IMDb</span>
                        <StarRating rating={detail.imdb} />
                      </div>
                    )}
                    {detail.year && detail.year !== 'N/A' && (
                      <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} color="#94a3b8" /> {detail.year}
                      </span>
                    )}
                    {detail.duration && detail.duration !== 'N/A' && (
                      <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} color="#94a3b8" /> {detail.duration}
                      </span>
                    )}
                    {detail.language && detail.language !== 'N/A' && (
                      <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Globe size={14} color="#94a3b8" /> {detail.language}
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {detail.genres?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {detail.genres.map((g, i) => <GenrePill key={i} genre={g} />)}
                    </div>
                  )}

                  {/* Director */}
                  {detail.director && detail.director !== 'N/A' && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={15} color="#38bdf8" />
                      <span style={{ color: '#cbd5e1', fontWeight: '700' }}>Director: </span>
                      <span>{detail.director}</span>
                    </div>
                  )}

                  {/* Story */}
                  {detail.story && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', maxHeight: '100px', overflowY: 'auto' }}>
                      <span style={{ color: '#cbd5e1', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <BookOpen size={14} color="#a78bfa" /> Story: </span>
                      <span> {detail.story.substring(0, 400)}{detail.story.length > 400 ? '...' : ''}</span>
                    </div>
                  )}

                  {/* Request Button */}
                  <button
                    onClick={() => setShowRequest(true)}
                    className="btn-wa-animated"
                    style={{
                      marginTop: 'auto', padding: '14px 26px', fontSize: '15px', width: 'fit-content'
                    }}
                  >
                    <MessageCircle size={20} />
                    <span>Request via WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* TV Series Section */}
              {isTvContent && seasonGroups.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tv size={18} color="#60a5fa" /> Seasons & Episodes
                  </h3>

                  {/* Season tabs */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                    {seasonGroups.map((s, si) => (
                      <button key={si}
                        onClick={() => { setSelectedSeason(s); setSelectedEpisode(null); setDownloads({ videos: [], subs: [] }); }}
                        style={{
                          flexShrink: 0, padding: '8px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                          background: selectedSeason === s ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                          border: selectedSeason === s ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.08)',
                          color: selectedSeason === s ? 'white' : '#94a3b8',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s.label || s.season ? `Season ${s.season || s.label}` : `Season ${si + 1}`}
                        {s.episodes ? ` (${s.episodes.length} eps)` : ''}
                      </button>
                    ))}
                  </div>

                  {/* Episode list */}
                  {selectedSeason && selectedSeason.episodes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                      {selectedSeason.episodes.map((ep, ei) => {
                        const epName = ep.episode_name || ep.name || `Episode ${ei + 1}`;
                        const isSelected = selectedEpisode === ep;
                        return (
                          <button key={ei} onClick={() => handleEpisodeSelect(ep)}
                            style={{
                              padding: '11px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                              background: isSelected ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.03)',
                              border: isSelected ? '1px solid rgba(37,211,102,0.3)' : '1px solid rgba(255,255,255,0.06)',
                              color: isSelected ? '#25D366' : '#94a3b8',
                              fontWeight: isSelected ? '800' : '600', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '8px',
                              transition: 'all 0.15s'
                            }}>
                            <Play size={14} color={isSelected ? '#25D366' : '#64748b'} />
                            <span style={{ flex: 1 }}>{epName}</span>
                            {loadingEpDl && isSelected && (
                              <Loader2 size={14} className="anim-spin-slow" color="#25D366" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quality Selector */}
              {activeDownloads.videos.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 14px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#f97316" /> Select Quality & File Size
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {activeDownloads.videos.map((v, i) => (
                      <QualityButton key={i} item={v} selected={selectedQuality} onClick={setSelectedQuality} />
                    ))}
                  </div>
                </div>
              )}

              {/* Subtitle Selector */}
              {activeDownloads.subs.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 14px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} color="#a78bfa" /> Select Subtitle
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {activeDownloads.subs.map((s, i) => {
                      const isSel = selectedSub?.url === s.url;
                      return (
                        <button key={i} onClick={() => setSelectedSub(isSel ? null : s)}
                          style={{
                            padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                            background: isSel ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                            border: isSel ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.08)',
                            color: isSel ? '#a78bfa' : '#94a3b8',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s'
                          }}>
                          <Globe size={14} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={() => setSelectedSub(null)}
                      style={{
                        padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                        background: !selectedSub ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                        border: !selectedSub ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.08)',
                        color: !selectedSub ? '#f87171' : '#94a3b8',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s'
                      }}>
                      <XCircle size={14} />
                      <span>No Subtitle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cast */}
              {detail.cast?.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#38bdf8" /> Cast & Crew
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {detail.cast.map((actor, i) => <CastCard key={i} actor={actor} />)}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {detail.gallery?.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} color="#10b981" /> Gallery & Stills
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {detail.gallery.slice(0, 10).map((img, i) => (
                      <img key={i} src={img} alt={`Gallery ${i + 1}`}
                        onClick={() => setLightbox(img)}
                        style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.08)', transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.target.style.opacity = '0.8'}
                        onMouseOut={e => e.target.style.opacity = '1'}
                        onError={e => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Trailer */}
              {detail.trailer && detail.trailer.includes('youtube') && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontWeight: '900', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clapperboard size={18} color="#ef4444" /> Official Trailer
                  </h3>
                  <a href={detail.trailer} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px',
                      background: '#ef444422', border: '1px solid #ef444444', borderRadius: '12px',
                      color: '#f87171', fontWeight: '800', textDecoration: 'none', fontSize: '14px',
                      transition: 'all 0.2s'
                    }}>
                    <Play size={16} />
                    <span>Watch Trailer on YouTube</span>
                  </a>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{
                width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '18px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertCircle size={32} color="#ef4444" />
              </div>
              <div>Could not load details for this title.</div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SEARCH / HOME VIEW ==================== */}
      {!detailMovie && (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 20px' }}>
          {/* Search Hero */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '34px', fontWeight: '900', margin: '0 0 8px', color: '#f8fafc', letterSpacing: '-0.5px' }}>
              Find Any Movie or TV Series
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 28px' }}>
              Search across 22 Sri Lankan movie sites. Request via WhatsApp and get direct document delivery.
            </p>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '10px', maxWidth: '640px', margin: '0 auto 24px' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(site, query, true)}
                placeholder="Search movies, TV series, anime..."
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '15px', outline: 'none',
                  fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(37,211,102,0.4)'; e.target.style.boxShadow = '0 0 15px rgba(37,211,102,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                onClick={() => handleSearch(site, query, true)}
                disabled={searching}
                style={{
                  padding: '14px 26px', borderRadius: '14px',
                  background: searching ? '#374151' : 'linear-gradient(135deg, #25D366, #128C7E)',
                  border: 'none', color: 'white', fontWeight: '800', fontSize: '15px',
                  cursor: searching ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: searching ? 'none' : '0 4px 20px rgba(37,211,102,0.35)',
                  transition: 'all 0.2s'
                }}>
                {searching ? (
                  <>
                    <Loader2 size={18} className="anim-spin-slow" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* ALL SITES — Pinned prominent button */}
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => { setSite('all'); if (query.trim()) handleSearch('all', query, true); }}
                style={{
                  padding: '10px 28px', borderRadius: '24px', cursor: 'pointer',
                  background: site === 'all' ? 'linear-gradient(135deg, #f97316, #ef4444)' : 'rgba(249,115,22,0.08)',
                  border: site === 'all' ? '2px solid #f97316' : '2px solid rgba(249,115,22,0.25)',
                  color: site === 'all' ? 'white' : '#f97316',
                  fontWeight: '900', fontSize: '14px', transition: 'all 0.25s',
                  boxShadow: site === 'all' ? '0 4px 20px rgba(249,115,22,0.4)' : 'none',
                  letterSpacing: '0.3px',
                  display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Flame size={17} className={site === 'all' ? 'anim-float' : ''} />
                <span>All Sites Search</span>
              </button>
            </div>

            {/* Site Tabs — horizontally scrollable */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', justifyContent: 'flex-start', flexWrap: 'nowrap', maxWidth: '740px', margin: '0 auto' }}>
              {SITES.filter(s => s.id !== 'all').map(s => {
                const SiteIcon = s.Icon;
                const isActive = site === s.id;
                return (
                  <button key={s.id}
                    onClick={() => { setSite(s.id); if (query.trim()) handleSearch(s.id, query, true); }}
                    className="site-pill-btn"
                    style={{
                      flexShrink: 0,
                      background: isActive ? `${s.color}25` : 'rgba(255,255,255,0.035)',
                      border: isActive ? `1.5px solid ${s.color}` : '1.5px solid rgba(255,255,255,0.08)',
                      color: isActive ? s.color : '#94a3b8',
                      boxShadow: isActive ? `0 4px 15px ${s.color}33` : 'none'
                    }}>
                    <SiteIcon size={14} color={isActive ? s.color : '#64748b'} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searching Loader */}
          {searching && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="portal-loader">
                <div className="portal-ring-1" />
                <div className="portal-ring-2" />
                <div className="portal-core" />
              </div>
              <div style={{ color: '#94a3b8', fontWeight: '700', marginTop: '24px', fontSize: '15px' }}>
                Searching across {site === 'all' ? 'All Top 7 Sites' : site}...
              </div>
            </div>
          )}

          {!searching && hasSearched && movies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '18px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertCircle size={32} color="#ef4444" />
              </div>
              <div style={{ color: '#94a3b8', fontWeight: '600' }}>No results found. Try a different movie title.</div>
            </div>
          )}

          {/* NEW ARRIVALS */}
          {!searching && !hasSearched && (
            <div>
              {/* Hero welcome with animated Cinema Icon */}
              <div style={{ textAlign: 'center', padding: '36px 0 24px', animation: 'fadeUp 0.6s ease both' }}>
                <div style={{
                  width: '72px', height: '72px', margin: '0 auto 16px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(59,130,246,0.15))',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }} className="anim-float">
                  <Film size={36} color="#25D366" />
                </div>
                <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '15px' }}>
                  Search any movie, TV series or anime above to get started
                </div>
              </div>

              {/* New Arrivals Section */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    borderRadius: '8px', padding: '4px 10px',
                    fontSize: '11px', fontWeight: '900', color: 'white',
                    letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                    boxShadow: '0 2px 10px rgba(239,68,68,0.4)'
                  }}>
                    <Sparkles size={13} />
                    <span>NEW</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#e2e8f0' }}>New Arrivals 2026</h3>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Auto-updated daily</span>
                </div>

                {loadingNew && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '18px' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="anim-shimmer" style={{
                        borderRadius: '14px', overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: '148%', position: 'relative'
                      }} />
                    ))}
                  </div>
                )}

                {!loadingNew && newMovies.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '18px' }}>
                    {newMovies.map((m, idx) => {
                      const isTv = m.type === 'tvshows' || m.type === 'tv';
                      const isVisible = visibleCards.has(idx);
                      return (
                        <div key={idx}
                          onClick={() => handleMovieClick(m, true)}
                          className="movie-card-interactive"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s'
                          }}
                        >
                          <div style={{ position: 'relative', paddingBottom: '148%' }}>
                            <img
                              src={m.image || m.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                              alt={m.title}
                              className="poster-img"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.1) 55%)' }} />

                            {/* Badges */}
                            <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{
                                background: 'linear-gradient(135deg,#ef4444,#f97316)',
                                borderRadius: '6px', fontSize: '9px', fontWeight: '900',
                                padding: '2px 7px', color: 'white',
                                boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                                display: 'inline-flex', alignItems: 'center', gap: '3px'
                              }}>
                                <Sparkles size={10} /> NEW
                              </span>
                              {isTv && (
                                <span style={{ background: '#3b82f6cc', borderRadius: '6px', fontSize: '9px', fontWeight: '800', padding: '2px 6px', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Tv size={10} /> TV
                                </span>
                              )}
                            </div>

                            {/* Site badge */}
                            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                              <span style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '6px', fontSize: '9px', fontWeight: '800', padding: '2px 6px', color: '#94a3b8', backdropFilter: 'blur(4px)' }}>{m._site}</span>
                            </div>

                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 12px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: 'white', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.title}</div>
                              {m.rating && m.rating !== 'N/A' && (
                                <div style={{ fontSize: '10px', color: '#facc15', marginTop: '3px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Star size={11} fill="#facc15" color="#facc15" />
                                  <span>{m.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Searched Movies List */}
          {!searching && movies.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '18px'
            }}>
              {movies.map((m, idx) => {
                const isTv = m.type === 'tvshows' || m.type === 'tv';
                const siteSrc = m._site || site;
                return (
                  <div key={idx}
                    onClick={() => handleMovieClick(m, true)}
                    className="movie-card-interactive"
                  >
                    <div style={{ position: 'relative', paddingBottom: '148%' }}>
                      <img
                        src={m.image || m.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                        alt={m.title}
                        className="poster-img"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {isTv && (
                          <span style={{ background: '#3b82f6cc', borderRadius: '6px', fontSize: '9px', fontWeight: '800', padding: '2px 6px', color: 'white', backdropFilter: 'blur(4px)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Tv size={10} /> TV
                          </span>
                        )}
                        {m.quality && m.quality !== 'N/A' && (
                          <span style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '6px', fontSize: '9px', fontWeight: '800', padding: '2px 6px', color: '#facc15', backdropFilter: 'blur(4px)' }}>{m.quality}</span>
                        )}
                      </div>

                      {/* Site badge */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                        <span style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '6px', fontSize: '9px', fontWeight: '800', padding: '2px 6px', color: '#94a3b8', backdropFilter: 'blur(4px)' }}>{siteSrc}</span>
                      </div>

                      {/* Title overlay */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'white', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.title}</div>
                        {m.rating && m.rating !== 'N/A' && (
                          <div style={{ fontSize: '10px', color: '#facc15', marginTop: '3px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={11} fill="#facc15" color="#facc15" />
                            <span>{m.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== REQUEST MODAL ==================== */}
      {showRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowRequest(false); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', animation: 'modalFadeIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37,211,102,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MessageCircle size={20} color="#25D366" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: '900', fontSize: '17px', color: '#f8fafc' }}>Request via WhatsApp</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>{detail?.title || detailMovie?.title}</p>
                </div>
              </div>
              <button onClick={() => setShowRequest(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Summary Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedQuality && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Quality:</span>
                    <span style={{ fontWeight: '800', color: getQualityBadgeColor(selectedQuality.label) }}>{selectedQuality.label} {selectedQuality.size && `(${selectedQuality.size})`}</span>
                  </div>
                )}
                {selectedSub && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Subtitle:</span>
                    <span style={{ fontWeight: '800', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} /> {selectedSub.label}
                    </span>
                  </div>
                )}
                {selectedSeason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Season:</span>
                    <span style={{ fontWeight: '800', color: '#60a5fa' }}>{selectedSeason.label || `Season ${selectedSeason.season}`}</span>
                  </div>
                )}
                {selectedEpisode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Episode:</span>
                    <span style={{ fontWeight: '800', color: '#34d399' }}>{selectedEpisode.episode_name}</span>
                  </div>
                )}
                {!selectedQuality && !selectedSeason && (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Best available quality will be sent automatically.</div>
                )}
              </div>
            </div>

            {/* Phone Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>WhatsApp Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0771234567 or 94771234567"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Info */}
            <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '22px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
              The WhatsApp Bot will automatically deliver the video file directly to your WhatsApp chat. Files up to 2GB are sent as documents.
            </div>

            <button
              onClick={handleSubmitRequest}
              disabled={sending}
              className="btn-wa-animated"
              style={{
                width: '100%', padding: '16px', fontSize: '15px'
              }}>
              {sending ? (
                <>
                  <Loader2 size={18} className="anim-spin-slow" />
                  <span>Dispatching Request...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Request Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== LIVE TRACKER MODAL ==================== */}
      {showTracker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowTracker(false); }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', animation: 'modalFadeIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="anim-pulse-live" />
                <h3 style={{ margin: 0, fontWeight: '900', fontSize: '18px', color: '#f8fafc' }}>Live Server Queue</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {requests.length > 0 && (
                  <button
                    onClick={handleClearQueue}
                    title="Clear All Queue Items"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171', cursor: 'pointer', borderRadius: '10px', padding: '6px 12px',
                      fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
                <button onClick={() => setShowTracker(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No requests in queue yet.</div>
              )}
              {requests.map(r => {
                const statusColor = { pending: '#f59e0b', processing: '#3b82f6', completed: '#10b981', failed: '#ef4444' }[r.status] || '#64748b';
                return (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        +{r.phone} • {r.quality || 'Best'} • {new Date(r.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span style={{
                      background: `${statusColor}22`, border: `1px solid ${statusColor}44`, color: statusColor,
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}>
                      {r.status === 'completed' && <CheckCircle2 size={12} />}
                      {r.status === 'failed' && <XCircle size={12} />}
                      {(r.status === 'pending' || r.status === 'processing') && <Loader2 size={12} className="anim-spin-slow" />}
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
