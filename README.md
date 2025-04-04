# ChecklistApp

Een React Native Expo app met een Express.js backend. De app biedt functionaliteiten voor checklists, GPT AI-chat en gebruikersauthenticatie.

## Kenmerken

- Inloggen en registreren met Supabase authenticatie
- Home scherm met widgets
- Checklist functionaliteit met taken beheer
- GPT AI-chatfunctie via OpenAI API
- Donkere modus ondersteuning
- Backend API voor dataopslag en integratie

## Benodigdheden

- Node.js (≥ 18.x)
- Expo CLI
- Supabase account
- OpenAI API key

## Projectstructuur

```
ChecklistApp/
├── app/                 # Expo router pagina's
├── assets/              # Afbeeldingen en fonts
├── components/          # React Native componenten
├── constants/           # App constanten
├── hooks/               # Custom React hooks
├── server/              # Express.js backend
```

## Installatie

### Frontend

1. Installeer de dependencies:
   ```bash
   npm install
   ```

2. Start de Expo ontwikkelserver:
   ```bash
   npm start
   ```

### Backend

1. Ga naar de server directory:
   ```bash
   cd server
   ```

2. Installeer de dependencies:
   ```bash
   npm install
   ```

3. Start de development server:
   ```bash
   npm run dev
   ```

## Vercel Deployment

De Express.js backend kan eenvoudig op Vercel worden gehost:

1. Zorg dat je de Vercel CLI hebt geïnstalleerd:
   ```bash
   npm install -g vercel
   ```

2. Ga naar de server directory en deploy:
   ```bash
   cd server
   vercel
   ```

3. Configureer de environment variables in de Vercel dashboard:
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

4. Nadat je de backend hebt gedeployed, update de API_URL in je app bestanden:
   - `/app/gpt.tsx`
   - `/app/checklist.tsx`

## Supabase Setup

1. Maak een nieuwe Supabase project aan
2. Maak de volgende tabellen:
   - `tasks`: voor het opslaan van checklist taken
   - `chat_logs`: voor het opslaan van GPT chat-gesprekken

### Tasks tabel schema
```sql
CREATE TABLE public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

### Chat logs tabel schema
```sql
CREATE TABLE public.chat_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  is_bot boolean DEFAULT false,
  timestamp timestamp with time zone DEFAULT now()
);
```

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
