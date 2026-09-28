import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const MODES = [
  {name: 'Greenfield', text: 'Set up a new project from scratch, in the same order every time.'},
  {name: 'Brownfield', text: 'Converge an existing repository on the structure without overwriting operator work.'},
  {name: 'Any project type', text: 'Code, business process, skill development, or research and docs.'},
];

const READ = [
  {to: '/docs/', title: 'Overview', text: 'What every project ends up with, and the stages that get it there.'},
  {to: '/docs/guide', title: 'Every step, explained', text: 'The original run, step by step: why each step exists and what to parameterize.'},
  {to: '/docs/reference/stages', title: 'Stage contracts', text: 'Commands, checks and edge cases for each stage, greenfield and brownfield.'},
  {to: '/docs/reference/lessons', title: 'Lessons', text: 'Real failures and the fix each stage now applies automatically.'},
];

export default function Home() {
  return (
    <Layout title="Set up any project the KnowMe way" description="One skill that sets up or converts any project into the KnowMe working structure.">
      <main>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>KnowMe · project setup skill</p>
            <h1 className={styles.title}>One structure for every project, set up the same way.</h1>
            <p className={styles.lede}>
              <code>knowme-project-setup</code> installs OpenSpec for your whole agent fleet, KBD orchestration, the Prometheus
              context, an agent team, design tools and a branded docs site, then verifies all of it.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/">
                Read the documentation
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/guide">
                Every step, explained
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.band} aria-labelledby="modes-heading">
          <div className="container">
            <h2 id="modes-heading" className={styles.sectionTitle}>Works wherever you start</h2>
            <ul className={styles.outcomes}>
              {MODES.map((m) => (
                <li key={m.name} className={`${styles.outcome} ${styles.mode}`}>
                  <span className={styles.outcomeName}>{m.name}</span>
                  <span>{m.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.read} aria-labelledby="read-heading">
          <div className="container">
            <h2 id="read-heading" className={styles.sectionTitle}>Start here</h2>
            <ul className={styles.cards}>
              {READ.map((r) => (
                <li key={r.title}>
                  <Link className={styles.card} to={r.to}>
                    <span className={styles.cardTitle}>{r.title}</span>
                    <span className={styles.cardText}>{r.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </Layout>
  );
}
