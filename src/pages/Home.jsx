import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carrousel from '../components/home/Carrousel';
import { useTranslations } from '../hooks/useTranslations';
import SearchInput from '../components/common/SearchInput';
import Chip from '../components/common/Chip';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  Home as HomeIcon,
  Build,
  CleaningServices,
  Plumbing,
  ElectricalServices,
  Handyman,
  Search,
} from '@mui/icons-material';
import {
  Shield, Clock, CreditCard, Star,
  CheckCircle, Users, TrendingUp,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { workerService } from '../services/workerService';
import { logger } from '../utils/logger';
import heroManImage from '../assets/images/heroman.png';
// Gallery images — optimized versions (336px wide, ~10-50KB each vs original 1-7MB)
// Col A (9)
import imgWorker1  from '../assets/images/gallery/ehmitrich-fW6lwDM26o0-unsplash.jpg';
import imgCreative from '../assets/images/gallery/ona-creative-z4S0MYNYT08-unsplash.jpg';
import imgOutdoor1 from '../assets/images/gallery/vitaly-gariev-0rhc6d7o6T8-unsplash.jpg';
import imgAlina    from '../assets/images/gallery/alina-belogolova-4SREHF03pn8-unsplash.jpg';
import imgCarl     from '../assets/images/gallery/carl-campbell-ISO_zsPYWw8-unsplash.jpg';
import imgDavid    from '../assets/images/gallery/david-suarez-Q_pPfSLqz4o-unsplash.jpg';
import imgHector   from '../assets/images/gallery/hector-emilio-gonzalez--SYOWCWxH3Q-unsplash.jpg';
import imgMaria    from '../assets/images/gallery/maria-ziegler-1AmEImwtnFk-unsplash.jpg';
import imgMathias  from '../assets/images/gallery/mathias-reding-pRPiZT3zfUQ-unsplash.jpg';
// Col B (8)
import imgService1 from '../assets/images/gallery/jimmy-nilsson-masth-UovTD1dG-lA-unsplash.jpg';
import imgWorker2  from '../assets/images/gallery/shishu-yadava-Hu_6KP4m9xA-unsplash.jpg';
import imgOutdoor2 from '../assets/images/gallery/vitaly-gariev-QEXRd41FjZw-unsplash.jpg';
import imgMichael  from '../assets/images/gallery/michael-kahn-xWAsrLw_1hk-unsplash.jpg';
import imgMilin    from '../assets/images/gallery/milin-john-eROpOENKzUw-unsplash.jpg';
import imgMitchell from '../assets/images/gallery/mitchell-luo-TtX79Vkm8gs-unsplash.jpg';
import imgRoberto  from '../assets/images/gallery/roberto-nickson-b9dmHiTXkLk-unsplash.jpg';
import imgSaemi    from '../assets/images/gallery/saemi-kim-4hcTkOw-EKE-unsplash.jpg';
import '../styles/home.scss';
import '../styles/button.scss';

/* ─── Render star rating ─────────────────────────────── */
const StarRating = ({ value = 5 }) => (
  <div className="tcard-stars" aria-label={`${value} de 5 estrellas`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        strokeWidth={2}
        fill={i < value ? 'currentColor' : 'none'}
        style={{ opacity: i < value ? 1 : 0.3 }}
      />
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════
   HOME COMPONENT
════════════════════════════════════════════════════════ */
const Home = () => {
  const { t, translateService } = useTranslations();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredWorkers, setFeaturedWorkers] = useState([]);
  const [topRatedWorkers, setTopRatedWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  /* Load categories */
  useEffect(() => {
    serviceService.getCategories()
      .then((data) => setCategories(data.slice(0, 6)))
      .catch(() => {
        logger.log('Usando categorías mock');
        setCategories([
          { id: 1, nombre: 'domesticCleaning', icono: 'cleaning' },
          { id: 2, nombre: 'plumbing',         icono: 'plumbing' },
          { id: 3, nombre: 'electricity',      icono: 'electrical' },
          { id: 4, nombre: 'carpentry',        icono: 'carpenter' },
          { id: 5, nombre: 'gardening',        icono: 'garden' },
          { id: 6, nombre: 'construction',     icono: 'build' },
        ]);
      });
  }, []);

  /* Load workers */
  useEffect(() => {
    setLoadingWorkers(true);
    Promise.all([
      workerService.getFeaturedWorkers(8).catch(() => []),
      workerService.getTopRatedWorkers(8).catch(() => []),
    ]).then(([featured, topRated]) => {
      if (!featured?.length && !topRated?.length) {
        const mock = generateMockWorkers(6);
        setFeaturedWorkers(mock);
        setTopRatedWorkers(mock);
      } else {
        setFeaturedWorkers(featured || []);
        setTopRatedWorkers(topRated || []);
      }
    }).finally(() => setLoadingWorkers(false));
  }, []);

  const generateMockWorkers = (count) => {
    const names  = ['Juan','María','Carlos','Ana','Luis','Sofía'];
    const surns  = ['García','Rodríguez','Martínez','López','González','Pérez'];
    const titles = ['Electricista','Plomero','Carpintero','Jardinero','Pintor','Albañil'];
    const depts  = ['San Salvador','La Libertad','Santa Ana','San Miguel'];
    const munis  = ['San Salvador','Santa Tecla','Antiguo Cuscatlán','Soyapango'];
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-${i + 1}`,
      nombre: names[i % names.length],
      apellido: surns[i % surns.length],
      titulo_profesional: titles[i % titles.length],
      foto_perfil: `https://i.pravatar.cc/300?img=${i + 1}`,
      foto_portada: `https://picsum.photos/seed/${i}/800/400`,
      verificado: i % 2 === 0,
      biografia: 'Profesional con amplia experiencia. Trabajo garantizado.',
      departamento: depts[i % depts.length],
      municipio: munis[i % munis.length],
      stats: {
        rating: 4 + (i % 10) / 10,
        total_reviews: 10 + i * 7,
        trabajos_completados: 20 + i * 15,
      },
      habilidades: ['Reparaciones','Instalaciones'],
      categorias: [{ nombre: titles[i % titles.length] }],
    }));
  };

  const getServiceIcon = (iconName) => {
    const map = {
      cleaning:  <CleaningServices />,
      plumbing:  <Plumbing />,
      electrical:<ElectricalServices />,
      carpenter: <Handyman />,
      garden:    <HomeIcon />,
      build:     <Build />,
    };
    return map[iconName] ?? <Build />;
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const features = [
    {
      icon: <Shield size={28} strokeWidth={1.75} />,
      title: t('home.features.verifiedWorkers.title'),
      description: t('home.features.verifiedWorkers.description'),
    },
    {
      icon: <Clock size={28} strokeWidth={1.75} />,
      title: t('home.features.availability.title'),
      description: t('home.features.availability.description'),
    },
    {
      icon: <CreditCard size={28} strokeWidth={1.75} />,
      title: t('home.features.securePayments.title'),
      description: t('home.features.securePayments.description'),
    },
  ];

  const testimonials = [
    {
      name: 'María González',
      rating: 5,
      comment: t('testimonials.maria'),
      service: translateService('domesticCleaning'),
      location: 'San Salvador',
      featured: false,
    },
    {
      name: 'Carlos Martínez',
      rating: 5,
      comment: t('testimonials.carlos'),
      service: translateService('plumbing'),
      location: 'Santa Tecla',
      featured: true,
    },
    {
      name: 'Ana Rodríguez',
      rating: 4,
      comment: t('testimonials.ana'),
      service: translateService('gardening'),
      location: 'Antiguo Cuscatlán',
      featured: false,
    },
  ];

  const SEARCH_TAGS = [
    { labelKey: 'home.search.popularTags.domesticCleaning', query: 'Limpieza doméstica', variant: 'trending' },
    { labelKey: 'home.search.popularTags.plumbing247',      query: 'Plomería',           variant: 'urgent' },
    { labelKey: 'home.search.popularTags.electrician',      query: 'Electricista',       variant: 'popular' },
    { labelKey: 'home.search.popularTags.gardening',        query: 'Jardinería',         variant: 'seasonal' },
    { labelKey: 'home.search.popularTags.carpentry',        query: 'Carpintería',        variant: 'default' },
    { labelKey: 'home.search.popularTags.construction',     query: 'Construcción',       variant: 'default' },
  ];

  return (
    <div className="home-page" itemScope itemType="https://schema.org/LocalBusiness">
      <meta itemProp="name" content="Chambing" />
      <meta itemProp="description" content="Marketplace de servicios domésticos en El Salvador" />

      {/* ══════ HERO ══════ */}
      <section className="hero-section" aria-label={t('home.hero.title')}>
        <div className="hero-container">
          <div className="hero-content">

            {/* Text — left */}
            <div className="hero-positioning">
              <div className="hero-left">
                <h1 className="hero-title">{t('home.hero.title')}</h1>
                <div className="hero-divider" aria-hidden="true" />
                <p className="hero-subtitle">{t('home.hero.subtitle')}</p>

                <div className="hero-actions">
                  {isAuthenticated ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="custom-btn custom-btn-primary custom-btn-large"
                    >
                      {t('home.hero.dashboard')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/register')}
                        className="custom-btn custom-btn-primary custom-btn-large"
                      >
                        {t('home.hero.startNow')}
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="custom-btn custom-btn-secondary custom-btn-large"
                      >
                        {t('home.hero.login')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Image — right */}
            <div className="hero-image-container">
              <img
                src={heroManImage}
                alt="Profesional de servicios del hogar"
                className="hero-image"
                fetchPriority="high"
                decoding="async"
              />
              <div className="hero-image-glow" aria-hidden="true" />
              <div className="hero-image-glow-rings" aria-hidden="true" />
              <div className="hero-energy-particles" aria-hidden="true" />
              <div className="hero-extra-particles" aria-hidden="true" />
              <div className="hero-light-rays" aria-hidden="true" />
              <div className="hero-image-dots" aria-hidden="true" />
            </div>
          </div>

        </div>
      </section>

      {/* ══════ ABOUT ══════ */}
      <section
        className="about-section"
        aria-labelledby="about-title"
        itemScope
        itemType="https://schema.org/LocalBusiness"
      >
        <meta itemProp="name" content="Chambing" />
        <meta itemProp="areaServed" content="El Salvador" />
        <div className="sec-wrap">
          <div className="about-grid">

            {/* Left — text + pills */}
            <div className="about-text">
              <span className="about-badge" aria-hidden="true">
                <Shield size={12} strokeWidth={2.5} />
                {t('home.about.badge')}
              </span>
              <h2 id="about-title" className="about-headline" itemProp="description">
                {t('MoreDetails.moreDetailsTitle')}
              </h2>
              <p className="about-lead">{t('MoreDetails.moreDetailsDescription')}</p>

              <ul className="about-values" aria-label="Por qué elegirnos">
                {[
                  { icon: <Shield size={16} strokeWidth={2} />, text: t('home.about.value1') },
                  { icon: <Star   size={16} strokeWidth={2} />, text: t('home.about.value2') },
                  { icon: <Clock  size={16} strokeWidth={2} />, text: t('home.about.value3') },
                ].map((v, i) => (
                  <li key={i} className="about-value-item">
                    <span className="about-value-icon" aria-hidden="true">{v.icon}</span>
                    <span>{v.text}</span>
                  </li>
                ))}
              </ul>

              <div className="about-pills" aria-label="Servicios disponibles">
                {t('MoreDetails.moreDetailsKeywords').split(', ').slice(0, 8).map((kw, i) => (
                  <span key={i} className="kw-pill">{kw}</span>
                ))}
              </div>
            </div>

            {/* Right — gallery carousel */}
            <div className="about-visual" aria-hidden="true">
              <div className="gallery-frame">
                <div className="gallery-viewport">
                  {/* Column A — 9 images × 2 for seamless loop */}
                  <div className="gallery-col gallery-col--a">
                    {(() => {
                      const colA = [imgWorker1, imgCreative, imgOutdoor1, imgAlina, imgCarl, imgDavid, imgHector, imgMaria, imgMathias];
                      return [...colA, ...colA].map((src, i) => (
                        <img key={i} src={src} alt="" className="gallery-img" loading="lazy" fetchPriority="low" decoding="async" />
                      ));
                    })()}
                  </div>
                  {/* Column B — 8 images × 2 for seamless loop */}
                  <div className="gallery-col gallery-col--b">
                    {(() => {
                      const colB = [imgService1, imgWorker2, imgOutdoor2, imgMichael, imgMilin, imgMitchell, imgRoberto, imgSaemi];
                      return [...colB, ...colB].map((src, i) => (
                        <img key={i} src={src} alt="" className="gallery-img" loading="lazy" fetchPriority="low" decoding="async" />
                      ));
                    })()}
                  </div>
                </div>
                <div className="gallery-fade-top"    aria-hidden="true" />
                <div className="gallery-fade-bottom" aria-hidden="true" />
                <div className="gallery-label"       aria-hidden="true">
                  <span className="gallery-dot" />
                  <span>Chambing</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section
        className="how-section"
        aria-labelledby="how-title"
        itemScope
        itemType="https://schema.org/HowTo"
      >
        <meta itemProp="name" content={t('home.howItWorks.title')} />
        <div className="sec-wrap">
          <header className="sec-head sec-head--center">
            <span className="how-badge" aria-hidden="true">{t('home.howItWorks.badge')}</span>
            <h2 id="how-title" className="sec-title">{t('home.howItWorks.title')}</h2>
            <p className="sec-sub">{t('home.howItWorks.subtitle')}</p>
          </header>

          <div className="steps-grid">
            {[
              {
                n: '01',
                icon: <Search size={24} strokeWidth={1.75} />,
                title: t('home.howItWorks.step1.title'),
                desc:  t('home.howItWorks.step1.desc'),
                color: '#233DFF',
              },
              {
                n: '02',
                icon: <Users size={24} strokeWidth={1.75} />,
                title: t('home.howItWorks.step2.title'),
                desc:  t('home.howItWorks.step2.desc'),
                color: '#7C3AED',
              },
              {
                n: '03',
                icon: <CheckCircle size={24} strokeWidth={1.75} />,
                title: t('home.howItWorks.step3.title'),
                desc:  t('home.howItWorks.step3.desc'),
                color: '#059669',
              },
            ].map((step, i) => (
              <article
                key={i}
                className="step-card"
                itemScope
                itemType="https://schema.org/HowToStep"
                itemProp="step"
              >
                <div className="step-icon-wrap" aria-hidden="true" style={{ '--step-color': step.color }}>
                  {step.icon}
                </div>
                <div className="step-content">
                  <span className="step-num" aria-hidden="true">{step.n}</span>
                  <h3 className="step-title" itemProp="name">{step.title}</h3>
                  <p className="step-desc"  itemProp="text">{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CAROUSELS ══════ */}
      {loadingWorkers ? (
        <div className="workers-loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>{t('home.workers.loading')}</p>
        </div>
      ) : (
        <>
          {featuredWorkers.length > 0 && (
            <Carrousel
              workers={featuredWorkers}
              title={t('home.workers.featured')}
              subtitle={t('home.workers.featuredSubtitle')}
            />
          )}
          {topRatedWorkers.length > 0 && (
            <Carrousel
              workers={topRatedWorkers}
              title={t('home.workers.topRated')}
              subtitle={t('home.workers.topRatedSubtitle')}
            />
          )}
        </>
      )}

      {/* ══════ STATS ══════ */}
      <section className="stats-section" aria-label="Estadísticas de Chambing">
        <div className="sec-wrap">
          <div className="stats-grid">
            {[
              { n: '5,000+',  label: t('home.stats.verifiedProfessionals'), icon: <Users size={24} strokeWidth={1.75} /> },
              { n: '15,000+', label: t('home.stats.completedServices'),     icon: <TrendingUp size={24} strokeWidth={1.75} /> },
              { n: '4.8/5',   label: t('home.stats.averageRating'),         icon: <Star size={24} strokeWidth={1.75} /> },
              { n: '98%',     label: t('home.stats.satisfiedClients'),      icon: <CheckCircle size={24} strokeWidth={1.75} /> },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <span className="stat-icon" aria-hidden="true">{s.icon}</span>
                <span className="stat-number">{s.n}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="features-section" aria-labelledby="features-title">
        <div className="sec-wrap">
          <header className="sec-head">
            <h2 id="features-title" className="sec-title">{t('home.features.title')}</h2>
            <p className="sec-sub">{t('home.features.subtitle')}</p>
          </header>

          <div className="features-grid">
            {features.map((f, i) => (
              <article key={i} className="feature-card">
                <span className="feature-num" aria-hidden="true">0{i + 1}</span>
                <div className="feature-icon-wrap" aria-hidden="true">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="testimonials-section" aria-labelledby="testi-title">
        <div className="sec-wrap">
          <header className="sec-head sec-head--center">
            <span className="testi-badge" aria-hidden="true">
              <Star size={12} strokeWidth={2.5} fill="currentColor" />
              {t('home.testimonials.badge')}
            </span>
            <h2 id="testi-title" className="sec-title">{t('home.testimonials.title')}</h2>
            <p className="sec-sub">{t('home.testimonials.subtitle')}</p>
          </header>

          <div className="testimonials-grid">
            {testimonials.map((item, i) => (
              <article
                key={i}
                className={`testimonial-card${item.featured ? ' testimonial-card--featured' : ''}`}
                itemScope
                itemType="https://schema.org/Review"
              >
                {/* Quote SVG icon */}
                <svg className="tcard-quote-icon" aria-hidden="true" width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M0 24V14.4C0 10.08 1.12 6.6 3.36 3.96C5.68 1.32 8.88 0 12.96 0V4.56C10.72 4.56 9.04 5.28 7.92 6.72C6.88 8.08 6.36 9.92 6.36 12.24H12.96V24H0ZM19.04 24V14.4C19.04 10.08 20.16 6.6 22.4 3.96C24.72 1.32 27.92 0 32 0V4.56C29.76 4.56 28.08 5.28 26.96 6.72C25.92 8.08 25.4 9.92 25.4 12.24H32V24H19.04Z" fill="currentColor"/>
                </svg>

                {/* Stars + service tag row */}
                <div className="tcard-top">
                  <StarRating value={item.rating} />
                  <span className="tcard-service-tag">{item.service}</span>
                </div>

                <blockquote className="tcard-comment" itemProp="reviewBody">
                  {item.comment}
                </blockquote>

                <footer className="tcard-footer">
                  <div className="tcard-avatar" aria-hidden="true">
                    {item.name.charAt(0)}
                  </div>
                  <div className="tcard-info">
                    <span className="tcard-name" itemProp="author">{item.name}</span>
                    <span className="tcard-location">{item.location}</span>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ DUAL CTA ══════ */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="sec-wrap">
          <h2 id="cta-title" className="cta-title">{t('home.cta.title')}</h2>
          <p className="cta-subtitle">{t('home.cta.subtitle')}</p>

          {!isAuthenticated && (
            <div className="cta-cards">
              <div className="cta-card cta-card--light">
                <h3 className="cta-card-title">{t('home.cta.familyTitle')}</h3>
                <p className="cta-card-desc">{t('home.cta.familyDesc')}</p>
                <button
                  className="custom-btn custom-btn-primary"
                  onClick={() => navigate('/search')}
                  type="button"
                >
                  {t('home.cta.findProfessional')}
                  <ArrowRight size={16} strokeWidth={2} style={{ marginLeft: 6 }} />
                </button>
              </div>
              <div className="cta-card cta-card--blue">
                <h3 className="cta-card-title">{t('home.cta.workerTitle')}</h3>
                <p className="cta-card-desc">{t('home.cta.workerDesc')}</p>
                <button
                  className="custom-btn cta-btn-outline-white"
                  onClick={() => navigate('/register')}
                  type="button"
                >
                  {t('home.cta.createAccount')}
                  <ArrowRight size={16} strokeWidth={2} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="cta-actions-single">
              <button
                className="custom-btn custom-btn-primary custom-btn-large"
                onClick={() => navigate('/dashboard')}
                type="button"
              >
                {t('home.hero.dashboard')}
                <ArrowRight size={16} strokeWidth={2} style={{ marginLeft: 6 }} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
