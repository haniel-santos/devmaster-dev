# 🎮 Dev Master

Uma plataforma gamificada de aprendizado de programação JavaScript, inspirada em apps como Duolingo, Mimo e SoloLearn.

![Dev Master](https://img.shields.io/badge/Dev%20Master-Aprenda%20JavaScript-yellow?style=for-the-badge)

## 📋 Sobre o Projeto

Dev Master é uma aplicação web que transforma o aprendizado de JavaScript em uma experiência de jogo envolvente. Os usuários progridem através de módulos de aprendizado, completam desafios de código, ganham pontos e competem em rankings.

## ✨ Funcionalidades

### 🎯 Sistema de Desafios
- Desafios de código com validação automática
- Editor JavaScript integrado com execução de código
- Feedback instantâneo sobre acertos e erros
- Sistema de dicas (consome energia)

### ⚡ Sistema de Energia
- 7 barras de energia máxima
- Cada execução de código consome 1 energia
- Regeneração automática ao longo do tempo
- Loja de energia para recargas

### 📚 Trilha de Aprendizado
- **Módulo 1**: Lógica de Programação
- **Módulo 2**: Arrays
- **Módulo 3**: Funções
- **Módulo 4**: Objetos
- **Módulo 5**: Mini-projetos JS

### 🏆 Gamificação
- Sistema de pontos e níveis (+25 pontos por desafio)
- Ranking global com medalhas (Ouro, Prata, Bronze)
- Conquistas desbloqueáveis
- Sistema de streak (dias consecutivos)

### 💎 Monetização
- Loja de energia com compras via Mercado Pago
- Assinatura Premium (R$19,99/mês) com energia ilimitada

### 🔐 Autenticação
- Login com email/senha
- Login com Google OAuth
- Recuperação de senha

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Lovable Cloud)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth
- **Pagamentos**: Mercado Pago
- **Deploy**: Lovable

## 🗄️ Estrutura do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados do usuário (nome, nível, pontos, streak) |
| `challenges` | Desafios de código com testes |
| `user_progress` | Progresso do usuário nos desafios |
| `user_energy` | Sistema de energia do usuário |
| `achievements` | Lista de conquistas disponíveis |
| `user_achievements` | Conquistas desbloqueadas |
| `energy_purchases` | Histórico de compras |

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre na pasta do projeto
cd dev-master

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

### Variáveis de Ambiente

O projeto utiliza Lovable Cloud, que configura automaticamente as variáveis de ambiente necessárias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 📱 Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/auth` | Login e cadastro |
| `/dashboard` | Menu principal |
| `/challenges` | Lista de desafios |
| `/learning-path` | Trilha de aprendizado |
| `/practice` | Modo prática (sem consumo de energia) |
| `/ranking` | Ranking global |
| `/profile` | Perfil do usuário |
| `/energy-shop` | Loja de energia |

## 🎨 Design

- Design minimalista inspirado em apps educacionais
- Tema claro/escuro
- Responsivo para mobile e desktop
- Animações e feedback visual

## 🔒 Segurança

- Row Level Security (RLS) em todas as tabelas
- Validação de código no servidor via Edge Functions
- Autenticação segura com Supabase Auth
- Webhooks seguros para pagamentos

## 📄 Licença

Este projeto foi desenvolvido com [Lovable](https://lovable.dev).

---

**Dev Master** - Aprenda JavaScript de forma divertida! 🚀
