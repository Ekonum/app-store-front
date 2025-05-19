<template>
  <div class="card chart-card">
    <h3>{{ chart.name }}</h3>
    <p><small>Chart: {{ chart.chart }} (v{{ chart.version }})</small></p>
    <p>{{ chart.description }}</p>
    <button :disabled="isInstalling" @click="installChart">
      {{ isInstalling ? 'Installation...' : 'Installer' }}
    </button>
    <p v-if="installMessage"
       :class="{ 'error-message': installError, 'success-message': !installError && installMessage }">{{
        installMessage
      }}</p>
  </div>
</template>

<script setup>
// ... (script setup existant) ...
import {ref} from 'vue';
import axios from 'axios';

const props = defineProps({
  chart: Object
});

const emit = defineEmits(['chartInstalled']);

const isInstalling = ref(false);
const installMessage = ref('');
const installError = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

async function installChart() {
  isInstalling.value = true;
  installMessage.value = '';
  installError.value = false;
  try {
    const values = props.chart.name === 'wordpress' ?
        {service: {type: "NodePort"}, wordpressEnableApacheSsl: false, wordpressEnableNginxSsl: false} :
        {service: {type: "NodePort"}};

    const response = await axios.post(`${apiBaseUrl}/charts/${props.chart.name}/install`, {
      values: values
    });
    installMessage.value = response.data.message || `Release ${response.data.release.name} en cours d'installation. Statut: ${response.data.release.status}`;
    emit('chartInstalled');
  } catch (error) {
    console.error("Erreur d'installation:", error);
    installMessage.value = error.response?.data?.error || error.message || "Erreur lors de l'installation.";
    installError.value = true;
  } finally {
    isInstalling.value = false;
    setTimeout(() => {
      installMessage.value = '';
    }, 7000); // Clear message after 7s
  }
}
</script>

<style scoped>
.card {
  border: 1px solid var(--border-color, #e0e0e0);
  padding: 16px;
  margin: 0; /* Sera géré par le gap du container parent */
  border-radius: 8px;
  background-color: var(--light-bg, #f9f9f9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  width: calc(33.333% - 11px); /* Pour 3 cartes par ligne avec gap de 16px */
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .card {
    width: calc(50% - 8px); /* 2 cartes par ligne */
  }
}

@media (max-width: 600px) {
  .card {
    width: 100%; /* 1 carte par ligne */
  }
}

.card h3 {
  margin-top: 0;
  color: var(--ekonum-dark-gray, #333);
}
.error-message {
  color: var(--error-color, red);
  font-size: 0.9em;
  margin-top: 8px;
}

.success-message {
  color: var(--success-color, green);
  font-size: 0.9em;
  margin-top: 8px;
}
button {
  background-color: var(--ekonum-blue, #3B8AC4);
  color: var(--button-text-color, white);
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s ease;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background-color: #2A6F9E; /* Un bleu un peu plus foncé pour le hover */
}
</style>