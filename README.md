# ![Kora Banner](banner.jpg)

<div align="center">

<img src="logo.png" alt="Kora" width="72" height="72" />

# kora

**Inteligência e Ligação Artificial**

*Ela não armazena o que você pensa. Ela aprende como você pensa.*

<br />

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![MongoDB](https://img.shields.io/badge/banco-mongodb_atlas-00ED64?style=flat-square&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![License](https://img.shields.io/badge/licença-MIT-E8B84B?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/badge/versão-0.1.0-white?style=flat-square)](./CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-acesso_antecipado-E8B84B?style=flat-square)]()

</div>

---

## O que é o Kora

A maioria das IAs é inteligente. Nenhuma te conhece.

O Kora é a primeira plataforma de **Inteligência e Ligação Artificial** — onde a IA não apenas responde, mas conhece quem você é, conecta o que você pensa, e age antes de você perguntar.

A diferença entre falar com o ChatGPT e falar com o Kora é a diferença entre falar com um estranho inteligente e falar com alguém que te acompanha há anos.

> **Não é um chatbot. Não é um segundo cérebro genérico. É outra coisa.**

---

## Por que existe

As ferramentas de IA atuais têm um problema estrutural: cada conversa começa do zero. Você repete contexto. Você explica quem é. Você recomeça.

O Kora resolve isso com uma arquitetura de memória que nenhuma plataforma adotou porque complica o produto — e é exatamente por isso que é nossa vantagem real.

---

## Como funciona

### A Fundação
Ao criar sua conta, você passa por uma conversa de dois minutos chamada **Fundação**. Não é um formulário. São três perguntas. As respostas formam os primeiros nós da sua Memória — um grafo de conhecimento que cresce com cada sessão.

### A Memória Local
Suas informações pessoais ficam em um arquivo no **seu dispositivo** — `seu_nome.kora`. Criptografado localmente. A Kora não tem cópia. Nunca.

Quando você abre uma sessão, fragmentos relevantes são enviados à IA de forma anônima — sem nome, sem CPF, sem identificadores reais. A IA recebe **contexto**, não identidade.

### O Roteador de IAs
Toda mensagem passa por um classificador antes de chegar a qualquer modelo. Código vai para o DeepSeek. Conversa casual vai para o Groq. Documento longo vai para o Gemini. O usuário sente consistência sem saber que são três inteligências diferentes trabalhando.

### A Voz Interior
A Kora não espera você perguntar. Ela monitora o que você está construindo e age quando vê algo relevante — uma deadline esquecida, uma contradição entre projetos, uma conexão que você não percebeu. Discreta. Nunca invasiva.

---

## Arquitetura de Privacidade

```
DISPOSITIVO DO USUÁRIO                    SERVIDORES KORA
┌──────────────────────────┐              ┌────────────────────────────┐
│  seu_nome.kora           │              │  MongoDB Atlas             │
│  ─────────────────────   │              │  ──────────────────────    │
│  • Nome real             │  contexto    │  • Histórico de chats      │
│  • Preferências          │  anônimo ──▶ │  • Hash do usuário         │
│  • Memórias sensíveis    │              │  • Metadados de uso        │
│  • Nós do grafo          │              │                            │
│                          │              │  Sem nome. Sem CPF.        │
│  Criptografado.          │              │  Sem identificadores.      │
│  Só você acessa.         │              │                            │
└──────────────────────────┘              └────────────────────────────┘

Se alguém invadir nosso servidor → encontra dados sem identidade.
Se alguém roubar seu dispositivo → não lê sem a chave.
Os dois precisam acontecer simultaneamente para haver risco real.
```

---

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS | Zero dependência, máxima velocidade |
| Backend | Node.js via Vercel Functions | Serverless, escala automático |
| Banco | MongoDB Atlas M0 | Free tier generoso, flexível |
| IA — Código | DeepSeek Chat | Melhor raciocínio técnico por custo |
| IA — Conversa | Groq (Llama 3.3 70B) | Ultra rápido, gratuito |
| IA — Documentos | Google Gemini 2.0 Flash | Maior janela de contexto |
| Auth | JWT + bcrypt | Simples, seguro, sem dependências pesadas |
| CI/CD | GitHub Actions + Vercel | Push na main = deploy automático |

**Custo mensal de infraestrutura: R$ 0,00**

---

## Estrutura do Repositório

```
kora-mvp/
│
├── public/                    # Frontend estático
│   ├── index.html             # Landing page
│   ├── app.html               # Aplicação de chat
│   ├── onboarding.html        # Fluxo de Fundação
│   ├── css/
│   │   ├── main.css           # Design system e variáveis globais
│   │   ├── landing.css
│   │   ├── app.css
│   │   └── onboarding.css
│   └── js/
│       ├── landing.js         # Animações e interações da landing
│       ├── app.js             # Lógica principal do chat
│       ├── memory.js          # Engine de Memória Local
│       ├── router.js          # Roteador client-side (hint de IA)
│       └── onboarding.js      # Fluxo de Fundação
│
├── api/                       # Vercel Serverless Functions
│   ├── auth/
│   │   ├── register.js        # POST /api/auth/register
│   │   └── login.js           # POST /api/auth/login
│   ├── chat/
│   │   ├── send.js            # POST /api/chat/send
│   │   └── history.js         # GET  /api/chat/history
│   └── memory/
│       └── sync.js            # POST /api/memory/sync
│
├── lib/                       # Módulos compartilhados (servidor)
│   ├── db.js                  # Conexão MongoDB singleton
│   ├── ai-router.js           # Roteador de IAs + fallback
│   └── jwt.js                 # Helpers de autenticação
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD automático
│
├── banner.jpg                 # Banner oficial do repositório
├── logo.png                   # Logo marca do Kora
├── vercel.json                # Configuração de rotas e funções
├── package.json
├── .env.example               # Modelo de variáveis (sem valores)
├── .gitignore
├── SETUP.md                   # Guia de setup do zero
├── CHANGELOG.md
└── README.md
```

---

## Rodando Localmente

### Pré-requisitos
- Node.js 18+
- Conta no [MongoDB Atlas](https://cloud.mongodb.com) (free)
- Chaves das APIs de IA (veja abaixo)

### Instalação

```bash
# Clone
git clone https://github.com/seu-usuario/kora-mvp.git
cd kora-mvp

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves

# Rode localmente
npx vercel dev
```

Acesse `http://localhost:3000`.

### Variáveis de Ambiente

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/kora
JWT_SECRET=sua_string_secreta_com_minimo_32_caracteres
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
DEEPSEEK_API_KEY=sk-...
```

**Como obter cada chave — gratuito:**

| API | Link | Tier gratuito |
|-----|------|--------------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) | 1.500 req/dia |
| Groq | [console.groq.com](https://console.groq.com) | 14.400 req/dia |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | $5 crédito inicial |

Guia completo em [`SETUP.md`](./SETUP.md).

---

## Deploy

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Login e deploy
vercel login
vercel --prod
```

Após o deploy, adicione as variáveis de ambiente no painel da Vercel em **Settings → Environment Variables**.

A partir daí, cada push na `main` dispara deploy automático via GitHub Actions.

---

## Roadmap

| Versão | Status | O que entra |
|--------|--------|-------------|
| **0.1.0** | ✅ Disponível | Landing · Auth · Chat · Memória Local · Roteador de IAs |
| **0.3.0** | 🔨 Em desenvolvimento | Projetos separados · Painel de Memória editável · Sidebar real |
| **0.5.0** | 📋 Planejado | Pensamento proativo · Grafo de memória 2D navegável |
| **1.0.0** | 📋 Planejado | Produto público · Planos pagos · Dashboard global |
| **1.5.0** | 📋 Planejado | Salas empresariais · B2B |
| **2.0.0** | 📋 Planejado | Upload de arquivos · IA lê PDFs nas Salas |
| **3.0.0** | 🔮 Futuro | Interface de voz |
| **4.0.0** | 🔮 Futuro | Grafo de memória em espaço 3D |
| **5.0.0** | 🔮 Futuro | Agente autônomo com permissões explícitas |

---

## Planos

| | Free | Pro | Builder | Studio |
|---|---|---|---|---|
| **Preço** | R$0/mês | R$29/mês | R$79/mês | R$199/mês |
| Mensagens/dia | 50 | Ilimitadas | Ilimitadas | Ilimitadas |
| Nós de memória | 50 | Ilimitados | Ilimitados | Ilimitados |
| Projetos | 2 | Ilimitados | Ilimitados | Ilimitados |
| Pensamento proativo | ✗ | ✓ | ✓ | ✓ |
| Salas empresariais | ✗ | ✗ | Até 3 | Ilimitadas |
| Membros por Sala | — | — | Até 10 | Ilimitados |
| Exportação de Memória | ✗ | ✓ | ✓ | ✓ |
| Suporte | Comunidade | Email | Prioritário | SLA |

---

## Contribuindo

O Kora está em acesso antecipado. Contribuições são bem-vindas.

```bash
# Fork o repositório
# Crie sua branch
git checkout -b feature/nome-da-feature

# Faça suas alterações e commit
git commit -m "feat: descrição clara da mudança"

# Abra um Pull Request
```

Convencional Commits é preferido. Issues abertas para bugs e sugestões.

---

## Segurança

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**. Envie um email para `seguranca@kora.app` com detalhes. Respondemos em até 48 horas.

---

## Licença

MIT — use, modifique, distribua. Veja [`LICENSE`](./LICENSE) para detalhes.

---

<div align="center">

**◈**

*Feito com obstinação.*

[kora.app](https://kora.app) · [Documentação](./SETUP.md) · [Changelog](./CHANGELOG.md)

</div>
