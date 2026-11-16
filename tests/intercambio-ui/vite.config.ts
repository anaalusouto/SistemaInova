import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import tailwindcss from '@tailwindcss/vite';import path from 'node:path';
export default defineConfig({root:path.resolve('tests/intercambio-ui'),server:{host:'127.0.0.1',port:8097,strictPort:true,fs:{allow:[path.resolve('.')]}},plugins:[tailwindcss(),react()]});
