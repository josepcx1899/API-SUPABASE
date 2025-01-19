# API-SUPABASE

Este repositório contém uma API que integra várias APIs externas e utiliza a Supabase como backend. A API oferece funcionalidades de autenticação, incluindo login, registo, exclusão de conta, recuperação de palavra-passe e redefinição de palavra-passe.

## Funcionalidades da API

- **POST /login:** Permite que os utilizadores façam login utilizando o seu e-mail e palavra-passe.
- **POST /register:** Permite que novos utilizadores se registem criando uma nova conta.
- **DELETE /delete-account:** Permite que o utilizador exclua a sua conta da plataforma.
- **POST /forgot-password:** Permite que o utilizador recupere a sua palavra-passe através do envio de um código para o seu email.
- **POST /reset-password:** Permite que o utilizador redefina a sua palavra-passe com o código que recebeu no seu email.

## Sistema de APIs Integradas

A API faz uso das seguintes APIs externas para fornecer funcionalidades adicionais:

### 1. **Ipify**
   - **Descrição:** Ipify é uma API que devolve o endereço IP público do utilizador.
   - **Uso:** Utilizada para capturar o IP do utilizador.
   - **Documentação:** [Ipify API](https://www.ipify.org/)

### 2. **ProxyCheck.io**
   - **Descrição:** ProxyCheck.io oferece uma API para detectar se o IP de um utilizador está a usar um proxy ou VPN.
   - **Uso:** A API foi usada para descobrir se era proxy ou não.
   - **Documentação:** [ProxyCheck API](https://proxycheck.io/)

## Configuração da Supabase

A Supabase é utilizada como uma base de dados e armazenamento.

### Passo a Passo para Configuração:

1. **Criar uma Conta na Supabase:**
   - Acede a [Supabase](https://supabase.io/) e cria uma conta, caso não tenhas uma.
   - Cria um novo projeto no painel da Supabase.

2. **Configuração da Base de Dados:**
   - Após a criação do projeto, configura as tabelas necessárias para a aplicação. As tabelas mínimas para o funcionamento da API incluem:

  ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329973230726807634/image.png?ex=678c4997&is=678af817&hm=2e6bdb75f110afbe1eb471ea14a7ca39b61b132e243dd1e18fc338cd582135ea&=&format=webp&quality=lossless&width=558&height=406)

   - Insina estas colunas nas respetivas tabelas:
     ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329974068434305215/image.png?ex=678c4a5f&is=678af8df&hm=7eb92a368eac52fe19dd281636ead3098efd50d63a4c3576a8db923df8fe849e&=&format=webp&quality=lossless&width=1920&height=553)
     ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329974234017038367/image.png?ex=678c4a87&is=678af907&hm=a17c5b73f1da08e121f7b63c94765134fb789f89fbbbc4b4e3dd2ef0cb3c93f6&=&format=webp&quality=lossless&width=1920&height=387)
     ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329974527412928583/image.png?ex=678c4acd&is=678af94d&hm=3d2b3398edc300741642628a95cd79d4e0634fa6dadb8af12b22e1b9f9c5cf78&=&format=webp&quality=lossless&width=1920&height=630)
     ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329974658241396746/image.png?ex=678c4aec&is=678af96c&hm=3505e7eec771cd010aec40aae65215f5c176c4aa6d99557b3173af8eb26389f3&=&format=webp&quality=lossless&width=1920&height=768)

3. **Desabilitar "Enable Row Level Security":**
   ![Imagem](https://media.discordapp.net/attachments/1298566066598973583/1329975067848871956/image.png?ex=678c4b4d&is=678af9cd&hm=bbc8cfee5d0609b3c78c77659ee11d1792cb30cb26085c5d21dee9e1e5334d7a&=&format=webp&quality=lossless&width=1431&height=667)

4. **Configuração de Variáveis de Ambiente:**
   - No arquivo `.env` da tua aplicação, adiciona as seguintes variáveis:
     ```bash
     SUPABASE_URL=URL_SUPABASE
     SUPABASE_ANON_KEY=KEY_SUPABASE
     GMAIL_USER=GMAIL_EMAIL
     GMAIL_PASS=GMAIL_APP_PASS
     ```

### Pré-requisitos

- Docker
- Supabase
- Node.js
- Git

### Passos

1. Como Executar a API:
   ```bash
   git clone https://github.com/josepcx1899/API-SUPABASE.git
   cd API-SUPABASE
   docker-compose build
   docker-compose up
   ```


### Docker Hub
[Imagem Docker](https://hub.docker.com/repository/docker/jcaldex/api-supabase/)
