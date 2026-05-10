---

./banner.jpg

<div align="center">

<img src="./logo.png" alt="Kora" width="72" height="72" />

Kora

Inteligência e Ligação Artificial

Ela não armazena o que você pensa. Ela aprende como você pensa.

<br />

https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel
https://img.shields.io/badge/licença-MIT-E8B84B?style=flat-square
https://img.shields.io/badge/versão-0.1.0-white?style=flat-square
https://img.shields.io/badge/status-acesso_antecipado-E8B84B?style=flat-square

</div>

---

O que é o Kora

O Kora é uma plataforma de IA pessoal que aprende como você pensa ao longo do tempo. Diferente de chatbots tradicionais, o Kora mantém contexto entre sessões e se adapta ao seu estilo de raciocínio.

---

Por que existe

A maioria das IAs trata cada conversa como um evento isolado. O Kora foi construído para resolver isso, mantendo uma compreensão contínua de quem você é e do que está construindo.

---

Como funciona

· Fundação: uma conversa inicial de boas-vindas que estabelece o tom da sua experiência
· Memória Local: suas informações pessoais ficam armazenadas apenas no seu dispositivo
· Privacidade por design: a plataforma processa contexto sem armazenar identificadores pessoais
· Experiência adaptativa: o sistema ajusta o tom e estilo com base na sua forma de interagir

---

Stack

Camada Tecnologia
Frontend HTML + CSS + JavaScript
Backend Node.js
Infraestrutura Serverless
Banco de dados MongoDB

---

Estrutura do Repositório

```
kora-mvp/
│
├── public/                    # Frontend estático
│   ├── index.html             # Landing page
│   ├── app.html               # Aplicação de chat
│   ├── onboarding.html        # Fluxo de boas-vindas
│   └── assets/                # CSS, JS, imagens
│
├── api/                       # Funções serverless
│   ├── auth/                  # Autenticação
│   └── chat/                  # Processamento de mensagens
│
├── lib/                       # Módulos compartilhados
├── .github/workflows/         # CI/CD
├── banner.jpg
├── logo.png
├── vercel.json
├── package.json
├── .env.example
├── .gitignore
├── SETUP.md
├── CHANGELOG.md
└── README.md
```

---

Rodando Localmente

Pré-requisitos

· Node.js 18+
· Conta no MongoDB Atlas (gratuito)

Instalação

```bash
git clone https://github.com/seu-usuario/kora-mvp.git
cd kora-mvp
npm install
cp .env.example .env.local
# Edite .env.local com suas chaves
npx vercel dev
```

Guia completo em SETUP.md.

---

Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

Adicione as variáveis de ambiente no painel da Vercel em Settings → Environment Variables.

---

Roadmap

Versão Status Descrição
0.1.0 ✅ Disponível Landing · Auth · Chat · Memória Local
0.3.0 🔨 Em desenvolvimento Projetos · Painel de memória · Sidebar
0.5.0 📋 Planejado Funcionalidades proativas · Visualização de contexto
1.0.0 📋 Planejado Lançamento público · Planos pagos
1.5.0+ 📋 Planejado Recursos empresariais · Upload de arquivos · Voz

---

Contribuindo

Contribuições são bem-vindas. Abra uma issue ou pull request.

```bash
git checkout -b feature/nome-da-feature
git commit -m "feat: descrição da mudança"
# Abra um Pull Request
```

---

Segurança

Encontrou uma vulnerabilidade? Envie um email para seguranca@kora.app. Não abra issues públicas.

---

Licença

MIT — veja LICENSE para detalhes.

---

<div align="center">

◈

Feito com obstinação.

kora.app · Documentação · Changelog

</div>

---
