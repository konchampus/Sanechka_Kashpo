import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/FAQ.module.css';

const faqs = [
  {
    question: 'Что такое Ротанг?',
    answer: 'Ротанг — это современный материал, созданный для имитации внешнего вида и текстуры натурального ротанга, но обладающий совершенно другими свойствами и составом. Его основная цель — предложить более практичную, долговечную и доступную альтернативу натуральному материалу, особенно для использования на открытом воздухе или в местах с высокой влажностью.'
  },
  {
    question: 'Преимущества Ротанга?',
    answer: (
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        <li>Высокая устойчивость к погодным условиям: не боится дождя, снега, влажности, не гниет, не плесневеет. Идеален для сада, террасы, балкона, бассейна.</li>
        <li>Устойчивость к ультрафиолету: не выгорает на солнце, сохраняет цвет годами (дешёвый PVC может выгорать).</li>
        <li>Простота ухода: легко моется водой с мылом или обычными моющими средствами. Не требует специальной обработки маслами или лаками.</li>
        <li>Долговечность: не рассыхается, не трескается от перепадов температур и влаги при условии качественного материала.</li>
        <li>Большое разнообразие: широкая гамма цветов (включая яркие и нейтральные), текстур, толщин.</li>
        <li>Стабильность: не меняет форму со временем, в отличие от натурального, который может немного «играть».</li>
      </ul>
    )
  },
  {
    question: 'Уход за изделиями из ротанга?',
    answer: (
      <>
        <div>Ротанг сочетает экологичность, прочность и минимализм в уходе — его главное преимущество в том, что он не требует сложного обслуживания, сохраняя эстетику десятилетиями.<br/>Для поддержания привлекательного вида и долговечности изделий из ротанга достаточно соблюдать простые правила ухода:</div>
        <ol style={{ paddingLeft: 18, margin: '8px 0 0 0' }}>
          <li>Регулярная очистка: протирание влажной губкой, мягкой тканью или щеткой с мыльным раствором. Сильные загрязнения удаляются мягкими моющими средствами без абразивов.</li>
          <li>Глубокая чистка: обливание водой из шланга (для садовой мебели), обработка мягкой щеткой. Допустимо использование бытовых моющих средств для пластика.</li>
          <li>Сушка: естественное высыхание на воздухе или протирание сухой тканью.</li>
        </ol>
      </>
    )
  },
  {
    question: 'Хранение в зимнее время?',
    answer: (
      <>
        <div>Эксплуатация изделий из ротанга зимой имеет особенности, связанные не с морозостойкостью материала (он выдерживает до -30°C), а с защитой от загрязнений и влаги в период таяния снега.<br/>Вот ключевые рекомендации:</div>
        <ol style={{ paddingLeft: 18, margin: '8px 0 0 0' }}>
          <li>Уборка под навес (веранда, теплица, гараж).</li>
          <li>Использование мешков/чехлов (если нет навеса).</li>
        </ol>
        <div style={{ marginTop: 6 }}>Минимизируйте контакт с влажной землёй, и изделия десятилетиями сохранят свой первозданный вид.</div>
      </>
    )
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <div className={styles.faqContainer}>
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            className={styles.faqItem + ' ' + (openIndex === index ? styles.activeItem : '')}
            initial={false}
            animate={openIndex === index ? { boxShadow: '0 4px 18px rgba(74,112,67,0.10)', background: 'rgba(232,217,184,0.13)' } : { boxShadow: 'none', background: '#fff' }}
            transition={{ duration: 0.25 }}
          >
            <button
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index}
              style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: 12 }}
            >
              <span>{faq.question}</span>
              <motion.span
                initial={false}
                animate={{ rotate: openIndex === index ? 90 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'inline-block' }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 9l4 4 4-4" stroke="#7A5C3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={styles.faqAnswer}
                >
                  <p style={{ margin: '10px 0 0 0' }}>{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <motion.div
        className={styles.faqContactBlock}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h3 className={styles.faqContactTitle}>Остались вопросы?</h3>
        <p className={styles.faqContactText}>Свяжитесь с нами удобным способом — мы поможем!</p>
        <a href="https://t.me/Sanrottan" target="_blank" rel="noopener noreferrer" className={styles.faqContactBtn}>
          Telegram
        </a>
      </motion.div>
    </>
  );
}
