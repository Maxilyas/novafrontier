import { mount } from 'svelte';
import App from './App.svelte';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/overlay.css';

const target = document.getElementById('app');
if (!target) throw new Error('#app introuvable');

mount(App, { target });
