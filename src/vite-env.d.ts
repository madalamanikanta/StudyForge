/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite built-in environment variables
  readonly VITE_APP_ENV: 'development' | 'production' | 'test';
  
  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  // Application specific
  readonly NODE_ENV: 'development' | 'production' | 'test';
  
  // Add other environment variables here as needed
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_ENV__: 'development' | 'production' | 'test';
