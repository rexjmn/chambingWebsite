import { useTranslations } from '../../hooks/useTranslations';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import '../../styles/footer.scss';

const Footer = () => {
  const { t, translateService } = useTranslations();

  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__grid">

          {/* Brand */}
          <div className="site-footer__col">
            <h3 className="site-footer__brand">ChambingApp</h3>
            <p className="site-footer__desc">{t('footer.description')}</p>
            <div className="site-footer__social">
              <a href="#" className="site-footer__social-btn" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="site-footer__social-btn" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">{t('footer.services')}</h4>
            <nav className="site-footer__links">
              <a href="#" className="site-footer__link">{translateService('domesticCleaning')}</a>
              <a href="#" className="site-footer__link">{translateService('plumbing')}</a>
              <a href="#" className="site-footer__link">{translateService('electricity')}</a>
              <a href="#" className="site-footer__link">{translateService('gardening')}</a>
            </nav>
          </div>

          {/* Company */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">{t('footer.company')}</h4>
            <nav className="site-footer__links">
              <a href="#" className="site-footer__link">{t('footer.about')}</a>
              <a href="#" className="site-footer__link">{t('footer.terms')}</a>
              <a href="#" className="site-footer__link">{t('footer.privacy')}</a>
              <a href="#" className="site-footer__link">{t('footer.help')}</a>
            </nav>
          </div>

          {/* Contact */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">{t('footer.contact')}</h4>
            <ul className="site-footer__contact">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>{t('footer.email')}</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.21 1.22 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.08-.54a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <span>{t('footer.phone')}</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{t('footer.address')}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="site-footer__bottom">
          <p>{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
