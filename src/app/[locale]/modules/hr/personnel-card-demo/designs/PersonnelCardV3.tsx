'use client';

import { useState } from 'react';
import styles from '../PersonnelCardDemo.module.css';

export function PersonnelCardV3() {
  const [openSections, setOpenSections] = useState<string[]>(['core', 'leave']);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className={styles.designWrapper}>
      <div className={styles.v3Container}>
        {/* Profile Header with Gradient Background */}
        <div className={styles.v3ProfileCard}>
          <div className={styles.v3ProfileGradient}></div>
          <div className={styles.v3ProfileContent}>
            <div className={styles.v3ProfileImageWrapper}>
              <img
                alt="Önder Terzi"
                className={styles.v3ProfileImage}
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
              />
            </div>
            <div className={styles.v3ProfileInfo}>
              <div className={styles.v3ProfileTop}>
                <div>
                  <div className={styles.v3ProfileNameRow}>
                    <h2 className={styles.v3ProfileName}>Önder Terzi</h2>
                    <span className={styles.v3ActiveBadge}>
                      <span className={styles.v3ActiveDot}></span> Aktiv
                    </span>
                    <span className={styles.v3TypeBadge}>Eigener Mitarbeiter</span>
                  </div>
                  <p className={styles.v3ProfilePosition}>Fahrer • Amazon (AMZL)</p>
                  <div className={styles.v3ProfileMeta}>
                    <span>🏷️ ID: 52</span>
                    <span>🎂 29.03.1965 (60 Jahre)</span>
                    <span>📍 Best4Tires - Straelen</span>
                  </div>
                </div>
                <div className={styles.v3ProfileActions}>
                  <button className={styles.v3BtnPrimary}>
                    ✏️ Bearbeiten
                  </button>
                  <div className={styles.v3DropdownWrapper}>
                    <button className={styles.v3BtnSecondary}>
                      ⋯ Aktionen
                    </button>
                    <div className={styles.v3Dropdown}>
                      <a href="#">Zeiterfassung</a>
                      <a href="#">Unterlagen</a>
                      <a href="#">Arbeitsverträge</a>
                      <a href="#" className={styles.v3DropdownDanger}>Löschen</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className={styles.v3TimelineCard}>
          <h3 className={styles.v3SectionTitle}>
            <span className={styles.v3TimelineIcon}>📊</span>
            Mitarbeiter Historie
          </h3>
          <div className={styles.v3TimelineContainer}>
            <div className={styles.v3TimelineLine}></div>
            <div className={styles.v3TimelineGrid}>
              <div className={styles.v3TimelineItem}>
                <div className={`${styles.v3TimelineDot} ${styles.v3DotGray}`}></div>
                <div className={styles.v3TimelineDate}>29.03.1965</div>
                <div className={styles.v3TimelineTitle}>Geburtstag</div>
                <p className={styles.v3TimelineDesc}>Essen, Deutschland</p>
              </div>
              <div className={styles.v3TimelineItem}>
                <div className={`${styles.v3TimelineDot} ${styles.v3DotBlue}`}></div>
                <div className={styles.v3TimelineDate}>16.01.2019</div>
                <div className={styles.v3TimelineTitle}>Eintrittsdatum</div>
                <p className={styles.v3TimelineDesc}>Vertragsbeginn</p>
              </div>
              <div className={styles.v3TimelineItem}>
                <div className={`${styles.v3TimelineDot} ${styles.v3DotGreen} ${styles.v3DotPulse}`}></div>
                <div className={styles.v3TimelineDate}>Heute</div>
                <div className={styles.v3TimelineTitle}>Aktiv im Dienst</div>
                <p className={styles.v3TimelineDesc}>Standort: Best4Tires</p>
              </div>
              <div className={`${styles.v3TimelineItem} ${styles.v3TimelineItemFaded}`}>
                <div className={`${styles.v3TimelineDot} ${styles.v3DotGray}`}></div>
                <div className={styles.v3TimelineDate}>--.--.----</div>
                <div className={styles.v3TimelineTitle}>Austrittsdatum</div>
                <p className={styles.v3TimelineDesc}>Kein Enddatum (Unbefristet)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Section: Core Information */}
        <div className={styles.v3CollapsibleCard}>
          <button
            className={styles.v3CollapsibleHeader}
            onClick={() => toggleSection('core')}
          >
            <div className={styles.v3CollapsibleTitle}>
              <span className={`${styles.v3IconBadge} ${styles.v3IconBlue}`}>👤</span>
              <div>
                <h3>Kern-Informationen</h3>
                <p>Persönliche Daten, Kontakt & Vertrag</p>
              </div>
            </div>
            <span className={`${styles.v3Chevron} ${openSections.includes('core') ? styles.v3ChevronOpen : ''}`}>
              ▼
            </span>
          </button>
          {openSections.includes('core') && (
            <div className={styles.v3CollapsibleContent}>
              <div className={styles.v3CoreGrid}>
                <div className={styles.v3CoreSection}>
                  <h4>Vertrag & Identität</h4>
                  <div className={styles.v3CoreRow}>
                    <span>Position</span><span>Fahrer</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>Kunde</span><span>Amazon (AMZL)</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>Amazon ID</span>
                    <span className={styles.v3MonoCode}>A19284DY46K772</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>DATEV ID</span>
                    <span className={styles.v3WarningText}>Nicht eingetragen!</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>EU Bürger</span>
                    <span className={styles.v3GreenCheck}>✓</span>
                  </div>
                </div>

                <div className={styles.v3CoreSection}>
                  <h4>Adresse & Kontakt</h4>
                  <div className={styles.v3AddressBlock}>
                    <span className={styles.v3LabelSmall}>Wohnhaft</span>
                    <p>Am Werhahn 81</p>
                    <p>40211 Düsseldorf</p>
                  </div>
                  <div className={styles.v3ContactBlock}>
                    <span className={styles.v3LabelSmall}>Kommunikation</span>
                    <div className={styles.v3ContactRow}>
                      <span>01773575368</span>
                      <button className={styles.v3IconBtn}>📞</button>
                    </div>
                    <div className={styles.v3ContactRow}>
                      <span>terzika@onway-gmbh.de</span>
                      <button className={styles.v3IconBtn}>✉️</button>
                    </div>
                  </div>
                </div>

                <div className={styles.v3CoreSection}>
                  <h4>Hintergrund</h4>
                  <div className={styles.v3CoreRow}>
                    <span>Geburtsort</span><span>Essen</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>Nationalität</span><span>Deutschland</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>Background-Check</span><span>440451802</span>
                  </div>
                  <div className={styles.v3CoreRow}>
                    <span>Harmony Name</span><span>Oender Terzi</span>
                  </div>
                  <div className={styles.v3ButtonRow}>
                    <button className={styles.v3SmallBtn}>Ausweis & Führersch.</button>
                    <button className={styles.v3SmallBtn}>Bank & Steuer</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section: Leave */}
        <div className={styles.v3CollapsibleCard}>
          <button
            className={styles.v3CollapsibleHeader}
            onClick={() => toggleSection('leave')}
          >
            <div className={styles.v3CollapsibleTitle}>
              <span className={`${styles.v3IconBadge} ${styles.v3IconOrange}`}>📅</span>
              <div>
                <h3>Urlaub & Abwesenheit</h3>
                <p>Krankheitstage, Resturlaub & Kalender</p>
              </div>
            </div>
            <span className={`${styles.v3Chevron} ${openSections.includes('leave') ? styles.v3ChevronOpen : ''}`}>
              ▼
            </span>
          </button>
          {openSections.includes('leave') && (
            <div className={styles.v3CollapsibleContent}>
              <div className={styles.v3LeaveGrid}>
                <div className={styles.v3LeaveCard}>
                  <h4>Krankheitstage 2024</h4>
                  <div className={styles.v3LeaveStats}>
                    <span className={styles.v3BigNumber}>11</span>
                    <span className={styles.v3StatsSub}>MEF: 1.9%</span>
                  </div>
                  <div className={styles.v3ProgressBar}>
                    <div className={styles.v3ProgressFill} style={{ width: '15%' }}></div>
                  </div>
                </div>

                <div className={styles.v3LeaveCard}>
                  <h4>Urlaubstage Übersicht</h4>
                  <div className={styles.v3LeaveStats}>
                    <span className={styles.v3BigNumber}>25,8</span>
                    <span className={styles.v3StatsSub}>Resturlaub dieses Jahr</span>
                  </div>
                  <div className={styles.v3LeaveDetails}>
                    <div>Genommen: 0,0</div>
                    <div>Vorjahr: 13,8</div>
                  </div>
                  <div className={styles.v3ProgressBar}>
                    <div className={`${styles.v3ProgressFill} ${styles.v3ProgressGreen}`} style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div className={styles.v3LeaveCardActions}>
                  <button className={styles.v3ActionBtn}>+ Sonderurlaub</button>
                  <button className={styles.v3ActionBtn}>+ Urlaub / Krankheit</button>
                </div>
              </div>

              <div className={styles.v3CalendarSection}>
                <h4>Jahresübersicht 2025</h4>
                <div className={styles.v3CalendarScroll}>
                  <div className={styles.v3CalendarGrid2}>
                    <div className={styles.v3CalendarHeader2}>
                      <div>Jan</div><div>Feb</div><div>Mär</div><div>Apr</div><div>Mai</div><div>Jun</div>
                      <div>Jul</div><div>Aug</div><div>Sep</div><div>Okt</div><div>Nov</div><div>Dez</div>
                    </div>
                    <div className={styles.v3CalendarBody}>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (7)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (7)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (7)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (7)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (7)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (13)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (7)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (7)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagGreen}>Urlaub (1)</span>
                        <span className={styles.v3CalTagBlue}>Frei (24)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (13)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (1)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (13)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (2)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagBlue}>Frei (2)</span>
                        <span className={styles.v3CalTagIndigo}>Unbez (15)</span>
                      </div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagIndigo}>Unbez (21)</span>
                      </div>
                      <div className={styles.v3CalCellEmpty}></div>
                      <div className={styles.v3CalCellEmpty}></div>
                      <div className={styles.v3CalCell}>
                        <span className={styles.v3CalTagIndigo}>Unbez (4)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section: Financial */}
        <div className={styles.v3CollapsibleCard}>
          <button
            className={styles.v3CollapsibleHeader}
            onClick={() => toggleSection('financial')}
          >
            <div className={styles.v3CollapsibleTitle}>
              <span className={`${styles.v3IconBadge} ${styles.v3IconRed}`}>💰</span>
              <div>
                <h3>Finanzen & Abzüge</h3>
                <p>Lohnabzüge (73 Einträge) & Bußgelder</p>
              </div>
            </div>
            <span className={`${styles.v3Chevron} ${openSections.includes('financial') ? styles.v3ChevronOpen : ''}`}>
              ▼
            </span>
          </button>
          {openSections.includes('financial') && (
            <div className={styles.v3CollapsibleContent}>
              <div className={styles.v3FinancialHeader}>
                <h4>Letzte Lohnabzüge</h4>
                <button className={styles.v3ViewAllBtn}>
                  Alle anzeigen →
                </button>
              </div>
              <div className={styles.v3TableWrapper}>
                <table className={styles.v3FinancialTable}>
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
                      <td><span className={styles.v3BadgeRed}>Nicht bezahlt</span></td>
                      <td><button className={styles.v3EditBtn}>✏️</button></td>
                    </tr>
                    <tr>
                      <td>26.12.2025</td>
                      <td>Dienstfahrzeug - Privatfahrt</td>
                      <td>8,40 €</td>
                      <td><span className={styles.v3BadgeRed}>Nicht bezahlt</span></td>
                      <td><button className={styles.v3EditBtn}>✏️</button></td>
                    </tr>
                    <tr>
                      <td>24.12.2025</td>
                      <td>Dienstfahrzeug - Privatfahrt</td>
                      <td>66,00 €</td>
                      <td><span className={styles.v3BadgeRed}>Nicht bezahlt</span></td>
                      <td><button className={styles.v3EditBtn}>✏️</button></td>
                    </tr>
                    <tr>
                      <td>13.12.2025</td>
                      <td>Abschleppung</td>
                      <td>609,17 €</td>
                      <td><span className={styles.v3BadgeRed}>Nicht bezahlt</span></td>
                      <td><button className={styles.v3EditBtn}>✏️</button></td>
                    </tr>
                    <tr>
                      <td>15.11.2025</td>
                      <td>Dienstfahrzeug - Privatfahrt</td>
                      <td>269,26 €</td>
                      <td><span className={styles.v3BadgeGreen}>Bezahlt</span></td>
                      <td><button className={styles.v3EditBtn}>✏️</button></td>
                    </tr>
                    <tr className={styles.v3MoreRow}>
                      <td colSpan={5}>... 68 weitere Einträge ...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
