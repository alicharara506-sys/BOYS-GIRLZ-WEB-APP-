import { Link } from "react-router";
import { business } from "../config/business";
import { localizedMeta } from "../config/meta";
import { useLocale } from "../i18n/Locale";

const faqs = [
  { question: "Where does Boys & Girlz deliver?", answer: "We deliver within Lebanon only. Delivery is free on orders over $99." },
  { question: "Can I pay on delivery?", answer: "Cash on Delivery is available for orders within Lebanon." },
  { question: "What is the returns policy?", answer: "Our returns policy is being confirmed. Please contact the shop before ordering if you need return or exchange details." },
  { question: "How do I choose a size?", answer: "Children's clothes use New Born through 5–6 Years. Maternity uses S through XXL. Check each product's available sizes and contact us for fit details." },
  { question: "What does Like New mean?", answer: "Like New outlet items are pre-owned pieces in excellent condition at reduced prices." },
];

export const meta = localizedMeta("Frequently asked questions", "Answers about Boys & Girlz delivery in Lebanon, Cash on Delivery, returns, sizes and Like New outlet items.", "/faq");

export default function FAQ() {
  const { language, t } = useLocale();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: t(question),
      acceptedAnswer: { "@type": "Answer", text: t(answer) },
    })),
  };
  return (
    <div className="page-width help-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="page-heading">
        <span className="eyebrow">{t("Here to help")}</span>
        <h1>{t("Frequently asked questions")}</h1>
        <p>{language === "ar" ? `إجابات عن التسوّق من ${business.name} في لبنان.` : `Answers about shopping with ${business.name} in Lebanon.`}</p>
      </div>
      {faqs.map(({ question, answer }) => <section key={question}><h2>{t(question)}</h2><p>{t(answer)}</p></section>)}
      <Link className="btn btn-blue" to="/contact">{t("Contact us")}</Link>
    </div>
  );
}
