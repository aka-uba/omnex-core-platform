# Core AI Service
## FAZ 0.2: Merkezi AI Servisi

Tüm modüllerin kullanacağı merkezi AI servisi.

## 📋 Genel Bakış

Core AI Service, tüm modüllerin AI ihtiyaçlarını karşılamak için tasarlanmış merkezi bir sistemdir. Her modül kendi prompt template'lerini tanımlayabilir ama AI çağrıları merkezi olarak yönetilir.

## 🏗️ Mimari

### Provider Sistemi

- **BaseAIProvider**: Tüm provider'lar için base class
- **OpenAIProvider**: OpenAI API entegrasyonu
- **AnthropicProvider**: (Gelecek)
- **GoogleAIProvider**: (Gelecek)
- **LocalModelProvider**: (Gelecek)

### Template Sistemi

- **TemplateRegistry**: Prompt template'lerini yönetir
- Her modül kendi template'lerini kaydedebilir
- Variable replacement desteği

## 🔧 Kullanım

### Backend (Service)

```typescript
import { coreAIService } from '@/lib/core-ai/CoreAIService';

// Basit text generation
const response = await coreAIService.generate({
  prompt: 'Write a blog post about AI',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
});

// Template kullanarak
const response = await coreAIService.generateWithTemplate(
  'invoice-description',
  { invoiceData: {...} }
);

// Chat
const response = await coreAIService.chat([
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' },
]);

// Analiz
const analysis = await coreAIService.analyze(
  invoiceData,
  'invoice-categorization'
);
```

### Frontend (React Hook)

```typescript
import { useAIGenerate } from '@/hooks/useAIGenerate';
import { useAIChat } from '@/hooks/useAIChat';
import { useAIAnalyze } from '@/hooks/useAIAnalyze';

// Text generation
const generate = useAIGenerate();
const response = await generate.mutateAsync({
  prompt: 'Write a blog post',
  model: 'gpt-3.5-turbo',
});

// Chat
const chat = useAIChat();
const response = await chat.mutateAsync({
  messages: [
    { role: 'user', content: 'Hello!' },
  ],
});

// Analysis
const analyze = useAIAnalyze();
const result = await analyze.mutateAsync({
  data: invoiceData,
  analysisType: 'invoice-categorization',
});
```

### API Endpoints

- `POST /api/core-ai/generate` - Text generation
- `POST /api/core-ai/chat` - Chat
- `POST /api/core-ai/analyze` - Data analysis
- `GET /api/core-ai/models` - Get available models
- `GET /api/core-ai/quota` - Get quota status
- `GET /api/core-ai/templates` - Get templates
- `POST /api/core-ai/templates` - Register template
- `GET /api/core-ai/templates/[id]` - Get template
- `POST /api/core-ai/templates/[id]` - Generate with template

## 📦 Modül Entegrasyonu

### Muhasebe Modülü

```typescript
// Fatura açıklaması üretme
const description = await coreAIService.generateWithTemplate(
  'invoice-description',
  { invoiceData }
);

// Fatura kategorizasyonu
const category = await coreAIService.analyze(
  invoiceData,
  'invoice-categorization'
);
```

### Template Kaydı

```typescript
coreAIService.registerTemplate({
  id: 'invoice-description',
  name: 'Invoice Description Generator',
  module: 'accounting',
  template: 'Generate a description for invoice #{{invoiceNumber}} with amount {{amount}}',
  variables: ['invoiceNumber', 'amount'],
  defaultModel: 'gpt-3.5-turbo',
  settings: {
    temperature: 0.7,
    maxTokens: 200,
  },
});
```

## 🔐 Quota Yönetimi

Quota kontrolü otomatik olarak yapılır:

```typescript
const quota = await coreAIService.checkQuota(tenantId, userId);
if (quota.remaining.daily <= 0) {
  throw new Error('Daily quota exceeded');
}
```

## 📊 AI History

Tüm AI çağrıları otomatik olarak loglanır:
- `AIGeneration` modeli: Detaylı generation kayıtları
- `AIHistory` modeli: Kısa history kayıtları

## 🚀 Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

## 📝 Notlar

- Tüm AI çağrıları merkezi olarak yönetilir
- Maliyet takibi otomatik yapılır
- Quota kontrolü her çağrıda yapılır
- History otomatik loglanır
- Template sistemi ile modül bazlı prompt yönetimi

## 🔄 Gelecek Geliştirmeler

- [ ] Anthropic provider
- [ ] Google AI provider
- [ ] Local model provider
- [ ] Streaming support
- [ ] Response caching
- [ ] Advanced quota management (database)
- [ ] Cost analytics dashboard
- [ ] Template marketplace









