'use client';

import styles from '../PersonnelCardDemo.module.css';

export function PersonnelCardV1() {
  return (
    <div className={styles.designWrapper}>
      <div className={styles.v1Container}>
        {/* Main Content Grid */}
        <div className={styles.v1Grid}>
          {/* Left - Profile Card */}
          <div className={styles.v1ProfileCard}>
            <div className={styles.v1ProfileImageWrapper}>
              <img
                alt="Önder Terzi Profile"
                className={styles.v1ProfileImage}
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
              />
              <span className={styles.v1OnlineIndicator}></span>
            </div>
            <h2 className={styles.v1ProfileName}>Önder Terzi</h2>
            <div className={styles.v1ProfileBadge}>Eigener Mitarbeiter</div>
            <div className={styles.v1ProfileMeta}>
              <div className={styles.v1ProfileMetaRow}>
                <span className={styles.v1MetaLabel}>Position</span>
                <span className={styles.v1MetaValue}>Fahrer</span>
              </div>
              <div className={styles.v1ProfileMetaRow}>
                <span className={styles.v1MetaLabel}>Kunde</span>
                <span className={styles.v1MetaValue}>Amazon (AMZL)</span>
              </div>
            </div>
          </div>

          {/* Right - Data Section */}
          <div className={styles.v1DataCard}>
            <div className={styles.v1DataHeader}>
              <h3>Personaldaten & Stammdaten</h3>
              <div className={styles.v1DataActions}>
                <button className={styles.v1ActionBtn}>+ SONDERURLAUB</button>
                <button className={styles.v1ActionBtn}>+ URLAUB HINZUFÜGEN</button>
              </div>
            </div>
            <div className={styles.v1DataGrid}>
              {/* Contract Data */}
              <div className={styles.v1DataSection}>
                <h4 className={styles.v1SectionTitle}>Vertragsdaten</h4>
                <div className={styles.v1DataRow}>
                  <span>Personalnummer</span>
                  <span>52</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Eintrittsdatum</span>
                  <span>16.01.2019 (Vertrag)</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Austrittsdatum</span>
                  <span>Kein Enddatum</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Standard/Station</span>
                  <span>Best4Tires - Straelen</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>EU Bürger</span>
                  <span className={styles.v1CheckIcon}>✓</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Amazon ID</span>
                  <span className={styles.v1HighlightYellow}>A19284DY46K772</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>DATEV ID</span>
                  <span className={styles.v1HighlightOrange}>Nicht eingetragen!</span>
                </div>
              </div>

              {/* Personal Data */}
              <div className={styles.v1DataSection}>
                <h4 className={styles.v1SectionTitle}>Persönliche Daten</h4>
                <div className={styles.v1DataRow}>
                  <span>Geburtsdatum</span>
                  <span>29.03.1965 (60 Jahre)</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Geburtsort</span>
                  <span>Essen</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Staatsangeh.</span>
                  <span>Deutschland</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Straße</span>
                  <span>Am Werhahn 81</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>PLZ / Stadt</span>
                  <span>40211 Düsseldorf</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>Telefon</span>
                  <span>01773575368</span>
                </div>
                <div className={styles.v1DataRow}>
                  <span>E-Mail</span>
                  <span className={styles.v1EmailLink}>terzika@onway-gmbh.de</span>
                </div>
              </div>
            </div>
            <div className={styles.v1DataFooter}>
              <button className={styles.v1TabBtn + ' ' + styles.active}>AUSWEIS & FÜHRERSCHEIN</button>
              <button className={styles.v1TabBtn}>BANK & STEUER</button>
              <button className={styles.v1TabBtn}>VERSICHERUNGSDATEN</button>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className={styles.v1StatsRow}>
          {/* Sick Days */}
          <div className={styles.v1StatsCard}>
            <h3>Krankheitstage</h3>
            <p className={styles.v1StatsSub}>MEF: 0.3% (Muster Erkennungsfaktor)</p>
            <table className={styles.v1StatsTable}>
              <thead>
                <tr>
                  <th>Jahr</th>
                  <th>Anzahl</th>
                  <th>MEF</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2024</td>
                  <td>11</td>
                  <td>1.9%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Vacation Days */}
          <div className={styles.v1StatsCard}>
            <h3>Urlaubstage</h3>
            <div className={styles.v1VacationList}>
              <div className={styles.v1VacationRow}>
                <span>Urlaubstage dieses Jahr</span>
                <span>12,0</span>
              </div>
              <div className={styles.v1VacationRow}>
                <span>Sonderurlaubstage</span>
                <span>0,0</span>
              </div>
              <div className={styles.v1VacationRowRed}>
                <span>Urlaub genommen</span>
                <span>0,0</span>
              </div>
              <div className={styles.v1VacationRowRed}>
                <span>Resturlaub Vorjahr</span>
                <span>13,8</span>
              </div>
              <div className={styles.v1VacationRowTotal}>
                <span>Resturlaubstage dieses Jahr</span>
                <span>25,8</span>
              </div>
            </div>
          </div>

          {/* Unpaid Leave */}
          <div className={styles.v1StatsCard + ' ' + styles.v1CenterCard}>
            <div className={styles.v1IconCircle}>
              <span>📅</span>
            </div>
            <h3>Unbezahlter Urlaub</h3>
            <p>dieses Jahr</p>
            <div className={styles.v1BigNumber}>0 <span>Tage</span></div>
          </div>
        </div>

        {/* Fines & Deductions */}
        <div className={styles.v1TablesRow}>
          <div className={styles.v1TableCard}>
            <div className={styles.v1TableHeader}>
              <h3>Bußgelder ()</h3>
            </div>
            <table className={styles.v1Table}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Kennzeichen</th>
                  <th>Verstoß</th>
                  <th>Betrag</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className={styles.v1EmptyRow}>Keine Bußgelder vorhanden</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.v1TableCard}>
            <div className={styles.v1TableHeader + ' ' + styles.v1TableHeaderRed}>
              <h3>Lohnabzüge (73)</h3>
            </div>
            <div className={styles.v1TableScroll}>
              <table className={styles.v1Table}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Verstoß</th>
                    <th>Betrag</th>
                    <th>Status</th>
                    <th>Option</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>27.12.2025</td>
                    <td>Dienstfahrzeug - Privatfahrt</td>
                    <td>10,07 €</td>
                    <td><span className={styles.v1BadgeRed}>Nicht bezahlt</span></td>
                    <td>✏️</td>
                  </tr>
                  <tr>
                    <td>26.12.2025</td>
                    <td>Dienstfahrzeug - Privatfahrt</td>
                    <td>8,40 €</td>
                    <td><span className={styles.v1BadgeRed}>Nicht bezahlt</span></td>
                    <td>✏️</td>
                  </tr>
                  <tr>
                    <td>13.12.2025</td>
                    <td>Abschleppung</td>
                    <td>609,17 €</td>
                    <td><span className={styles.v1BadgeRed}>Nicht bezahlt</span></td>
                    <td>✏️</td>
                  </tr>
                  <tr>
                    <td>15.11.2025</td>
                    <td>Dienstfahrzeug - Privatfahrt</td>
                    <td>269,26 €</td>
                    <td><span className={styles.v1BadgeGreen}>Bezahlt</span></td>
                    <td>✏️</td>
                  </tr>
                  <tr>
                    <td>08.11.2025</td>
                    <td>Dienstfahrzeug - Privatfahrt</td>
                    <td>178,50 €</td>
                    <td><span className={styles.v1BadgeGreen}>Bezahlt</span></td>
                    <td>✏️</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
