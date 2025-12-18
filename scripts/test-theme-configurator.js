/**
 * Theme Configurator Test Script
 * Tema özelleştiricinin tüm seçeneklerini test eder
 * 
 * Kullanım: Browser console'da çalıştırın
 * node scripts/test-theme-configurator.js (Node.js için)
 */

// Test sonuçları
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

// Test helper functions
function logTest(name, passed, message = '') {
  if (passed) {
    testResults.passed.push(name);
    console.log(`✅ ${name}${message ? ': ' + message : ''}`);
  } else {
    testResults.failed.push({ name, message });
    console.error(`❌ ${name}${message ? ': ' + message : ''}`);
  }
}

function logWarning(name, message) {
  testResults.warnings.push({ name, message });
  console.warn(`⚠️ ${name}: ${message}`);
}

// Config kontrolü
function getConfig() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const cached = localStorage.getItem('omnex-layout-config-v2');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Config okuma hatası:', e);
  }
  
  return null;
}

// DOM element bulma
function findElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime < timeout) {
        setTimeout(check, 100);
      } else {
        resolve(null);
      }
    };
    check();
  });
}

// Test suite
async function runTests() {
  console.log('🧪 Tema Özelleştirici Test Başlatılıyor...\n');
  
  // 1. Config yükleme testi
  console.log('📋 1. Config Yükleme Testi');
  const config = getConfig();
  logTest('Config localStorage\'dan yüklendi', config !== null);
  if (config) {
    logTest('Config geçerli JSON formatında', typeof config === 'object');
    logTest('Config layoutType içeriyor', 'layoutType' in config);
    logTest('Config themeMode içeriyor', 'themeMode' in config);
    logTest('Config direction içeriyor', 'direction' in config);
  }
  
  // 2. Modal açma testi
  console.log('\n📱 2. Modal Açma Testi');
  const toggleButton = await findElement('[data-testid="theme-configurator-toggle"], button[aria-label*="settings" i], button[title*="settings" i]');
  if (toggleButton) {
    logTest('Toggle butonu bulundu', true);
    toggleButton.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const panel = await findElement('.themeCustomizerPanel:not(.closed)');
    logTest('Modal panel açıldı', panel !== null);
  } else {
    logTest('Toggle butonu bulunamadı', false, 'Sayfayı yenileyin ve tekrar deneyin');
  }
  
  // 3. Layout Type testi
  console.log('\n🎨 3. Layout Type Testi');
  const sidebarLayoutBtn = await findElement('button[title*="Sidebar" i], button[title*="sidebar" i]');
  const topLayoutBtn = await findElement('button[title*="Top" i], button[title*="top" i]');
  
  if (sidebarLayoutBtn && topLayoutBtn) {
    logTest('Layout type butonları bulundu', true);
    
    // Sidebar layout'a geç
    sidebarLayoutBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const sidebarConfig = getConfig();
    logTest('Sidebar layout seçildi', sidebarConfig?.layoutType === 'sidebar');
    
    // Top layout'a geç
    topLayoutBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const topConfig = getConfig();
    logTest('Top layout seçildi', topConfig?.layoutType === 'top');
  } else {
    logTest('Layout type butonları bulunamadı', false);
  }
  
  // 4. Theme Mode testi
  console.log('\n🌓 4. Theme Mode Testi');
  const lightThemeBtn = await findElement('button[title*="Açık" i], button[title*="light" i]');
  const darkThemeBtn = await findElement('button[title*="Koyu" i], button[title*="dark" i]');
  const autoThemeBtn = await findElement('button[title*="Otomatik" i], button[title*="auto" i]');
  
  if (lightThemeBtn && darkThemeBtn && autoThemeBtn) {
    logTest('Theme mode butonları bulundu', true);
    
    // Light mode
    lightThemeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const lightConfig = getConfig();
    logTest('Light mode seçildi', lightConfig?.themeMode === 'light');
    
    // Dark mode
    darkThemeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const darkConfig = getConfig();
    logTest('Dark mode seçildi', darkConfig?.themeMode === 'dark');
    
    // Auto mode
    autoThemeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const autoConfig = getConfig();
    logTest('Auto mode seçildi', autoConfig?.themeMode === 'auto');
  } else {
    logTest('Theme mode butonları bulunamadı', false);
  }
  
  // 5. Direction testi
  console.log('\n↔️ 5. Direction Testi');
  const ltrBtn = await findElement('button[title*="LTR" i]');
  const rtlBtn = await findElement('button[title*="RTL" i]');
  
  if (ltrBtn && rtlBtn) {
    logTest('Direction butonları bulundu', true);
    
    // LTR
    ltrBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const ltrConfig = getConfig();
    logTest('LTR seçildi', ltrConfig?.direction === 'ltr');
    logTest('HTML dir attribute LTR', document.documentElement.getAttribute('dir') === 'ltr');
    
    // RTL
    rtlBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const rtlConfig = getConfig();
    logTest('RTL seçildi', rtlConfig?.direction === 'rtl');
    logTest('HTML dir attribute RTL', document.documentElement.getAttribute('dir') === 'rtl');
  } else {
    logTest('Direction butonları bulunamadı', false);
  }
  
  // 6. Sidebar ayarları testi (sidebar layout'ta)
  console.log('\n📊 6. Sidebar Ayarları Testi');
  const currentConfig = getConfig();
  if (currentConfig?.layoutType === 'sidebar') {
    // Sidebar genişlik slider
    const sidebarWidthSlider = await findElement('input[type="range"]');
    if (sidebarWidthSlider) {
      logTest('Sidebar genişlik slider bulundu', true);
      
      // Slider değerini değiştir
      const newValue = 280;
      sidebarWidthSlider.value = newValue;
      sidebarWidthSlider.dispatchEvent(new Event('input', { bubbles: true }));
      sidebarWidthSlider.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedConfig = getConfig();
      logTest('Sidebar genişlik güncellendi', updatedConfig?.sidebar?.width === newValue);
    } else {
      logTest('Sidebar genişlik slider bulunamadı', false);
    }
    
    // Collapsed switch
    const collapsedSwitch = await findElement('input[type="checkbox"][aria-label*="Daraltılmış" i], input[type="checkbox"]');
    if (collapsedSwitch) {
      logTest('Collapsed switch bulundu', true);
      
      const initialValue = collapsedSwitch.checked;
      collapsedSwitch.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedConfig = getConfig();
      logTest('Collapsed durumu değişti', updatedConfig?.sidebar?.collapsed !== initialValue);
    } else {
      logTest('Collapsed switch bulunamadı', false);
    }
    
    // Arka plan seçimi
    const backgroundSelect = await findElement('select[aria-label*="Arka Plan" i], select');
    if (backgroundSelect) {
      logTest('Arka plan select bulundu', true);
      
      // Custom seçeneğini seç
      backgroundSelect.value = 'custom';
      backgroundSelect.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedConfig = getConfig();
      logTest('Custom arka plan seçildi', updatedConfig?.sidebar?.background === 'custom');
      
      // Renk paleti kontrolü
      const colorPalette = await findElement('.colorPalette');
      if (colorPalette) {
        logTest('Renk paleti görünür', true);
        
        const colorSwatches = colorPalette.querySelectorAll('.colorSwatch');
        logTest('Renk paleti butonları bulundu', colorSwatches.length > 0);
        
        if (colorSwatches.length > 0) {
          // İlk rengi seç
          colorSwatches[0].click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const updatedConfig2 = getConfig();
          logTest('Renk paleti rengi seçildi', updatedConfig2?.sidebar?.customColor !== undefined);
        }
      } else {
        logTest('Renk paleti görünür değil', false, 'Custom arka plan seçildikten sonra görünmeli');
      }
    } else {
      logTest('Arka plan select bulunamadı', false);
    }
  } else {
    logWarning('Sidebar ayarları testi', 'Sidebar layout seçili değil, test atlandı');
  }
  
  // 7. Top Layout ayarları testi
  console.log('\n📐 7. Top Layout Ayarları Testi');
  const topConfig = getConfig();
  if (topConfig?.layoutType === 'top') {
    // Yükseklik slider
    const heightSlider = await findElement('input[type="range"]');
    if (heightSlider) {
      logTest('Top layout yükseklik slider bulundu', true);
      
      const newValue = 72;
      heightSlider.value = newValue;
      heightSlider.dispatchEvent(new Event('input', { bubbles: true }));
      heightSlider.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedConfig = getConfig();
      logTest('Top layout yüksekliği güncellendi', updatedConfig?.top?.height === newValue);
    }
    
    // Scroll behavior
    const scrollBehaviorSelect = await findElement('select[aria-label*="Scroll" i]');
    if (scrollBehaviorSelect) {
      logTest('Scroll behavior select bulundu', true);
      
      scrollBehaviorSelect.value = 'hidden';
      scrollBehaviorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedConfig = getConfig();
      logTest('Scroll behavior güncellendi', updatedConfig?.top?.scrollBehavior === 'hidden');
    }
  } else {
    logWarning('Top layout ayarları testi', 'Top layout seçili değil, test atlandı');
  }
  
  // 8. Mobil ayarları testi
  console.log('\n📱 8. Mobil Ayarları Testi');
  const mobileHeaderHeightSlider = await findElement('input[type="range"]');
  if (mobileHeaderHeightSlider) {
    logTest('Mobil header height slider bulundu', true);
    
    const newValue = 64;
    mobileHeaderHeightSlider.value = newValue;
    mobileHeaderHeightSlider.dispatchEvent(new Event('input', { bubbles: true }));
    mobileHeaderHeightSlider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedConfig = getConfig();
    logTest('Mobil header height güncellendi', updatedConfig?.mobile?.headerHeight === newValue);
  }
  
  // 9. Content Area ayarları testi
  console.log('\n📦 9. Content Area Ayarları Testi');
  const widthNumberInput = await findElement('input[type="number"]');
  if (widthNumberInput) {
    logTest('Content area genişlik input bulundu', true);
    
    const newValue = 1200;
    widthNumberInput.value = newValue;
    widthNumberInput.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedConfig = getConfig();
    logTest('Content area genişlik güncellendi', updatedConfig?.contentArea?.width?.value === newValue);
  }
  
  // Padding inputs
  const paddingInputs = document.querySelectorAll('.paddingGrid input[type="number"]');
  if (paddingInputs.length === 4) {
    logTest('Padding inputları bulundu (4 adet)', true);
    
    // Üst padding
    paddingInputs[0].value = 32;
    paddingInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedConfig = getConfig();
    logTest('Padding değerleri güncellendi', updatedConfig?.contentArea?.padding?.top === 32);
  } else {
    logTest('Padding inputları bulunamadı', false, `Beklenen: 4, Bulunan: ${paddingInputs.length}`);
  }
  
  // 10. Footer görünürlüğü testi
  console.log('\n👣 10. Footer Görünürlüğü Testi');
  const footerSwitch = await findElement('input[type="checkbox"][aria-label*="Footer" i]');
  if (footerSwitch) {
    logTest('Footer switch bulundu', true);
    
    const initialValue = footerSwitch.checked;
    footerSwitch.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedConfig = getConfig();
    logTest('Footer görünürlüğü değişti', updatedConfig?.footerVisible !== initialValue);
  } else {
    logTest('Footer switch bulunamadı', false);
  }
  
  // Özet
  console.log('\n📊 Test Özeti');
  console.log(`✅ Başarılı: ${testResults.passed.length}`);
  console.log(`❌ Başarısız: ${testResults.failed.length}`);
  console.log(`⚠️ Uyarılar: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Başarısız Testler:');
    testResults.failed.forEach(({ name, message }) => {
      console.log(`  - ${name}${message ? ': ' + message : ''}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ Uyarılar:');
    testResults.warnings.forEach(({ name, message }) => {
      console.log(`  - ${name}: ${message}`);
    });
  }
  
  const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100;
  console.log(`\n📈 Başarı Oranı: ${successRate.toFixed(1)}%`);
  
  return {
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    successRate,
    details: testResults,
  };
}

// Browser console için
if (typeof window !== 'undefined') {
  window.testThemeConfigurator = runTests;
  console.log('🧪 Test scripti yüklendi! Çalıştırmak için: testThemeConfigurator()');
}

// Node.js için
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, getConfig };
}

















