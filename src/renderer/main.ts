import { createApp } from 'vue';

import App from './pages/App.vue';
import './assets/styles/index.css';

createApp(App).mount('#app');
console.log(process['env'].WEB_PORT);
