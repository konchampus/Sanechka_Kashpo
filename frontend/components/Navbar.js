import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Navbar.module.css';
import { FaVk, FaInstagram, FaWhatsapp, FaUserCircle } from 'react-icons/fa';
import Cookies from 'js-cookie';

export default function CustomNavbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [canShowBurger, setCanShowBurger] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(Cookies.get('role') === 'admin');
      setIsAuth(!!Cookies.get('token'));
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 1280);
        setMenuOpen(false);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      // Подписка на глобальное событие авторизации
      const handleAuthChange = () => {
        setIsAdmin(Cookies.get('role') === 'admin');
        setIsAuth(!!Cookies.get('token'));
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      };
      window.addEventListener('authChange', handleAuthChange);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('authChange', handleAuthChange);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (menuOpen) {
        setCanShowBurger(false);
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }, [menuOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      };
      updateCart();
      window.addEventListener('storage', updateCart);
      return () => window.removeEventListener('storage', updateCart);
    }
  }, []);

  const navLinks = [
    { href: '/shop', label: 'Магазин' },
    { href: '/about', label: 'О нас' },
    { href: '/delivery', label: 'Доставка и оплата' },
    { href: '/contacts', label: 'Контакты' },
    { href: '/faq', label: 'Частые вопросы' },
  ];
  if (isAdmin) navLinks.push({ href: '/admin', label: 'Админ' });

  return (
    <nav className={styles.navbar + ' shadow-sm'}>
      <div className={styles.container}>
        <div className={styles.logoBlock}>
          <Link href="/" className={styles.logoLink}>
            <img src="/images/logo.png" alt="SanRottan" className={styles.logoImg} />
            <span className={styles.logoText}>SanRottan</span>
          </Link>
        </div>
        <div className={styles.linksDesktop + (isMobile ? ' ' + styles.hide : '')}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={router.pathname.startsWith(link.href) ? styles.activeLink : styles.link}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.profileWrapper + (isMobile ? ' ' + styles.hide : '')}>
          <Link href="/cart" className={styles.cartBtn}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h2l.4 2M7 13h10l4-8H5.4"/><path d="M7 13L5.4 5M7 13l-2 4h13"/></svg>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>
                {cartCount > 9 ? '+9' : cartCount}
              </span>
            )}
          </Link>
          {isAuth ? (
            <Link href="/account" className={styles.profileBtn}>
              <span className={styles.profileIconWrap}>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" className={styles.profileIcon} height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>
              </span>
              <span className={styles.profileText}>Профиль</span>
            </Link>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              <span className={styles.profileIconWrap}>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" className={styles.profileIcon} height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>
              </span>
              <span className={styles.profileText}>Вход</span>
            </Link>
          )}
        </div>
        {canShowBurger && !menuOpen && (
          <button
            className={styles.burger}
            onClick={() => setMenuOpen(true)}
            aria-label="Открыть меню"
            style={{ display: isMobile ? 'flex' : 'none' }}
          >
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
        </button>
        )}
        <AnimatePresence onExitComplete={() => setCanShowBurger(true)}>
          {menuOpen && (
            <>
              <motion.div
                className={styles.mobileOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                className={styles.mobileMenu}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <button className={styles.closeBtn} onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="5" y1="5" x2="17" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="17" y1="5" x2="5" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div className={styles.mobileMenuLinks}>
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={router.pathname.startsWith(link.href) ? styles.activeLink : styles.link}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    key="/cart"
                    href="/cart"
                    className={router.pathname.startsWith('/cart') ? styles.activeLink : styles.link}
                    onClick={() => setMenuOpen(false)}
                  >
                    Корзина
                  </Link>
                  <div className={styles.mobileProfileBlock}>
                  {isAuth ? (
                      <Link href="/account" className={styles.mobileProfileBtn} onClick={() => setMenuOpen(false)}>
                        <span style={{ display: 'flex', alignItems: 'center', margin: '0 auto', color: '#7A5C3A' }}>
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" style={{ color: '#7A5C3A', marginRight: 4 }} height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>
                        </span>
                        <span className={styles.mobileProfileText}>Профиль</span>
                    </Link>
                  ) : (
                      <Link href="/login" className={styles.mobileProfileBtn} onClick={() => setMenuOpen(false)}>
                        <span style={{ display: 'flex', alignItems: 'center', margin: '0 auto', color: '#7A5C3A' }}>
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" style={{ color: '#7A5C3A', marginRight: 4 }} height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>
                        </span>
                        <span className={styles.mobileProfileText}>Вход</span>
                    </Link>
                  )}
                  </div>
                </div>
                <div className={styles.mobileMenuSocials} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
                  <a href="https://vk.com/sanrottan" target="_blank" rel="noopener noreferrer" aria-label="VK" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#E8D9B8"/>
                      <path d="M12.714 17C7.248 17 4.13 13.246 4 7h2.738c.09 4.585 2.109 6.527 3.708 6.927V7h2.578v3.954c1.58-.17 3.238-1.972 3.798-3.954H19.4c-.43 2.442-2.228 4.244-3.507 4.985 1.279.6 3.328 2.172 4.107 5.015h-2.838c-.61-1.902-2.129-3.373-4.138-3.574V17h-.31z" fill="#7A5C3A"/>
                    </svg>
                    <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2 }}>VK</span>
                  </a>
                  <a href="https://instagram.com/sanrottan" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"/><rect x="11" y="11" width="14" height="14" rx="5" stroke="#7A5C3A" strokeWidth="2"/><circle cx="18" cy="18" r="4" stroke="#7A5C3A" strokeWidth="2"/><circle cx="24.2" cy="12.2" r="1.2" fill="#7A5C3A"/></svg>
                    <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2 }}>Instagram</span>
                  </a>
                  <a href="https://t.me/Sanrottan74" target="_blank" rel="noopener noreferrer" aria-label="Telegram" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"/><path d="M11 18.5L25 13.5C25.5 13.3 26 13.7 25.9 14.3L23.6 25.1C23.5 25.7 22.7 25.9 22.3 25.4L18.7 21.1C18.3 20.6 17.5 20.6 17.1 21.1L15.2 23.7C14.8 24.2 14 24 13.9 23.4L11.1 19.1C10.8 18.7 11.2 18.3 11.7 18.5Z" stroke="#7A5C3A" strokeWidth="2" fill="#E8D9B8"/></svg>
                    <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2 }}>Telegram</span>
                  </a>
                  <a href="tel:+79127721818" target="_blank" rel="noopener noreferrer" aria-label="Телефон" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#E8D9B8"/>
                      <path d="M20.186 19.742c1.15-1.15.883-2.424.404-2.707-.336-.198-4.749-2.684-4.749-2.684-.344-.216-.686-.106-.893.142l-.005-.004-1.626 1.625a.674.674 0 0 1-.824.1 14.052 14.052 0 0 1-2.632-2.075 14.054 14.054 0 0 1-2.074-2.632.674.674 0 0 1 .1-.824L9.51 9.057l-.004-.005c.243-.203.361-.544.143-.893 0 0-2.487-4.413-2.685-4.75-.283-.478-1.556-.745-2.707.405-2.566 2.568-1.081 8.207 3.32 12.608 4.398 4.399 10.04 5.887 12.608 3.32z" fill="#7A5C3A"/>
                    </svg>
                    <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2 }}>Позвонить</span>
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}