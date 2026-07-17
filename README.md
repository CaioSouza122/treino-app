# 🏋️‍♂️ Treino.AI

**Seu personal trainer no bolso, movido a Inteligência Artificial.**

Este é um projeto completo (Full-Stack) que utiliza o poder do **React Native (Expo)** no frontend e um backend robusto em **Python (FastAPI)** integrado à Inteligência Artificial do Google Gemini para planejar seus treinos físicos de forma hiperpersonalizada.

## 🚀 Tecnologias Integradas

- **Frontend Mobile:** React Native, Expo, StyleSheet (Tema Dark Premium)
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
- **Inteligência Artificial:** Google Generative AI (Gemini)
- **Banco de Dados:** PostgreSQL hospedado no [Neon.tech](https://neon.tech)

## 📱 Destaques do App

- Interface elegante (Navy Blue & Gold) pensada para usabilidade rápida.
- Entradas de dados otimizadas (Idade, Peso, Altura, Frequência).
- Seletor de tempo customizado nativo (de 15min a 120min).
- Geração de protocolo de treino diário dividido (Treino A, B, C...) adaptado à sua rotina.
- **💾 Persistência automática de perfil:** seus dados são salvos localmente e restaurados na próxima abertura do app.
- **☁️ Histórico de treinos:** todos os treinos gerados são salvos no PostgreSQL (Neon) e podem ser consultados no app.
- **⚙️ URL da API configurável:** configure o IP do servidor diretamente no app sem precisar recompilar.
- **📥 Exportação para Excel:** baixe seu treino completo em `.xlsx` com um clique, compatível com Google Sheets e Microsoft Excel.

---

## 🛠️ Como rodar o projeto localmente

### 1️⃣ Executando o Backend (Inteligência Artificial)

O cérebro do aplicativo. Ele receberá seus dados e pedirá para a IA gerar o treino ideal.

1. Acesse a pasta do backend:
   ```bash
   cd backend
   ```
2. Crie seu ambiente virtual Python (recomendado):
   ```bash
   python -m venv venv
   # No Windows:
   venv\Scripts\activate
   # No Mac/Linux:
   source venv/bin/activate
   ```
3. Instale as dependências essenciais:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configuração de API:** Copie o arquivo `.env.example` para `.env` e preencha suas chaves:
   ```env
   GEMINI_API_KEY=sua_chave_do_gemini
   DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require
   ```
   > A Connection String do Neon está disponível em: **neon.tech → seu projeto → Connection String**
5. Inicie o servidor (excluindo a pasta venv do reload automático):
   ```bash
   uvicorn app.main:app --reload --reload-dir app --reload-dir routes --reload-dir services --reload-dir database --reload-dir models --reload-dir schemas --host 0.0.0.0 --port 8000
   ```

### 2️⃣ Executando o Frontend (Mobile)

A interface em que o usuário irá interagir. 

1. Acesse a pasta do mobile e instale os pacotes:
   ```bash
   cd mobile/treinoapp
   npm install
   ```
2. Inicie o aplicativo com Expo:
   ```bash
   npx expo start
   ```
3. Agora basta abrir a câmera do seu celular com o aplicativo **Expo Go** instalado e ler o QR Code para acessar, ou pressionar a tecla `a` no terminal para emuladores Android!

## 🔒 Segurança (GitHub)
Este repositório está configurado para **ignorar automaticamente** suas chaves de API secretas e pastas de sistema pesadas, garantindo que tudo suba seguro!
