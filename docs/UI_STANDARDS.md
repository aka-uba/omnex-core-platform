# UI Standartları

Bu doküman, Omnex Core Platform'da sayfa yapısı ve bileşen kullanımı için standartları tanımlar.

## Sayfa İçerik Alanı Standartları

### Container Yapısı

Tüm sayfalarda Container bileşeni aşağıdaki şekilde kullanılmalıdır:

```tsx
<Container size="xl" pt="xl">
  {/* Sayfa içeriği */}
</Container>
```

**Kurallar:**
- `size="xl"` - Sayfa genişliği için standart boyut
- `pt="xl"` - Sadece üst padding (top padding)
- ~~`py="xl"`~~ - KULLANILMAMALI (üst + alt padding tutarsızlık yaratır)

### CentralPageHeader Sonrası Boşluk

CentralPageHeader bileşeninden sonra gelen içerik için standart boşluk kuralları:

#### 1. Detail Sayfaları (Paper ile)

```tsx
<Container size="xl" pt="xl">
  <CentralPageHeader
    title={t('...')}
    description={t('...')}
    {...diğerProps}
  />
  <Paper shadow="xs" p="md" mt="md">
    <Stack gap="md">
      {/* Detail içeriği */}
    </Stack>
  </Paper>
</Container>
```

**Paper Kuralları:**
- `shadow="xs"` - Standart gölge efekti
- `p="md"` - İç padding (~~`p="xl"`~~ kullanılmamalı)
- `mt="md"` - CentralPageHeader'dan sonra standart boşluk

#### 2. Detail Sayfaları (Tabs ile)

```tsx
<Container size="xl" pt="xl">
  <CentralPageHeader
    title={t('...')}
    description={t('...')}
    {...diğerProps}
  />
  <Tabs defaultValue="details" mt="md">
    <Tabs.List>
      <Tabs.Tab value="details">{t('...')}</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="details" pt="md">
      {/* Tab içeriği */}
    </Tabs.Panel>
  </Tabs>
</Container>
```

**Tabs Kuralları:**
- `mt="md"` - CentralPageHeader'dan sonra zorunlu
- Tabs.Panel için `pt="md"` standart

#### 3. Detail Sayfaları (Paper içinde Tabs)

```tsx
<Container size="xl" pt="xl">
  <CentralPageHeader {...props} />
  <Paper shadow="xs" p="md" mt="md">
    <Tabs defaultValue="details">
      {/* Tabs içeriği - mt="md" Paper'da olduğu için gerekmez */}
    </Tabs>
  </Paper>
</Container>
```

#### 4. Liste Sayfaları

```tsx
<Container size="xl" pt="xl">
  <CentralPageHeader
    title={t('...')}
    description={t('...')}
    actions={[...]}
    {...diğerProps}
  />
  {/* DataTable veya liste içeriği doğrudan */}
</Container>
```

### Paper Styling Seçenekleri

İki valid styling seçeneği mevcuttur ve kullanım amacına göre seçilmelidir:

| Style | Kullanım Alanı | Örnek |
|-------|---------------|-------|
| `shadow="xs"` | Ana içerik alanları, detail sayfaları | `<Paper shadow="xs" p="md" mt="md">` |
| `withBorder` | Form grupları, iç bileşenler, dashboard kartları | `<Paper p="md" withBorder>` |

**Not:** `shadow="sm"` dashboard kartları için kullanılabilir.

## Özet Tablo

| Element | Standart Değer | Notlar |
|---------|---------------|--------|
| Container size | `xl` | Tüm sayfalarda sabit |
| Container padding | `pt="xl"` | Sadece üst padding |
| Paper shadow | `xs` | Ana içerik alanları için |
| Paper padding | `md` | `xl` kullanılmamalı |
| Header sonrası boşluk | `mt="md"` | Paper veya Tabs üzerinde |
| Tabs.Panel padding | `pt="md"` | Tab içeriği üst boşluğu |

## Değişiklik Geçmişi

- **2025-12-14**: İlk versiyon oluşturuldu
  - 86 dosyada `py="xl"` → `pt="xl"` düzeltildi
  - 3 dosyada Paper `p="xl"` → `p="md"` düzeltildi
  - 4 dosyada Tabs'a eksik `mt="md"` eklendi
