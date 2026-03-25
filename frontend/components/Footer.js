import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerLogo}>
          <img src="/images/logo.png" alt="SanRottan" className={styles.footerLogoImg} />
          <span className={styles.footerLogoText}>SanRottan</span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/about" className={styles.footerLink}>О нас</Link>
          <Link href="/shop" className={styles.footerLink}>Магазин</Link>
          <Link href="/contacts" className={styles.footerLink}>Контакты</Link>
          <Link href="/faq" className={styles.footerLink}>FAQ</Link>
        </div>
        <div className={styles.footerSocials}>
          <a href="https://vk.com/sanrottan" target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="VK" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#E8D9B8"/>
              <path d="M12.714 17C7.248 17 4.13 13.246 4 7h2.738c.09 4.585 2.109 6.527 3.708 6.927V7h2.578v3.954c1.58-.17 3.238-1.972 3.798-3.954H19.4c-.43 2.442-2.228 4.244-3.507 4.985 1.279.6 3.328 2.172 4.107 5.015h-2.838c-.61-1.902-2.129-3.373-4.138-3.574V17h-.31z" fill="#7A5C3A"/>
            </svg>
            <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2, textDecoration: 'none' }}>VK</span>
          </a>
          <a href="https://instagram.com/sanrottan" target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="Instagram" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"/><rect x="11" y="11" width="14" height="14" rx="5" stroke="#7A5C3A" strokeWidth="2"/><circle cx="18" cy="18" r="4" stroke="#7A5C3A" strokeWidth="2"/><circle cx="24.2" cy="12.2" r="1.2" fill="#7A5C3A"/></svg>
            <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2, textDecoration: 'none' }}>Instagram</span>
          </a>
          <a href="https://t.me/Sanrottan74" target="_blank" rel="noopener noreferrer" className={styles.footerSocial} aria-label="Telegram" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"/><path d="M11 18.5L25 13.5C25.5 13.3 26 13.7 25.9 14.3L23.6 25.1C23.5 25.7 22.7 25.9 22.3 25.4L18.7 21.1C18.3 20.6 17.5 20.6 17.1 21.1L15.2 23.7C14.8 24.2 14 24 13.9 23.4L11.1 19.1C10.8 18.7 11.2 18.3 11.7 18.5Z" stroke="#7A5C3A" strokeWidth="2" fill="#E8D9B8"/></svg>
            <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2, textDecoration: 'none' }}>Telegram</span>
          </a>
          <a href="tel:+79127721818" className={styles.footerSocial} aria-label="Телефон" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#E8D9B8"/>
              <path d="M20.186 19.742c1.15-1.15.883-2.424.404-2.707-.336-.198-4.749-2.684-4.749-2.684-.344-.216-.686-.106-.893.142l-.005-.004-1.626 1.625a.674.674 0 0 1-.824.1 14.052 14.052 0 0 1-2.632-2.075 14.054 14.054 0 0 1-2.074-2.632.674.674 0 0 1 .1-.824L9.51 9.057l-.004-.005c.243-.203.361-.544.143-.893 0 0-2.487-4.413-2.685-4.75-.283-.478-1.556-.745-2.707.405-2.566 2.568-1.081 8.207 3.32 12.608 4.398 4.399 10.04 5.887 12.608 3.32z" fill="#7A5C3A"/>
            </svg>
            <span style={{ color: '#7A5C3A', fontWeight: 600, fontSize: 13, marginTop: 2, textDecoration: 'none' }}>Позвонить</span>
          </a>
        </div>
      </div>
      <div className={styles.footerCopyright}>
        © {new Date().getFullYear()} SanRottan. Все права защищены.
      </div>
    </footer>
  );
}