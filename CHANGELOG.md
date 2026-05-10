# Changelog

Todas as mudanças relevantes do projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.1.0] — 2025

### Adicionado
- Landing page com efeito de digitação ao vivo
- Sistema de autenticação completo com JWT e bcrypt
- Email nunca armazenado em texto — apenas hash irreversível
- Fluxo de Fundação: onboarding via conversa
- Engine de Memória Local — grafo de nós no dispositivo do usuário
- Roteador client-side com classificação de intenção
- Roteador server-side com fallback automático entre modelos
- Integração com múltiplos modelos de IA
- Chat funcional com renderização de Markdown
- Painel de Memória na sidebar
- Exportação do arquivo `.kora`
- CI/CD automático via GitHub Actions + Vercel

---

## [0.3.0] — Em desenvolvimento

### Planejado
- Projetos separados com memória isolada por projeto
- Painel de Memória visual com nós editáveis e deletáveis
- Sidebar real com navegação entre projetos e chats
- API de projetos (criar, listar, atualizar, arquivar)
