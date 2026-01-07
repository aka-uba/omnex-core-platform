'use client';

import { useState } from 'react';
import styles from '../PersonnelCardDemo.module.css';

export function PersonnelCardV2() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className={styles.designWrapper}>
      <div className={styles.v2Container}>
        {/* Profile Header Card */}
        <div className={styles.v2ProfileCard}>
          <div className={styles.v2ProfileFlex}>
            {/* Profile Image */}
            <div className={styles.v2ProfileImageWrapper}>
              <img
                alt="Önder Terzi"
                className={styles.v2ProfileImage}
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
              />
              <div className={styles.v2ProfileImageOverlay}>
                <span>✏️</span>
              </div>
              <div className={styles.v2ProfileBadge}>Eigener Mitarbeiter</div>
            </div>

            {/* Profile Info */}
            <div className={styles.v2ProfileInfo}>
              <div className={styles.v2ProfileTop}>
                <div>
                  <h2 className={styles.v2ProfileName}>Önder Terzi</h2>
                  <p className={styles.v2ProfileMeta}>
                    <span>🏷️</span> Personalnummer: 52
                  </p>
                </div>
                <div className={styles.v2ProfileActions}>
                  <button className={styles.v2BtnPrimary}>
                    <span>⏱️</span> Zeiterfassung
                  </button>
                  <button className={styles.v2BtnSecondary}>
                    <span>✏️</span> Bearbeiten
                  </button>
                  <button className={styles.v2BtnDanger}>
                    <span>🗑️</span> Löschen
                  </button>
                </div>
              </div>
              <div className={styles.v2ProfileQuickActions}>
                <button className={styles.v2QuickBtn}>📁 Unterlagen</button>
                <button className={styles.v2QuickBtn}>📄 Arbeitsverträge</button>
                <button className={styles.v2QuickBtn}>🚗 Testfahrt</button>
                <button className={styles.v2QuickBtnWarning}>⚠️ Alarm</button>
                <button className={styles.v2QuickBtn}>📜 Logs</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className={styles.v2TabsNav}>
          <button
            className={`${styles.v2TabBtn} ${activeTab === 'personal' ? styles.active : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personaldaten & Stamm
          </button>
          <button
            className={`${styles.v2TabBtn} ${activeTab === 'leave' ? styles.active : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            Abwesenheit & Urlaub
          </button>
          <button
            className={`${styles.v2TabBtn} ${activeTab === 'financial' ? styles.active : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            Finanzen & Lohn
          </button>
        </div>

        {/* Tab Content: Personal */}
        {activeTab === 'personal' && (
          <div className={styles.v2TabContent}>
            <div className={styles.v2DataGrid}>
              {/* Personal Data Table */}
              <div className={styles.v2DataCard}>
                <div className={styles.v2CardHeader}>
                  <h3>Personaldaten</h3>
                </div>
                <table className={styles.v2DataTable}>
                  <tbody>
                    <tr><td>Personalnummer</td><td>52</td></tr>
                    <tr><td>Position</td><td>Fahrer</td></tr>
                    <tr><td>Kunde</td><td>Amazon (AMZL)</td></tr>
                    <tr><td>Eintrittsdatum</td><td>16.01.2019 (Vertrag)</td></tr>
                    <tr><td>Austrittsdatum</td><td className={styles.v2Muted}>Kein Enddatum (Vertrag)</td></tr>
                    <tr><td>Subunternehmen</td><td>-</td></tr>
                    <tr><td>Standard/Station</td><td>Best4Tires - Straelen</td></tr>
                    <tr><td>EU Bürger</td><td className={styles.v2GreenCheck}>✓</td></tr>
                    <tr className={styles.v2WarningRow}><td>DATEV ID</td><td className={styles.v2WarningText}>Nicht eingetragen!</td></tr>
                    <tr><td>Background-Check Nr.</td><td>440451802</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Master Data Table */}
              <div className={styles.v2DataCard}>
                <div className={styles.v2CardHeader}>
                  <h3>Stammdaten</h3>
                </div>
                <table className={styles.v2DataTable}>
                  <tbody>
                    <tr><td>Geburtsdatum</td><td>29.03.1965</td></tr>
                    <tr><td>Alter</td><td>60 Jahre</td></tr>
                    <tr><td>Geburtsort</td><td>Essen</td></tr>
                    <tr><td>Staatsangehörigkeit</td><td>Deutschland</td></tr>
                    <tr><td>Straße und Hausnummer</td><td>Am Werhahn 81</td></tr>
                    <tr><td>PLZ und Stadt</td><td>40211 Düsseldorf</td></tr>
                    <tr><td>Telefon</td><td className={styles.v2Link}>01773575368</td></tr>
                    <tr><td>E-Mail</td><td className={styles.v2Link}>terzika@onway-gmbh.de</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={styles.v2QuickActionsBar}>
              <div className={styles.v2QuickActionsLeft}>
                <button className={styles.v2SecondaryBtn}>Ausweis & Führerschein</button>
                <button className={styles.v2SecondaryBtn}>Bank & Steuer</button>
                <button className={styles.v2SecondaryBtn}>Versicherungsdaten</button>
              </div>
              <div className={styles.v2QuickActionsRight}>
                <button className={styles.v2PrimaryOutlineBtn}>+ Sonderurlaub</button>
                <button className={styles.v2PrimaryOutlineBtn}>+ Urlaub-/Krankheit Hinzufügen</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Leave */}
        {activeTab === 'leave' && (
          <div className={styles.v2TabContent}>
            <div className={styles.v2StatsGrid}>
              {/* Sick Days */}
              <div className={styles.v2StatsCard}>
                <h3>Krankheitstage <span className={styles.v2StatsSub}>(MEF = 0.3%)</span></h3>
                <table className={styles.v2StatsTable}>
                  <thead>
                    <tr><th>Jahr</th><th>Anzahl</th><th>MEF</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>2024</td><td>11</td><td>1.9%</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Vacation Days */}
              <div className={styles.v2StatsCard}>
                <h3>Urlaubstage</h3>
                <div className={styles.v2VacationList}>
                  <div className={styles.v2VacationRow}>
                    <span>Urlaubstage dieses Jahr</span>
                    <span>12,0</span>
                  </div>
                  <div className={styles.v2VacationRow}>
                    <span>Sonderurlaubstage</span>
                    <span>0,0</span>
                  </div>
                  <div className={styles.v2VacationRowRed}>
                    <span>Urlaub genommen</span>
                    <span>0,0</span>
                  </div>
                  <div className={styles.v2VacationRowRed}>
                    <span>Resturlaub Vorjahr</span>
                    <span>13,8</span>
                  </div>
                  <div className={styles.v2VacationRowTotal}>
                    <span>Resturlaubstage dieses Jahr</span>
                    <span>25,8</span>
                  </div>
                </div>
              </div>

              {/* Unpaid Leave */}
              <div className={styles.v2StatsCard}>
                <h3>Unbezahlter Urlaub</h3>
                <div className={styles.v2EmptyState}>
                  Keine Einträge für dieses Jahr (0 Tage)
                </div>
                <h4 className={styles.v2SubHeader}>Zusammenfassung</h4>
                <table className={styles.v2MiniTable}>
                  <thead>
                    <tr><th>Jahr</th><th>Tage</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>2023</td><td>4</td></tr>
                    <tr><td>2025</td><td>1</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calendar Overview */}
            <div className={styles.v2CalendarCard}>
              <h3>Kalenderübersicht</h3>
              <div className={styles.v2CalendarLegend}>
                <span><span className={styles.legendRose}></span> Krank</span>
                <span><span className={styles.legendBlue}></span> Urlaub</span>
                <span><span className={styles.legendGreen}></span> Frei</span>
                <span><span className={styles.legendIndigo}></span> Unbezahlt</span>
              </div>
              <div className={styles.v2CalendarGrid}>
                <div className={styles.v2CalendarHeader}>
                  <div>Jahr</div>
                  <div>Jan</div><div>Feb</div><div>Mär</div><div>Apr</div><div>Mai</div><div>Jun</div>
                  <div>Jul</div><div>Aug</div><div>Sep</div><div>Okt</div><div>Nov</div><div>Dez</div>
                </div>
                <div className={styles.v2CalendarRow}>
                  <div className={styles.v2CalendarYear}>2025</div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeBlue}>Frei (7)</span>
                    <span className={styles.v2CalBadgeIndigo}>Unbez (7)</span>
                  </div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeBlue}>Frei (7)</span>
                    <span className={styles.v2CalBadgeIndigo}>Unbez (7)</span>
                  </div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeIndigo}>Unbez (13)</span>
                  </div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeBlue}>Frei (7)</span>
                  </div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeGreen}>Urlaub (1)</span>
                  </div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeIndigo}>Unbez (1)</span>
                  </div>
                  <div className={styles.v2CalendarCellEmpty}></div>
                  <div className={styles.v2CalendarCellEmpty}></div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeIndigo}>Unbez...</span>
                  </div>
                  <div className={styles.v2CalendarCellEmpty}></div>
                  <div className={styles.v2CalendarCellEmpty}></div>
                  <div className={styles.v2CalendarCell}>
                    <span className={styles.v2CalBadgeBlue}>Urlaub...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Financial */}
        {activeTab === 'financial' && (
          <div className={styles.v2TabContent}>
            <div className={styles.v2FinancialGrid}>
              {/* Fines */}
              <div className={styles.v2FinancialCard}>
                <div className={styles.v2CardHeader}>
                  <h3>Bußgelder</h3>
                </div>
                <table className={styles.v2FinancialTable}>
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Kennzeichen</th>
                      <th>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={3} className={styles.v2EmptyRow}>Keine Bußgelder vorhanden</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div className={styles.v2FinancialCardLarge}>
                <div className={`${styles.v2CardHeader} ${styles.v2CardHeaderRed}`}>
                  <h3>Lohnabzüge (73)</h3>
                  <button className={styles.v2FilterBtn}>Filter</button>
                </div>
                <div className={styles.v2TableScroll}>
                  <table className={styles.v2FinancialTable}>
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
                        <td className={styles.v2Mono}>10,07 €</td>
                        <td><span className={styles.v2BadgeRed}>Nicht bezahlt</span></td>
                        <td>✏️</td>
                      </tr>
                      <tr>
                        <td>26.12.2025</td>
                        <td>Dienstfahrzeug - Privatfahrt</td>
                        <td className={styles.v2Mono}>8,40 €</td>
                        <td><span className={styles.v2BadgeRed}>Nicht bezahlt</span></td>
                        <td>✏️</td>
                      </tr>
                      <tr>
                        <td>13.12.2025</td>
                        <td>Abschleppung</td>
                        <td className={`${styles.v2Mono} ${styles.v2TextRed}`}>609,17 €</td>
                        <td><span className={styles.v2BadgeRed}>Nicht bezahlt</span></td>
                        <td>✏️</td>
                      </tr>
                      <tr>
                        <td>15.11.2025</td>
                        <td>Dienstfahrzeug - Privatfahrt</td>
                        <td className={styles.v2Mono}>269,26 €</td>
                        <td><span className={styles.v2BadgeGreen}>Bezahlt</span></td>
                        <td>✏️</td>
                      </tr>
                      <tr>
                        <td>15.11.2025</td>
                        <td>Dienstfahrzeug - Privatfahrt</td>
                        <td className={styles.v2Mono}>269,26 €</td>
                        <td><span className={styles.v2BadgeGreen}>Bezahlt</span></td>
                        <td>✏️</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
