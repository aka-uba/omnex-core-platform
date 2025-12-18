'use client';

import { useEffect, useState } from 'react';

interface MenuItemCheck {
  id: string;
  label: string;
  href: string;
  menuName: string;
  menuId: string;
  exists: boolean;
  filePath?: string;
  expectedPath?: string;
  parentId?: string;
  children?: MenuItemCheck[];
}

interface MenuData {
  summary: {
    total: number;
    existing: number;
    missing: number;
  };
  missingPages: Record<string, MenuItemCheck[]>;
  menuSummary: Array<{
    menuName: string;
    menuId: string;
    total: number;
    existing: number;
    missing: number;
    status: string;
  }>;
  allResults: MenuItemCheck[];
}

export default function SiteStructureTestPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [workingPages, setWorkingPages] = useState<any[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItemCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('working-pages');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/menu-management/check-pages', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMenuData(data.data);
          setAllMenuItems(data.data.allResults || []);
          
          const working = (data.data.allResults || [])
            .filter((item: MenuItemCheck) => item.exists)
            .map((item: MenuItemCheck) => ({
              path: item.href,
              label: item.label,
              location: item.filePath ? item.filePath.split('src/app/[locale]')[1] || item.filePath : 'N/A',
              menuName: item.menuName
            }));
          
          setWorkingPages(working);
        }
      } else {
        console.error('Failed to load menu check data:', response.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMenuItemsByMenu = () => {
    const grouped: Record<string, MenuItemCheck[]> = {};
    allMenuItems.forEach(item => {
      if (!grouped[item.menuName]) {
        grouped[item.menuName] = [];
      }
      if (grouped[item.menuName]) {
        grouped[item.menuName]?.push(item);
      }
    });
    return grouped;
  };

  const buildMenuTree = (items: MenuItemCheck[]): MenuItemCheck[] => {
    const itemMap = new Map<string, MenuItemCheck>();
    const rootItems: MenuItemCheck[] = [];
    
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    items.forEach(item => {
      const itemWithChildren = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(itemWithChildren);
      } else {
        rootItems.push(itemWithChildren);
      }
    });
    
    return rootItems;
  };

  const renderMenuItem = (item: MenuItemCheck, depth: number = 0): React.ReactElement => {
    const hasChildren = item.children && item.children.length > 0;
    const status = item.exists ? 'working' : '404';
    const statusText = item.exists ? '✅ Çalışıyor' : '❌ 404';
    const icon = item.exists ? '✅' : '❌';
    
    return (
      <div key={item.id} className="tree-item" style={{ marginLeft: `${depth * 20}px` }}>
        <div className="tree-item-content">
          {hasChildren ? (
            <span className="toggle-btn" onClick={(e) => {
              const target = e.currentTarget;
              const parent = target.closest('.tree-item');
              const children = parent?.querySelector('.tree-children');
              if (children) {
                (children as HTMLElement).style.display = (children as HTMLElement).style.display === 'none' ? 'block' : 'none';
                target.classList.toggle('collapsed');
              }
            }}>▼</span>
          ) : (
            <span style={{ width: '20px' }}></span>
          )}
          <span className="tree-item-icon">{icon}</span>
          <span className="tree-item-label">{item.label}</span>
          <span className="tree-item-path">{item.href}</span>
          <span className={`badge ${status === 'working' ? 'badge-working' : 'badge-404'}`}>
            {statusText}
          </span>
          <a 
            href={item.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`tree-item-link ${status === '404' ? 'disabled' : ''}`}
          >
            Aç
          </a>
        </div>
        {hasChildren && (
          <ul className="tree-children" style={{ display: 'block' }}>
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </div>
    );
  };

  const summary = menuData?.summary || { total: 0, existing: 0, missing: 0 };
  const menuCount = menuData?.menuSummary?.length || 0;
  const percentage = summary.total > 0 ? Math.round((summary.existing / summary.total) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .container {
          max-width: 1600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 30px 40px;
          text-align: center;
        }
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          padding: 25px 40px;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
        }
        .stat-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 5px;
        }
        .stat-label {
          color: #64748b;
          font-size: 0.85em;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
          flex-wrap: wrap;
        }
        .tab {
          padding: 12px 24px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-size: 1em;
          font-weight: 600;
          color: #64748b;
          transition: all 0.3s ease;
        }
        .tab:hover {
          background: #e2e8f0;
          color: #334155;
        }
        .tab.active {
          background: #3b82f6;
          color: white;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tree-item {
          margin: 8px 0;
        }
        .tree-item-content {
          display: flex;
          align-items: center;
          padding: 12px 15px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          transition: all 0.3s ease;
          gap: 10px;
        }
        .tree-item-content:hover {
          background: #e0f2fe;
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
        .tree-item-icon {
          font-size: 1.2em;
          min-width: 24px;
        }
        .tree-item-label {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
        }
        .tree-item-path {
          font-size: 0.8em;
          color: #64748b;
          font-family: 'Courier New', monospace;
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .tree-item-link {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.85em;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .tree-item-link:hover {
          background: #2563eb;
          transform: scale(1.05);
        }
        .tree-item-link.disabled {
          background: #94a3b8;
          cursor: not-allowed;
          pointer-events: none;
        }
        .tree-children {
          list-style: none;
          padding-left: 30px;
          margin-top: 8px;
          border-left: 2px dashed #cbd5e1;
          margin-left: 15px;
        }
        .toggle-btn {
          cursor: pointer;
          color: #3b82f6;
          font-weight: bold;
          user-select: none;
          transition: transform 0.3s ease;
          min-width: 20px;
        }
        .toggle-btn.collapsed {
          transform: rotate(-90deg);
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75em;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-working {
          background: #dcfce7;
          color: #166534;
        }
        .badge-404 {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-admin {
          background: #fce7f3;
          color: #9f1239;
        }
        .section-title {
          font-size: 1.5em;
          color: #1e293b;
          margin: 30px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
        }
        .info-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .info-box h3 {
          color: #1e40af;
          margin-bottom: 8px;
        }
        .info-box p {
          color: #1e293b;
          line-height: 1.6;
        }
        .search-box {
          width: 100%;
          padding: 15px 20px;
          font-size: 1em;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .search-box:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>🗺️ Omnex SaaS - Site Yapısı Test Sayfası</h1>
          <p>Gerçek zamanlı veri: Menüler veritabanından çekiliyor</p>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : summary.existing}</div>
            <div className="stat-label">Çalışan Sayfalar</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : summary.total}</div>
            <div className="stat-label">Toplam Menü Item</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : summary.missing}</div>
            <div className="stat-label">Eksik Sayfalar</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : menuCount}</div>
            <div className="stat-label">Menü Sayısı</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{loading ? '...' : `${percentage}%`}</div>
            <div className="stat-label">Başarı Oranı</div>
          </div>
        </div>

        <div className="content">
          <div className="info-box">
            <h3>ℹ️ Önemli Bilgi</h3>
            <p><strong>Bu sayfa gerçek zamanlı veri gösteriyor!</strong> Menüler veritabanından çekiliyor ve 
              <strong> src/app/[locale]</strong> klasöründeki sayfalarla karşılaştırılıyor. 
              Eksik sayfalar kırmızı, çalışan sayfalar yeşil olarak işaretleniyor.</p>
            <p style={{ marginTop: '10px' }}>
              <button 
                onClick={loadData}
                style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Verileri Yenile
              </button>
            </p>
          </div>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'working-pages' ? 'active' : ''}`}
              onClick={() => setActiveTab('working-pages')}
            >
              ✅ Çalışan Sayfalar
            </button>
            <button 
              className={`tab ${activeTab === 'menus' ? 'active' : ''}`}
              onClick={() => setActiveTab('menus')}
            >
              📋 Veritabanı Menüleri
            </button>
          </div>

          {activeTab === 'working-pages' && (
            <div className="tab-content active">
              <div className="section-title">✅ Çalışan Route Sayfaları</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Yükleniyor...</div>
              ) : workingPages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Henüz veri yok.</div>
              ) : (
                <div>
                  {workingPages.map((page, idx) => (
                    <div key={idx} className="tree-item">
                      <div className="tree-item-content">
                        <span className="tree-item-icon">✅</span>
                        <span className="tree-item-label">{page.label}</span>
                        <span className="tree-item-path">{page.path}</span>
                        <span className="badge badge-working">Çalışıyor</span>
                        <span className="badge badge-admin" style={{ fontSize: '0.7em' }}>{page.menuName || 'N/A'}</span>
                        <a href={page.path} target="_blank" rel="noopener noreferrer" className="tree-item-link">Aç</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'menus' && (
            <div className="tab-content active">
              <div className="section-title">📋 Veritabanı Menü Sistemi</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Yükleniyor...</div>
              ) : !menuData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Menü verisi yükleniyor...</div>
              ) : (
                <div>
                  {menuData.menuSummary && menuData.menuSummary.length > 0 && (
                    <div className="info-box" style={{ marginBottom: '30px' }}>
                      <h3>📊 Menü Özeti</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {menuData.menuSummary.map((summary, idx) => (
                          <div 
                            key={idx}
                            style={{ 
                              background: 'white', 
                              padding: '15px', 
                              borderRadius: '8px', 
                              borderLeft: `4px solid ${summary.status === 'ok' ? '#10b981' : '#f59e0b'}` 
                            }}
                          >
                            <strong>{summary.status === 'ok' ? '✅' : '⚠️'} {summary.menuName}</strong><br />
                            <small style={{ color: '#64748b' }}>
                              {summary.existing}/{summary.total} mevcut, {summary.missing} eksik
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.entries(getMenuItemsByMenu()).map(([menuName, items]) => (
                    <div key={menuName}>
                      <div className="section-title" style={{ fontSize: '1.2em', marginTop: '30px' }}>
                        📋 {menuName}
                      </div>
                      {buildMenuTree(items).map(item => renderMenuItem(item, 0))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



